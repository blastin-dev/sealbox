import { createFileRoute } from "@tanstack/react-router";
import {
	CheckCircle2,
	Eye,
	EyeOff,
	Send,
	ShieldAlert,
	ShieldCheck,
} from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
			<Shell
				tone="warning"
				icon={<ShieldAlert className="size-5" />}
				title="Already submitted"
				subtitle="This request has already been used and can no longer accept another message."
			>
				<Card className="shadow-xl shadow-primary/5">
					<CardContent className="py-6 text-center">
						<p className="text-sm text-muted-foreground">
							Ask the recipient to create a new request link if you need to send
							another secret.
						</p>
					</CardContent>
				</Card>
			</Shell>
		);
	}

	if (done) {
		return (
			<Shell
				tone="success"
				icon={<CheckCircle2 className="size-5" />}
				title="Sent securely"
				subtitle="Your message was encrypted in your browser and delivered to the recipient's inbox."
			>
				<Card className="shadow-xl shadow-primary/5">
					<CardContent className="py-6 text-center">
						<p className="text-sm text-muted-foreground">
							Only the recipient's wallet can reveal this message. The server
							never saw the plaintext. You can close this page.
						</p>
					</CardContent>
				</Card>
			</Shell>
		);
	}

	return (
		<Shell
			icon={<ShieldCheck className="size-5" />}
			title={req.label}
			subtitle="Type the credential below — it's encrypted in your browser before it leaves your device."
		>
			<Card className="shadow-xl shadow-primary/5">
				<CardContent>
					<form onSubmit={onSubmit} className="flex flex-col gap-4">
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
						<Button type="submit" size="lg" disabled={submitting || !message}>
							<Send className="size-4" />
							{submitting ? "Encrypting…" : "Encrypt & send"}
						</Button>
						{err && (
							<p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
								{err}
							</p>
						)}
						<p className="text-xs text-muted-foreground">
							Recipient:{" "}
							<code className="font-mono">
								{req.recipientAddress.slice(0, 6)}…
								{req.recipientAddress.slice(-4)}
							</code>
						</p>
					</form>
				</CardContent>
			</Card>
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

type Tone = "primary" | "success" | "warning";

const TONE_GRADIENT: Record<Tone, string> = {
	primary: "from-primary/15 to-primary/8",
	success: "from-emerald-500/15 to-emerald-500/8",
	warning: "from-amber-500/15 to-amber-500/8",
};

const TONE_ICON: Record<Tone, string> = {
	primary: "bg-primary/10 text-primary",
	success: "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30",
	warning: "bg-amber-500 text-white shadow-sm shadow-amber-500/30",
};

function Shell({
	tone = "primary",
	icon,
	title,
	subtitle,
	children,
}: {
	tone?: Tone;
	icon: React.ReactNode;
	title: string;
	subtitle: string;
	children: React.ReactNode;
}) {
	return (
		<>
			<section
				className={cn(
					"relative overflow-hidden bg-gradient-to-b pt-12 pb-32",
					TONE_GRADIENT[tone],
				)}
			>
				<div className="mx-auto max-w-2xl px-6 text-center">
					<div
						className={cn(
							"mx-auto inline-flex size-12 items-center justify-center rounded-full",
							TONE_ICON[tone],
						)}
					>
						{icon}
					</div>
					<h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
						{title}
					</h1>
					<p className="mt-3 text-base text-muted-foreground">{subtitle}</p>
				</div>
			</section>
			<div className="relative z-10 -mt-24 px-6 pb-16">
				<div className="mx-auto max-w-md">{children}</div>
			</div>
		</>
	);
}
