import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Github, Link2, Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div className="mx-auto max-w-4xl px-6 py-20">
			<section className="text-center">
				<img
					src="/logo.png"
					alt="Sealbox"
					className="mx-auto size-24 sm:size-28"
					width={112}
					height={112}
				/>
				<h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">
					Sealbox
				</h1>
				<p className="mx-auto mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
					Receive messages encrypted to your crypto wallet. The server only ever
					sees ciphertext.
				</p>
				<div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
					<span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/30 dark:text-emerald-300">
						<Sparkles className="size-3" />
						Free - no gas, no fees
					</span>
					<a
						href="https://github.com/blastin-dev/sealbox"
						target="_blank"
						rel="noreferrer noopener"
						className="inline-flex items-center gap-1.5 rounded-full border bg-muted/30 px-2.5 py-1 font-medium text-foreground/80 transition-colors hover:bg-muted/60"
					>
						<Github className="size-3" />
						Open source - self-host it
					</a>
				</div>
				<div className="mt-8 flex justify-center gap-3">
					<Button asChild size="lg">
						<Link to="/request">Create request</Link>
					</Button>
					<Button asChild variant="outline" size="lg">
						<Link to="/inbox">Open inbox</Link>
					</Button>
				</div>
			</section>

			<Flow />
		</div>
	);
}

function Flow() {
	return (
		<section className="mt-20">
			<div className="relative mx-auto max-w-2xl pt-8">
				<div className="absolute top-0 left-2/3 inline-flex -translate-x-1/2 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
					<Lock className="size-3" />
					ciphertext only
				</div>
				<div className="relative">
					<div className="absolute top-7 right-[50%] left-[16.67%] -translate-y-1/2 border-t-2 border-dashed border-border" />
					<div className="absolute top-7 right-[16.67%] left-[50%] -translate-y-1/2 border-t-2 border-dashed border-amber-300 dark:border-amber-800/60" />
					<span className="sealbox-traveler absolute top-7 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-lg shadow-primary/40" />
					<div className="relative grid grid-cols-3 gap-4">
						<Stop
							tone="primary"
							icon={<Link2 className="size-5" />}
							title="Request & Share"
							subtitle="You create a one-time link"
							delay="0s"
						/>
						<Stop
							tone="amber"
							icon={<Lock className="size-5" />}
							title="Type, Encrypt, Send"
							subtitle="Sender's browser seals the secret"
							delay="1.5s"
						/>
						<Stop
							tone="emerald"
							icon={<Eye className="size-5" />}
							title="Retrieve"
							subtitle="Only your wallet can reveal it"
							delay="2.7s"
						/>
					</div>
				</div>
			</div>
			<p className="mx-auto mt-10 flex max-w-md items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
				<Lock className="size-3.5 shrink-0" />
				The server only ever sees ciphertext - never the plaintext.
			</p>
		</section>
	);
}

const TONES = {
	amber: "bg-amber-500 text-white shadow-amber-500/30",
	primary: "bg-primary text-primary-foreground shadow-primary/30",
	emerald: "bg-emerald-500 text-white shadow-emerald-500/30",
};

function Stop({
	tone,
	icon,
	title,
	subtitle,
	delay,
}: {
	tone: keyof typeof TONES;
	icon: React.ReactNode;
	title: string;
	subtitle: string;
	delay: string;
}) {
	return (
		<div className="text-center">
			<div
				className={cn(
					"sealbox-stop mx-auto grid size-14 place-items-center rounded-full shadow-lg",
					TONES[tone],
				)}
				style={{ animationDelay: delay }}
			>
				{icon}
			</div>
			<p className="mt-3 text-sm font-medium">{title}</p>
			<p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
		</div>
	);
}
