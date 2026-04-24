import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConnectButton } from "../components/ConnectButton";
import { useDerivedKey } from "../components/DerivedKeyProvider";
import { createRequest } from "../lib/server/fns";

export const Route = createFileRoute("/new")({ component: NewRequest });

function NewRequest() {
	const { address, isConnected } = useAccount();
	const { key, isDeriving, derive } = useDerivedKey();
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

	return (
		<div className="mx-auto max-w-xl px-6 py-12">
			<h1 className="text-2xl font-semibold">New request</h1>

			<div className="mt-6">
				<ConnectButton />
			</div>

			{isConnected && !key && (
				<div className="mt-6 rounded-md border bg-amber-50 p-4 dark:bg-amber-950/30">
					<p className="text-sm">
						Sign a one-time message to derive your encryption key. You'll be
						asked again on each new session.
					</p>
					<Button
						type="button"
						onClick={() => derive()}
						disabled={isDeriving}
						className="mt-3"
						size="sm"
					>
						{isDeriving ? "Waiting for signature…" : "Derive key"}
					</Button>
				</div>
			)}

			{key && (
				<form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="label">Label (shown to the client)</Label>
						<Input
							id="label"
							required
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder="e.g. Gmail account for Acme onboarding"
						/>
					</div>
					<Button type="submit" disabled={submitting || !label}>
						{submitting ? "Creating…" : "Create request link"}
					</Button>
					{err && <p className="text-sm text-destructive">{err}</p>}
				</form>
			)}

			{shareLink && <ShareLink url={shareLink} />}
		</div>
	);
}

function ShareLink({ url }: { url: string }) {
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
		<div className="mt-8 rounded-md border bg-green-50 p-4 dark:bg-green-950/30">
			<p className="text-sm font-medium">Share this link with your client:</p>
			<div className="mt-3 flex gap-2">
				<code className="flex-1 overflow-x-auto rounded bg-background px-3 py-2 text-xs">
					{url}
				</code>
				<Button
					type="button"
					onClick={copy}
					variant="outline"
					size="icon"
					aria-label="Copy link"
				>
					{copied ? (
						<Check className="size-4 text-green-600" />
					) : (
						<Copy className="size-4" />
					)}
				</Button>
			</div>
			<p className="mt-3 text-xs text-muted-foreground">
				{copied ? "Copied to clipboard." : "The link works exactly once."}
			</p>
		</div>
	);
}
