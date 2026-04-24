import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { encryptForRecipient } from "../lib/crypto";
import { fetchRequest, submitCiphertext } from "../lib/server/fns";

export const Route = createFileRoute("/req/$id")({
	component: RequestPage,
	loader: async ({ params }) => {
		return fetchRequest({ data: params.id });
	},
});

function RequestPage() {
	const req = Route.useLoaderData();
	const [message, setMessage] = useState("");
	const [revealed, setRevealed] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [done, setDone] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!message) return;
		setSubmitting(true);
		setErr(null);
		try {
			const payload = encryptForRecipient(message, req.recipientPubkey);
			await submitCiphertext({
				data: { id: req.id, epk: payload.epk, n: payload.n, ct: payload.ct },
			});
			setMessage("");
			setDone(true);
		} catch (e) {
			setErr(e instanceof Error ? e.message : String(e));
		} finally {
			setSubmitting(false);
		}
	}

	if (req.submitted) {
		return (
			<Shell>
				<h1 className="text-2xl font-semibold">Already submitted</h1>
				<p className="mt-2 text-muted-foreground">
					This request has already been fulfilled. If you need to re-send, ask
					the recipient to create a new request.
				</p>
			</Shell>
		);
	}

	if (done) {
		return (
			<Shell>
				<h1 className="text-2xl font-semibold text-green-700 dark:text-green-500">
					Sent securely
				</h1>
				<p className="mt-2 text-muted-foreground">
					Your message was encrypted in your browser and is now only decryptable
					by the recipient's wallet. You can close this page.
				</p>
			</Shell>
		);
	}

	return (
		<Shell>
			<h1 className="text-2xl font-semibold">{req.label}</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				Type anything you want to share — a password, username, 2FA codes, a
				whole block of credentials. Everything is encrypted in your browser to
				the recipient's public key before being sent; the server never sees it
				in plaintext.
			</p>
			<form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="message">Message</Label>
						<button
							type="button"
							onClick={() => setRevealed((r) => !r)}
							className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
						>
							{revealed ? (
								<>
									<EyeOff className="size-3.5" />
									Hide
								</>
							) : (
								<>
									<Eye className="size-3.5" />
									Show
								</>
							)}
						</button>
					</div>
					<AutoTextarea
						id="message"
						value={message}
						onChange={setMessage}
						revealed={revealed}
					/>
				</div>
				<Button type="submit" disabled={submitting || !message}>
					{submitting ? "Encrypting…" : "Encrypt & send"}
				</Button>
				{err && <p className="text-sm text-destructive">{err}</p>}
			</form>
			<p className="mt-6 text-xs text-muted-foreground">
				Recipient:{" "}
				<code className="font-mono">
					{req.recipientAddress.slice(0, 6)}…{req.recipientAddress.slice(-4)}
				</code>
			</p>
		</Shell>
	);
}

function AutoTextarea({
	id,
	value,
	onChange,
	revealed,
}: {
	id: string;
	value: string;
	onChange: (v: string) => void;
	revealed: boolean;
}) {
	const ref = useRef<HTMLTextAreaElement>(null);

	function resize() {
		const el = ref.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${el.scrollHeight}px`;
	}

	return (
		<textarea
			ref={ref}
			id={id}
			value={value}
			onChange={(e) => {
				onChange(e.target.value);
				resize();
			}}
			onFocus={resize}
			rows={3}
			autoComplete="off"
			spellCheck={false}
			className={cn(
				"min-h-[5rem] w-full resize-none overflow-hidden rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
				!revealed && "[-webkit-text-security:disc] [text-security:disc]",
			)}
		/>
	);
}

function Shell({ children }: { children: React.ReactNode }) {
	return <div className="mx-auto max-w-xl px-6 py-12">{children}</div>;
}
