# Sealbox

Open source: https://github.com/blastin-dev/sealbox

Request credentials from a client securely, without trusting a third-party password manager or SaaS. The client encrypts in their browser to a public key derived from your crypto wallet; only your wallet can decrypt. The server only ever sees ciphertext.

## How the flow works

### 1. You create the request

- Open `/new`, connect your wallet.
- Sign a one-time derivation message — your browser hashes the signature into an **x25519 private key** and derives the matching **public key**.
- Type a label ("Gmail for Acme onboarding"), click **Create request link**.
- A server function stores `{ id, label, your_pubkey, your_wallet_address }` in Cloudflare KV.
- You get a URL like `https://yourapp.com/req/abc123`. Share it however you like — email, Slack, SMS, QR code.

**What leaves your browser:** only your public key, the label, and your wallet address. The private key stays in React memory, never hits the server, never persists to disk.

### 2. Your client opens the link

- No wallet, no login, no account required.
- Their browser loads `/req/abc123`, which fetches `{ label, your_pubkey }`.
- They type the password and click **Encrypt & send**.
- In their browser:
  - Generate a one-time ephemeral x25519 keypair
  - `ECDH(ephemeral_private, your_pubkey)` → shared secret
  - HKDF → symmetric key
  - XChaCha20-Poly1305 encrypt the password
  - POST `{ ephemeral_pubkey, nonce, ciphertext }` to the Worker

**What leaves their browser:** only the ciphertext blob. The plaintext password is never transmitted. The ephemeral private key is discarded immediately after encryption — nobody keeps it.

### 3. The ciphertext sits in KV

- Keyed by request ID, 7-day TTL, auto-expires if you don't retrieve it.
- **Nobody can decrypt it** — not you without signing, not the server, not Cloudflare, not an attacker who dumps the namespace.

### 4. You retrieve and decrypt

- Open `/inbox`, connect wallet, sign the derivation message (same as step 1 → same private key).
- Sign a nonce to prove wallet ownership; the Worker returns your pending requests.
- Click **Decrypt** on an item:
  - Sign another nonce → Worker returns the ciphertext
  - In your browser: `ECDH(your_private, ephemeral_pubkey)` reproduces the same shared secret the client computed → HKDF → symmetric key → decrypt
  - Plaintext renders on screen
- Click **Delete from server** to wipe the ciphertext from KV.

## Security summary

| Actor | Can see plaintext? |
|---|---|
| Client (sender) | Yes — they typed it |
| You (recipient) | Yes — after decrypting in-browser |
| Cloudflare / the server | **No** — only ciphertext passes through |
| Anyone intercepting traffic | **No** — ciphertext |
| Someone who dumps KV later | **No** — ciphertext |
| An attacker with your wallet | Yes — equivalent to them having your password-manager master key |

**Threat model:** if your wallet is compromised, passwords you've received are compromised. Otherwise, they're safe.

The derived key comes from `sha256(wallet_signature)` of a fixed message, so signing with the same wallet **always produces the same key** — you can come back tomorrow, sign again, and decrypt older ciphertexts. Lose the wallet and those ciphertexts are unrecoverable by design.

## Stack

- **TanStack Start** (React, server functions, file-based routing)
- **Cloudflare Workers + KV** for storage
- **wagmi + viem** for wallet connection and signature verification
- **@noble/curves + @noble/ciphers + @noble/hashes** for x25519 / XChaCha20-Poly1305 / HKDF
- **Tailwind v4 + Biome**

## Running locally

```bash
npm install
npm run dev
```

The Cloudflare Vite plugin runs the app inside a local workerd runtime with a local KV namespace — no wrangler dev needed.

## Deploying

1. Create the KV namespace:

   ```bash
   npx wrangler kv namespace create REQUESTS
   ```

2. Replace the placeholder id in `wrangler.jsonc`:

   ```jsonc
   "kv_namespaces": [
     { "binding": "REQUESTS", "id": "<paste-the-id-here>" }
   ]
   ```

3. Regenerate binding types and deploy:

   ```bash
   npx wrangler types
   npm run deploy
   ```

## Scripts

```bash
npm run dev       # local dev
npm run build     # type-safe production build
npm run deploy    # build + wrangler deploy
npm run check     # biome lint + format check
npm run test      # vitest
```

## Project layout

```
src/
├── lib/
│   ├── crypto.ts              x25519 + XChaCha20-Poly1305 ECIES
│   ├── constants.ts           signing messages shared client+server
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
    ├── new.tsx                admin: create request link (wallet-gated)
    ├── req.$id.tsx            client: wallet-less encrypt form
    └── inbox.tsx              admin: list, decrypt, delete
```

## License

MIT. See `LICENSE`.

## Known simplifications

- No rate limiting on the submit endpoint. Add a Workers Rate Limiting binding before exposing publicly.
- Auth nonce is `Date.now()` with a 5-minute window — good enough for anti-replay at this scale. A KV-tracked single-use nonce would be stronger.
- Only browser-extension wallets are wired in (MetaMask, Trust Wallet, Brave Wallet). To add WalletConnect / Coinbase / etc., extend `src/lib/wagmi.ts`.
- `mainnet` is configured but nothing actually touches mainnet — signing is chain-agnostic, the chain is just a placeholder for wagmi.
