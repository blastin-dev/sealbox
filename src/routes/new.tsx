import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Check, Copy, KeyRound, Link2, Lock } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConnectGate, UnlockDialog } from "../components/ConnectButton";
import { useDerivedKey } from "../components/DerivedKeyProvider";
import { createRequest } from "../lib/server/fns";

export const Route = createFileRoute("/new")({ component: NewRequest });

function NewRequest() {
	const { address, isConnected } = useAccount();
	const { key } = useDerivedKey();
	const router = useRouter();
	const [label, setLabel] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [shareLink, setShareLink] = useState<string | null>(null);
	const [err, setErr] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!address || !key) return;
		setSubmitting(true);
		setErr(null);
		try {
			const { id } = await createRequest({
				data: {
					label,
					recipientPubkey: key.publicKeyHex,
					recipientAuthPubkey: key.authPublicKeyHex,
					recipientAddress: address,
				},
			});
			const url = `${window.location.origin}/req/${id}`;
			setShareLink(url);
			router.invalidate();
		} catch (e) {
			setErr(e instanceof Error ? e.message : String(e));
		} finally {
			setSubmitting(false);
		}
	}

	function resetRequest() {
		setLabel("");
		setShareLink(null);
		setErr(null);
	}

	return (
		<>
			{isConnected && <UnlockDialog />}
			<Hero
				icon={<Lock className="size-5" />}
				title="New request"
				subtitle="Generate a one-time link a client can use to send you a credential."
			/>
			<div className="relative z-10 -mt-24 px-6 pb-16">
				<div className="mx-auto max-w-md">
					{!isConnected ? (
						<ConnectGate
							title="Connect your wallet"
							description="Connect a wallet to create a request link."
						/>
					) : !key ? (
						<LockedPlaceholder />
					) : shareLink ? (
						<ShareLink
							url={shareLink}
							label={label || "Untitled request"}
							onReset={resetRequest}
						/>
					) : (
						<Card className="shadow-xl shadow-sky-500/10">
							<CardContent>
								<form onSubmit={onSubmit} className="flex flex-col gap-4">
									<div className="flex flex-col gap-2">
										<Label htmlFor="label">Label</Label>
										<Input
											id="label"
											required
											autoFocus
											autoComplete="off"
											value={label}
											onChange={(e) => setLabel(e.target.value)}
											placeholder="e.g. Gmail account for Acme onboarding"
										/>
									</div>
									<Button
										type="submit"
										size="lg"
										disabled={submitting || !label}
										className="bg-sky-500 text-white shadow-sm shadow-sky-500/30 hover:bg-sky-600"
									>
										{submitting ? "Creating…" : "Create request link"}
									</Button>
									{err && (
										<p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
											{err}
										</p>
									)}
								</form>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</>
	);
}

function Hero({
	icon,
	title,
	subtitle,
}: {
	icon: React.ReactNode;
	title: string;
	subtitle: string;
}) {
	return (
		<section className="relative overflow-hidden bg-gradient-to-b from-sky-500/15 to-sky-500/8 pt-12 pb-32">
			<div className="mx-auto max-w-2xl px-6 text-center">
				<div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm shadow-sky-500/30">
					{icon}
				</div>
				<h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
					{title}
				</h1>
				<p className="mt-3 text-base text-muted-foreground">{subtitle}</p>
			</div>
		</section>
	);
}

function LockedPlaceholder() {
	return (
		<Card className="border-dashed bg-muted/30 shadow-sm">
			<CardContent className="flex flex-col items-center gap-3 py-10 text-center">
				<div className="grid size-12 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
					<KeyRound className="size-5" />
				</div>
				<p className="text-sm text-muted-foreground">
					Unlock your vault to continue.
				</p>
			</CardContent>
		</Card>
	);
}

function ShareLink({
	url,
	label,
	onReset,
}: {
	url: string;
	label: string;
	onReset: () => void;
}) {
	const [copied, setCopied] = useState(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// clipboard may be unavailable (insecure context); fall back silently
		}
	}

	return (
		<Card className="border-emerald-200/70 shadow-xl shadow-emerald-500/5 dark:border-emerald-900/70">
			<CardHeader>
				<CardTitle className="text-xl">Request link ready</CardTitle>
				<CardDescription>
					Send <span className="font-medium text-foreground">{label}</span> the
					link below.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<code className="block overflow-x-auto break-all rounded-md border bg-muted/30 px-3 py-2 text-sm">
					{url}
				</code>
				<div className="flex flex-col gap-2 sm:flex-row">
					<Button
						type="button"
						onClick={copy}
						className="bg-sky-500 text-white shadow-sm shadow-sky-500/30 hover:bg-sky-600 sm:flex-1"
					>
						{copied ? (
							<>
								<Check className="size-4" />
								Copied
							</>
						) : (
							<>
								<Copy className="size-4" />
								Copy link
							</>
						)}
					</Button>
					<Button type="button" variant="outline" asChild className="sm:flex-1">
						<a href={url} target="_blank" rel="noreferrer noopener">
							<Link2 className="size-4" />
							Open
						</a>
					</Button>
				</div>
				<div className="flex justify-center gap-2 pt-2 text-sm">
					<button
						type="button"
						onClick={onReset}
						className="text-muted-foreground underline-offset-4 hover:underline"
					>
						Create another
					</button>
				</div>
			</CardContent>
		</Card>
	);
}
