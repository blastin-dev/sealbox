# Sealbox

Live at: https://sealbox.app | git: https://github.com/blastin-dev/sealbox

Request credentials from a client securely, without trusting a third-party password manager or SaaS. The client encrypts in their browser to a public key derived from your crypto wallet; only your wallet can decrypt. The server only ever sees ciphertext.

## How the flow works

### 1. You create the request

- Open `/request`, connect your wallet.
- Sign a one-time derivation message — your browser hashes the signature into an **x25519 private key** and derives the matching **public key**.
- Type a label ("Gmail for Acme onboarding"), click **Create request link**.
- A server function stores `{ id, label, your_pubkey, your_wallet_address }` in Cloudflare KV.
- You get a URL like `https://sealbox.app/req/abc123`. Share it however you like — email, Slack, SMS, QR code.

**What leaves your browser:** only your public key, the label, and your wallet address. The private key stays in React memory, never hits the server, never persists to disk.

### 2. Your client opens the link

- No wallet, no login, no account required.
- Their browser loads `/req/abc123`, which fetches `{ label, your_pubkey }`.
- They type the message and click **Encrypt & send**.
- In their browser:
  - Generate a one-time ephemeral x25519 keypair
  - `ECDH(ephemeral_private, your_pubkey)` → shared secret
  - HKDF → symmetric key
  - XChaCha20-Poly1305 encrypt the message
  - POST `{ ephemeral_pubkey, nonce, ciphertext }` to the Worker

**What leaves their browser:** only the ciphertext blob. The plaintext is never transmitted. The ephemeral private key is discarded immediately after encryption — nobody keeps it.

### 3. The ciphertext sits in KV

- Keyed by request ID, 7-day TTL from submission — auto-expires whether or not you retrieve it.
- **Nobody can decrypt it** — not you without signing, not the server, not Cloudflare, not an attacker who dumps the namespace.

### 4. You retrieve and decrypt

- Open `/inbox`, connect wallet, sign the derivation message (same as step 1 → same private key).
- Sign a nonce to prove wallet ownership; the Worker returns your pending requests.
- Tap an item to reveal it:
  - Sign another nonce → Worker returns the ciphertext
  - In your browser: `ECDH(your_private, ephemeral_pubkey)` reproduces the same shared secret the client computed → HKDF → symmetric key → decrypt
  - Plaintext renders on screen
- Click the trash icon to wipe the ciphertext from KV.

## Security summary

| Actor | Can see plaintext? |
|---|---|
| Client (sender) | Yes — they typed it |
| You (recipient) | Yes — after decrypting in-browser |
| Cloudflare / the server | **No** — only ciphertext passes through |
| Anyone intercepting traffic | **No** — ciphertext |
| Someone who dumps KV later | **No** — ciphertext |
| An attacker with your wallet | Yes — equivalent to them having your password-manager master key |

**Threat model:** if your wallet is compromised, secrets you've received are compromised. Otherwise, they're safe.

The derived key comes from `sha256(wallet_signature)` of a fixed message, so signing with the same wallet **always produces the same key** — you can come back tomorrow, sign again, and decrypt older ciphertexts. Lose the wallet and those ciphertexts are unrecoverable by design.

## Stack

- **TanStack Start** (React, server functions, file-based routing)
- **Cloudflare Workers + KV** for storage
- **wagmi + viem** for wallet connection and signature verification
- **@noble/curves + @noble/ciphers + @noble/hashes** for x25519 / XChaCha20-Poly1305 / HKDF
- **Tailwind v4 + Biome**

## Running locally

```bash
pnpm install
pnpm dev
```

The Cloudflare Vite plugin runs the app inside a local workerd runtime with a local KV namespace — no wrangler dev needed.

## Deploying

Deploys are driven by GitHub Releases. Pushing to `main` does **not** ship anything — you cut a tagged release and the workflow deploys it.

First-time setup:

1. Create the KV namespace and paste its id into `wrangler.jsonc`:

   ```bash
   npx wrangler kv namespace create REQUESTS
   ```

   ```jsonc
   "kv_namespaces": [
     { "binding": "REQUESTS", "id": "<paste-the-id-here>" }
   ]
   ```

2. Add `CLOUDFLARE_API_TOKEN` to repo secrets (Settings → Secrets and variables → Actions). The token needs `Account.Workers Scripts:Edit` and `Zone.Workers Routes:Edit` for `sealbox.app`.

To ship:

```bash
gh release create v1.0.0 --generate-notes
```

`.github/workflows/deploy.yml` runs on `release: published`, builds the bundle with the tag + commit baked in, then `wrangler deploy`s. The release tag shows up in the footer and on `/version` so users can map the live site to a specific tagged commit + GitHub Release notes.

For an emergency redeploy without a new release, trigger the workflow manually (Actions → Deploy → Run workflow). The build will be tagged with whatever ref you dispatched from.

## Scripts

```bash
pnpm run dev       # local dev
pnpm run build     # type-safe production build
pnpm run deploy    # build + wrangler deploy
pnpm run check     # biome lint + format check
pnpm run test      # vitest
```

## Project layout

```
src/
├── lib/
│   ├── crypto.ts              x25519 + XChaCha20-Poly1305 ECIES
│   ├── constants.ts           signing messages shared client+server
│   ├── build.ts               build-time provenance constants
│   ├── wagmi.ts               wagmi config
│   └── server/
│       ├── fns.ts             server functions (create, fetch, submit, inbox*)
│       └── kv.ts              KV accessors
├── components/
│   ├── WalletProvider.tsx     WagmiProvider + QueryClient + DerivedKeyProvider
│   ├── DerivedKeyProvider.tsx derived x25519 keypair in React context
│   └── ConnectButton.tsx
└── routes/
    ├── index.tsx              landing
    ├── request.tsx            admin: create request link (wallet-gated)
    ├── req.$id.tsx            client: wallet-less encrypt form
    ├── inbox.tsx              admin: list, decrypt, delete
    └── version.tsx            build provenance (commit SHA, CI run)
```

## Build provenance

Every deploy of [sealbox.app](https://sealbox.app) is built from a tagged GitHub Release by GitHub Actions and labelled with both the release tag and the commit it was built from. To verify what's running:

1. Open [/version](https://sealbox.app/version) — it lists the release tag, commit SHA, repository, CI run, and build timestamp baked into the deployed bundle. The footer shows the tag (or short SHA, for non-release builds) linking to the same page.
2. Click through to the release, commit, and workflow run — all must exist in this public repo and the tag must point at the listed commit. If they don't, the deploy is suspect.

### How it works

- `.github/workflows/deploy.yml` runs on `release: published` (plus manual dispatch). It exports `GIT_SHA`, `GIT_TAG`, `GIT_REPO`, `GIT_RUN_URL`, `GIT_RELEASE_URL`, and `BUILT_AT` into the build environment.
- `vite.config.ts` uses `define` to inline those values at compile time as `__GIT_SHA__` etc.
- `src/lib/build.ts` re-exports them as typed constants consumed by the footer badge and `/version` page.
- A local build (no env set) falls back to `dev` and the footer badge is hidden, so unpinned builds are visually distinct.

### Cryptographic verification

The transparency layer above can be lied to — a hostile deploy could just bake any SHA into the bundle. To protect against that, every release also publishes a **signed SLSA build provenance attestation** via [`actions/attest-build-provenance`](https://github.com/actions/attest-build-provenance).

The attestation is a Sigstore-signed statement, tied to GitHub's OIDC identity, declaring "this artifact was produced by *this* workflow on *this* commit in *this* repo." Forging it would require compromising Sigstore's transparency log or GitHub's OIDC issuer.

To verify a release end-to-end:

```bash
# Pick the release and download its artifact
gh release download v1.0.0 --repo blastin-dev/sealbox -p '*.tar.gz'

# Verify the attestation (requires gh CLI 2.49+)
gh attestation verify sealbox-v1.0.0.tar.gz --repo blastin-dev/sealbox

# Inspect what's in the artifact
tar -tzf sealbox-v1.0.0.tar.gz
```

`gh attestation verify` succeeds only if the artifact's hash matches an attestation signed for `blastin-dev/sealbox`. If the live site claims tag `v1.0.0` on `/version` but the published artifact for `v1.0.0` doesn't match what the page is loading, that's now a verifiable, non-repudiable mismatch.

### Residual gaps

Even with attestation, there's still one trust hop: Cloudflare. The attestation proves what was *uploaded* to Cloudflare; it can't prove Cloudflare serves the same bytes back to every user. Mitigating that would require running your own CDN or building a verifier page that hashes received chunks against a published manifest. Out of scope for now.

## License

MIT. See `LICENSE`.

## Known simplifications

- Auth nonce is `Date.now()` with a 5-minute window — good enough for anti-replay at this scale. A KV-tracked single-use nonce would be stronger.
- Only browser-extension wallets are wired in (MetaMask, Trust Wallet, Brave Wallet). To add WalletConnect / Coinbase / etc., extend `src/lib/wagmi.ts`.
- `mainnet` is configured but nothing actually touches mainnet — signing is chain-agnostic, the chain is just a placeholder for wagmi.
- Build provenance attests the artifact uploaded to Cloudflare, not the bytes Cloudflare serves to each user. Closing that gap would require a client-side verifier that hashes received chunks against a published manifest.
