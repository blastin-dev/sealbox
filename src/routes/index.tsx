import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Github,
	Inbox,
	KeyRound,
	Link2,
	Lock,
	LockKeyhole,
	ShieldCheck,
} from "lucide-react";

const REPO_URL = "https://github.com/blastin-dev/sealbox";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div className="mx-auto max-w-5xl px-6 py-16">
			<section className="max-w-2xl">
				<a
					href={REPO_URL}
					target="_blank"
					rel="noreferrer noopener"
					className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
				>
					<Github className="size-3.5" />
					Open source on GitHub
				</a>
				<h1 className="mt-4 text-5xl font-bold tracking-tight">
					Collect passwords without ever seeing the server touch them.
				</h1>
				<p className="mt-6 text-lg text-muted-foreground">
					Sealbox lets a client send you a credential over a one-time link.
					Their browser encrypts it to a key derived from your crypto wallet —
					only your wallet can decrypt. No SaaS, no password manager, no plaintext
					in transit or at rest.
				</p>
				<div className="mt-8 flex gap-3">
					<Button asChild size="lg">
						<Link to="/new">Create a request link</Link>
					</Button>
					<Button asChild variant="outline" size="lg">
						<Link to="/inbox">Open inbox</Link>
					</Button>
				</div>
			</section>

			<section className="mt-20">
				<h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
				<p className="mt-2 text-muted-foreground">
					Four steps, one round-trip. The server only ever sees ciphertext.
				</p>
				<div className="mt-8 grid gap-4 md:grid-cols-2">
					<Step
						icon={<KeyRound className="size-5" />}
						index={1}
						title="You create the request"
						body="Connect your wallet, sign a one-time derivation message, and your browser hashes the signature into an x25519 keypair. A server function stores only the public key and a label."
					/>
					<Step
						icon={<Link2 className="size-5" />}
						index={2}
						title="Share the link"
						body="You get a URL like /req/abc123. Send it however you like — email, Slack, SMS, QR. The recipient needs no wallet and no account."
					/>
					<Step
						icon={<LockKeyhole className="size-5" />}
						index={3}
						title="The client encrypts in-browser"
						body="Their browser does ECDH to your public key, derives a symmetric key via HKDF, and seals the password with XChaCha20-Poly1305. Only the ciphertext leaves their device."
					/>
					<Step
						icon={<Inbox className="size-5" />}
						index={4}
						title="You retrieve and decrypt"
						body="Open your inbox, sign to prove wallet ownership, and decrypt in-browser. Delete the ciphertext from KV when you're done — or let the 7-day TTL do it for you."
					/>
				</div>
			</section>

			<section className="mt-20">
				<h2 className="text-2xl font-semibold tracking-tight">
					Who can see the plaintext?
				</h2>
				<div className="mt-6 overflow-hidden rounded-lg border">
					<table className="w-full text-sm">
						<thead className="bg-muted text-left">
							<tr>
								<th className="px-4 py-3 font-medium">Actor</th>
								<th className="px-4 py-3 font-medium">Can decrypt?</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							<Row actor="Client (sender)" answer="yes" note="they typed it" />
							<Row
								actor="You (recipient)"
								answer="yes"
								note="after decrypting in-browser"
							/>
							<Row
								actor="Cloudflare / the server"
								answer="no"
								note="only ciphertext passes through"
							/>
							<Row
								actor="Someone intercepting traffic"
								answer="no"
								note="ciphertext only"
							/>
							<Row
								actor="Someone who dumps KV later"
								answer="no"
								note="ciphertext only"
							/>
							<Row
								actor="An attacker with your wallet"
								answer="yes"
								note="equivalent to your password-manager master key"
							/>
						</tbody>
					</table>
				</div>
				<p className="mt-4 text-sm text-muted-foreground">
					<ShieldCheck className="mr-1 inline size-4 align-[-2px]" />
					<strong className="font-medium text-foreground">Threat model:</strong>{" "}
					if your wallet is compromised, so are the passwords you've received.
					Otherwise, they're safe. Sign with the same wallet tomorrow and you get
					the same key back — lose the wallet and those ciphertexts are
					unrecoverable by design.
				</p>
			</section>

			<section className="mt-20">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Lock className="size-5" />
							Ready when you are
						</CardTitle>
						<CardDescription>
							Create a request link in under a minute — no server state, no
							accounts, no third-party trust.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-3">
						<Button asChild>
							<Link to="/new">New request</Link>
						</Button>
						<Button asChild variant="outline">
							<Link to="/inbox">Open inbox</Link>
						</Button>
						<Button asChild variant="ghost">
							<a href={REPO_URL} target="_blank" rel="noreferrer noopener">
								<Github className="size-4" />
								View source
							</a>
						</Button>
					</CardContent>
				</Card>
			</section>

			<footer className="mt-16 border-t pt-6 text-sm text-muted-foreground">
				<p>
					Sealbox is open source.{" "}
					<a
						href={REPO_URL}
						target="_blank"
						rel="noreferrer noopener"
						className="font-medium text-foreground underline-offset-4 hover:underline"
					>
						Read the code, audit the crypto, self-host it.
					</a>
				</p>
			</footer>
		</div>
	);
}

function Step({
	icon,
	index,
	title,
	body,
}: {
	icon: React.ReactNode;
	index: number;
	title: string;
	body: string;
}) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-3">
					<div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
						{icon}
					</div>
					<div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
						Step {index}
					</div>
				</div>
				<CardTitle className="mt-3">{title}</CardTitle>
			</CardHeader>
			<CardContent className="text-sm text-muted-foreground">{body}</CardContent>
		</Card>
	);
}

function Row({
	actor,
	answer,
	note,
}: {
	actor: string;
	answer: "yes" | "no";
	note: string;
}) {
	return (
		<tr>
			<td className="px-4 py-3 font-medium">{actor}</td>
			<td className="px-4 py-3">
				<span
					className={
						answer === "no"
							? "font-semibold text-foreground"
							: "text-muted-foreground"
					}
				>
					{answer === "no" ? "No" : "Yes"}
				</span>
				<span className="text-muted-foreground"> — {note}</span>
			</td>
		</tr>
	);
}
