import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Github, Link2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REPO_URL = "https://github.com/blastin-dev/sealbox";

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
					Receive credentials encrypted to your wallet. The server only ever
					sees ciphertext.
				</p>
				<div className="mt-8 flex justify-center gap-3">
					<Button asChild size="lg">
						<Link to="/new">Create request</Link>
					</Button>
					<Button asChild variant="outline" size="lg">
						<Link to="/inbox">Open inbox</Link>
					</Button>
				</div>
			</section>

			<Flow />

			<footer className="mt-24 flex justify-center text-sm text-muted-foreground">
				<a
					href={REPO_URL}
					target="_blank"
					rel="noreferrer noopener"
					className="inline-flex items-center gap-2 underline-offset-4 hover:text-foreground hover:underline"
				>
					<Github className="size-4" />
					Open source on GitHub
				</a>
			</footer>
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
							title="Request"
							subtitle="You create a one-time link"
							delay="0s"
						/>
						<Stop
							tone="amber"
							icon={<Lock className="size-5" />}
							title="Type & encrypt"
							subtitle="Sender's browser seals the secret"
							delay="1.5s"
						/>
						<Stop
							tone="emerald"
							icon={<Eye className="size-5" />}
							title="Reveal"
							subtitle="Your browser, your wallet"
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
