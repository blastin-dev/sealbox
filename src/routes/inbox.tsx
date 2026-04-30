import { createFileRoute, Link } from "@tanstack/react-router";
import {
	CheckCircle2,
	Copy,
	Eye,
	EyeOff,
	KeyRound,
	RefreshCcw,
	ShieldCheck,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ConnectGate, UnlockDialog } from "../components/ConnectButton";
import { useDerivedKey } from "../components/DerivedKeyProvider";
import { newNonce } from "../lib/constants";
import { authSign, decryptWithPrivateKey } from "../lib/crypto";
import { inboxConsume, inboxList, inboxRetrieve } from "../lib/server/fns";

export const Route = createFileRoute("/inbox")({ component: Inbox });

type ListItem = {
	id: string;
	label: string;
	createdAt: number;
	submitted: boolean;
};

function Inbox() {
	const { address, isConnected } = useAccount();
	const { key } = useDerivedKey();
	const [items, setItems] = useState<ListItem[] | null>(null);
	const [revealedSecret, setRevealedSecret] = useState<{
		id: string;
		plaintext: string;
	} | null>(null);
	const [loading, setLoading] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const loadInbox = useCallback(async () => {
		if (!address || !key) return;
		setLoading(true);
		setErr(null);
		try {
			const nonce = newNonce();
			const authSig = authSign(key.authPrivateKey, nonce);
			const list = await inboxList({
				data: {
					address,
					authPubkey: key.authPublicKeyHex,
					authSig,
					nonce,
				},
			});
			setItems(list.sort((a, b) => b.createdAt - a.createdAt));
		} catch (e) {
			setErr(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [address, key]);

	useEffect(() => {
		if (key && items === null && !loading) {
			loadInbox();
		}
	}, [key, items, loading, loadInbox]);

	return (
		<>
			{isConnected && <UnlockDialog />}
			<Hero
				icon={<ShieldCheck className="size-5" />}
				title="Your inbox"
				subtitle="Submitted secrets stay encrypted until you reveal them in your browser."
			/>
			<div className="relative z-10 -mt-24 px-6 pb-16">
				<div className="mx-auto max-w-2xl">
					{!isConnected ? (
						<ConnectGate
							title="Connect your wallet"
							description="Connect a wallet to view secrets sent to you."
						/>
					) : !key ? (
						<LockedPlaceholder />
					) : (
						<Card className="shadow-xl shadow-primary/5">
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between gap-2">
									<p className="text-sm text-muted-foreground">
										{items
											? `${items.length} ${items.length === 1 ? "request" : "requests"}`
											: "Loading…"}
									</p>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={loadInbox}
										disabled={loading}
									>
										<RefreshCcw className="size-4" />
										{loading ? "Refreshing…" : "Refresh"}
									</Button>
								</div>

								{err && (
									<p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
										{err}
									</p>
								)}

								{items && items.length === 0 && <EmptyInbox />}

								{items && items.length > 0 && (
									<ul className="flex flex-col gap-3">
										{items.map((it) => (
											<InboxItem
												key={it.id}
												item={it}
												plaintext={
													revealedSecret?.id === it.id
														? revealedSecret.plaintext
														: null
												}
												onReveal={(plaintext) =>
													setRevealedSecret({ id: it.id, plaintext })
												}
												onHide={() =>
													setRevealedSecret((current) =>
														current?.id === it.id ? null : current,
													)
												}
												onConsumed={() => {
													setRevealedSecret((current) =>
														current?.id === it.id ? null : current,
													);
													setItems(
														(current) =>
															current?.filter(
																(currentItem) => currentItem.id !== it.id,
															) ?? current,
													);
												}}
											/>
										))}
									</ul>
								)}
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
		<section className="relative overflow-hidden bg-gradient-to-b from-primary/15 to-primary/8 pt-12 pb-32">
			<div className="mx-auto max-w-2xl px-6 text-center">
				<div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
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
					Unlock your vault to view secrets.
				</p>
			</CardContent>
		</Card>
	);
}

function InboxItem({
	item,
	plaintext,
	onReveal,
	onHide,
	onConsumed,
}: {
	item: ListItem;
	plaintext: string | null;
	onReveal: (plaintext: string) => void;
	onHide: () => void;
	onConsumed: () => void;
}) {
	const { address } = useAccount();
	const { key } = useDerivedKey();
	const [busy, setBusy] = useState(false);
	const [copied, setCopied] = useState(false);
	const [copiedSecret, setCopiedSecret] = useState(false);
	const [err, setErr] = useState<string | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);

	async function reveal() {
		if (!address || !key) return;
		setBusy(true);
		setErr(null);
		try {
			const nonce = newNonce();
			const authSig = authSign(key.authPrivateKey, nonce);
			const ct = await inboxRetrieve({
				data: {
					id: item.id,
					address,
					authPubkey: key.authPublicKeyHex,
					authSig,
					nonce,
				},
			});
			if (!ct) {
				setErr(
					"Nothing to reveal yet. The secret may not have been submitted, or it may already have been removed.",
				);
				return;
			}
			const pt = decryptWithPrivateKey(
				{ v: ct.v, epk: ct.epk, n: ct.n, ct: ct.ct },
				key.privateKey,
			);
			onReveal(pt);
		} catch (e) {
			setErr(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(false);
		}
	}

	async function consume() {
		if (!address || !key) return;
		setBusy(true);
		setErr(null);
		try {
			const nonce = newNonce();
			const authSig = authSign(key.authPrivateKey, nonce);
			await inboxConsume({
				data: {
					id: item.id,
					address,
					authPubkey: key.authPublicKeyHex,
					authSig,
					nonce,
				},
			});
			setConfirmOpen(false);
			onConsumed();
		} catch (e) {
			setErr(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(false);
		}
	}

	async function copyLink() {
		try {
			const url = `${window.location.origin}/req/${item.id}`;
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setErr(null);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setErr("Could not copy the link from this browser.");
		}
	}

	async function copySecret() {
		if (!plaintext) return;
		try {
			await navigator.clipboard.writeText(plaintext);
			setCopiedSecret(true);
			setErr(null);
			setTimeout(() => setCopiedSecret(false), 2000);
		} catch {
			setErr("Could not copy the secret from this browser.");
		}
	}

	useEffect(() => {
		if (!plaintext) {
			setCopiedSecret(false);
		}
	}, [plaintext]);

	const status = item.submitted ? "ready" : "waiting";

	return (
		<li className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<p className="truncate font-medium">{item.label}</p>
						<StatusBadge status={status} />
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						{new Date(item.createdAt).toLocaleString()}
					</p>
				</div>
				<div className="flex shrink-0 flex-wrap gap-2">
					{status === "ready" && !plaintext && (
						<Button type="button" size="sm" onClick={reveal} disabled={busy}>
							<Eye className="size-4" />
							{busy ? "Revealing…" : "Reveal"}
						</Button>
					)}
					{status === "waiting" && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={copyLink}
						>
							<Copy className="size-4" />
							{copied ? "Copied" : "Copy link"}
						</Button>
					)}
					{plaintext && (
						<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
							<DialogTrigger asChild>
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={busy}
								>
									<Trash2 className="size-4" />
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-md">
								<DialogHeader>
									<DialogTitle>Remove this secret?</DialogTitle>
									<DialogDescription>
										This deletes the encrypted copy from the server. You will
										not be able to reveal it again unless the sender submits a
										new one.
									</DialogDescription>
								</DialogHeader>
								<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
									<Button
										type="button"
										variant="ghost"
										onClick={() => setConfirmOpen(false)}
										disabled={busy}
									>
										Cancel
									</Button>
									<Button
										type="button"
										variant="destructive"
										onClick={consume}
										disabled={busy}
									>
										<Trash2 className="size-4" />
										{busy ? "Removing…" : "Remove"}
									</Button>
								</div>
							</DialogContent>
						</Dialog>
					)}
					{status === "ready" && plaintext && (
						<Button type="button" variant="outline" size="sm" onClick={onHide}>
							<EyeOff className="size-4" />
							Hide
						</Button>
					)}
				</div>
			</div>
			{plaintext && (
				<div className="mt-3 flex items-baseline justify-between gap-4 rounded-xl border border-emerald-500/20 bg-zinc-950 p-4">
					<pre className="min-w-0 flex-1 overflow-x-auto font-mono text-sm text-emerald-200">
						{plaintext}
					</pre>
					<Button
						type="button"
						size="sm"
						variant="secondary"
						onClick={copySecret}
						className="bg-white/10 text-emerald-100 hover:bg-white/15 hover:text-white dark:bg-white/10 dark:text-emerald-100"
					>
						<Copy className="size-4" />
						{copiedSecret ? "Copied" : "Copy"}
					</Button>
				</div>
			)}
			{err && (
				<p className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
					{err}
				</p>
			)}
		</li>
	);
}

function EmptyInbox() {
	return (
		<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center">
			<div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
				<CheckCircle2 className="size-5" />
			</div>
			<p className="text-sm font-medium">Nothing in the inbox yet.</p>
			<Button asChild variant="outline" size="sm">
				<Link to="/new">Create a request link</Link>
			</Button>
		</div>
	);
}

function StatusBadge({ status }: { status: "ready" | "waiting" }) {
	if (status === "ready") {
		return (
			<span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/20 dark:text-emerald-300">
				Ready
			</span>
		);
	}

	return (
		<span className="inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-900/80 dark:bg-amber-950/20 dark:text-amber-300">
			Waiting
		</span>
	);
}
