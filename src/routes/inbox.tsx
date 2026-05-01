import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	CheckCircle2,
	Copy,
	Eye,
	EyeOff,
	KeyRound,
	Loader2,
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
import { cn } from "@/lib/utils";
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
							description="Connect a crypto wallet (MetaMask, Trust, Brave) to view messages sent to you."
						/>
					) : !key ? (
						<LockedPlaceholder />
					) : (
						<Card className="shadow-xl shadow-violet-500/10">
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between gap-2">
									{revealedSecret ? (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => setRevealedSecret(null)}
										>
											<ArrowLeft className="size-4" />
											Back to inbox
										</Button>
									) : (
										<p className="text-sm text-muted-foreground">
											{items
												? `${items.length} ${items.length === 1 ? "request" : "requests"}`
												: "Loading…"}
										</p>
									)}
									{!revealedSecret && (
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
									)}
								</div>

								{err && (
									<p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
										{err}
									</p>
								)}

								{items && items.length === 0 && <EmptyInbox />}

								{items && items.length > 0 && (
									<ul className="flex flex-col gap-3">
										{(revealedSecret
											? items.filter((it) => it.id === revealedSecret.id)
											: items
										).map((it) => (
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
		<section className="relative overflow-hidden bg-gradient-to-b from-violet-500/15 to-violet-500/8 pt-12 pb-32">
			<div className="mx-auto max-w-2xl px-6 text-center">
				<div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-violet-500 text-white shadow-sm shadow-violet-500/30">
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

	const interactive = status === "ready";
	const toggle = () => {
		if (busy) return;
		if (plaintext) onHide();
		else reveal();
	};

	return (
		<li
			className={cn(
				"overflow-hidden rounded-xl border bg-card shadow-sm transition-all",
				plaintext && "shadow-md ring-1 ring-violet-500/30",
				!plaintext && interactive && "hover:shadow-md",
			)}
		>
			<div className="flex items-start justify-between gap-3 p-4">
				{interactive ? (
					<button
						type="button"
						onClick={toggle}
						disabled={busy}
						aria-expanded={!!plaintext}
						className="-m-1 flex min-w-0 flex-1 items-start justify-between gap-3 rounded-md p-1 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-progress disabled:opacity-70"
					>
						<div className="min-w-0 flex-1">
							<div className="flex flex-wrap items-center gap-2">
								<p className="truncate font-medium">{item.label}</p>
								<StatusBadge status={status} />
							</div>
							<p className="mt-1 text-xs text-muted-foreground">
								{new Date(item.createdAt).toLocaleString()}
							</p>
						</div>
						<span
							className={cn(
								"grid size-9 shrink-0 place-items-center rounded-md text-violet-600 dark:text-violet-300",
								plaintext
									? "bg-violet-100 dark:bg-violet-950/40"
									: "bg-violet-50 dark:bg-violet-950/20",
							)}
						>
							{busy ? (
								<Loader2 className="size-4 animate-spin" />
							) : plaintext ? (
								<EyeOff className="size-4" />
							) : (
								<Eye className="size-4" />
							)}
						</span>
					</button>
				) : (
					<>
						<div className="min-w-0 flex-1">
							<div className="flex flex-wrap items-center gap-2">
								<p className="truncate font-medium">{item.label}</p>
								<StatusBadge status={status} />
							</div>
							<p className="mt-1 text-xs text-muted-foreground">
								{new Date(item.createdAt).toLocaleString()}
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={copyLink}
						>
							<Copy className="size-4" />
							{copied ? "Copied" : "Copy link"}
						</Button>
					</>
				)}
			</div>
			{plaintext && (
				<div className="mx-4 mb-4 flex items-baseline justify-between gap-4 rounded-xl border border-emerald-500/20 bg-zinc-950 p-4">
					<pre className="min-w-0 flex-1 overflow-x-auto font-mono text-sm text-emerald-200">
						{plaintext}
					</pre>
					<div className="flex items-center gap-1">
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
						<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
							<DialogTrigger asChild>
								<Button
									type="button"
									size="icon"
									variant="ghost"
									disabled={busy}
									aria-label="Remove encrypted copy"
									className="size-8 text-emerald-100/60 hover:bg-white/10 hover:text-emerald-100"
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
					</div>
				</div>
			)}
			{err && (
				<p className="mx-4 mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
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
				<Link to="/request">Create a request link</Link>
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
