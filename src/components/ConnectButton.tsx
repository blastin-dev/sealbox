import { Link } from "@tanstack/react-router";
import { ExternalLink, Lock, LogOut, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { type Connector, useAccount, useConnect, useDisconnect } from "wagmi";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useDerivedKey } from "../components/DerivedKeyProvider";
import { WALLET_INSTALL_URLS } from "../lib/wagmi";
import { BraveWalletIcon, MetaMaskIcon, TrustWalletIcon } from "./walletIcons";

const ICONS: Record<string, (p: { className?: string }) => React.ReactElement> =
	{
		metaMask: MetaMaskIcon,
		trust: TrustWalletIcon,
		brave: BraveWalletIcon,
	};

type ConnectButtonProps = {
	size?: "sm" | "default" | "lg";
	label?: string;
};

export function ConnectButton({
	size = "sm",
	label = "Connect wallet",
}: ConnectButtonProps = {}) {
	const { address, isConnected, connector: activeConnector } = useAccount();
	const { disconnect } = useDisconnect();
	const [open, setOpen] = useState(false);
	const hydrated = useHydrated();

	useEffect(() => {
		if (isConnected) setOpen(false);
	}, [isConnected]);

	if (!hydrated) {
		return <WalletLoadingButton size={size} label={label} />;
	}

	if (isConnected && address) {
		const Icon = activeConnector ? ICONS[activeConnector.id] : undefined;
		const short = `${address.slice(0, 4)}…${address.slice(-4)}`;
		return (
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => disconnect()}
				aria-label={`Disconnect ${short}`}
				title="Disconnect"
				className="group gap-2 px-2.5 font-mono text-xs"
			>
				{Icon ? (
					<Icon className="size-4" />
				) : (
					<Wallet className="size-4 text-muted-foreground" />
				)}
				<span className="hidden sm:inline">{short}</span>
				<LogOut className="size-3.5 text-muted-foreground transition-colors group-hover:text-destructive" />
			</Button>
		);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button type="button" size={size}>
					<Wallet className="size-4" />
					<span className="hidden sm:inline">{label}</span>
					<span className="inline sm:hidden">Connect</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Connect a wallet</DialogTitle>
					<DialogDescription>
						Your wallet signs a one-time message to derive an encryption key.
						Nothing is sent on-chain.
					</DialogDescription>
				</DialogHeader>
				<WalletList />
			</DialogContent>
		</Dialog>
	);
}

function WalletList() {
	const { connectors, connect, status, error, variables } = useConnect();
	const pendingConnector =
		status === "pending" ? variables?.connector : undefined;
	const pendingId =
		pendingConnector && "id" in pendingConnector
			? pendingConnector.id
			: undefined;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-2">
				{connectors.map((connector) => (
					<WalletOption
						key={connector.uid}
						connector={connector}
						pending={pendingId === connector.id}
						disabled={status === "pending"}
						onConnect={() => connect({ connector })}
					/>
				))}
			</div>
			{error && <p className="text-sm text-destructive">{error.message}</p>}
		</div>
	);
}

function WalletOption({
	connector,
	pending,
	disabled,
	onConnect,
}: {
	connector: Connector;
	pending: boolean;
	disabled: boolean;
	onConnect: () => void;
}) {
	const Icon = ICONS[connector.id];
	const [installed, setInstalled] = useState<boolean | null>(null);

	useEffect(() => {
		let cancelled = false;
		connector
			.getProvider()
			.then((p) => {
				if (!cancelled) setInstalled(!!p);
			})
			.catch(() => {
				if (!cancelled) setInstalled(false);
			});
		return () => {
			cancelled = true;
		};
	}, [connector]);

	if (installed === false) {
		const url = WALLET_INSTALL_URLS[connector.id];
		return (
			<Button
				asChild
				type="button"
				variant="outline"
				className="h-auto justify-start gap-3 py-3"
			>
				<a href={url} target="_blank" rel="noreferrer noopener">
					{Icon ? (
						<Icon className="size-7" />
					) : (
						<span className="size-7 rounded bg-muted" />
					)}
					<span className="flex-1 text-left">
						<span className="block text-sm font-medium">{connector.name}</span>
						<span className="block text-xs text-muted-foreground">Install</span>
					</span>
					<ExternalLink className="size-3.5 text-muted-foreground" />
				</a>
			</Button>
		);
	}

	return (
		<Button
			type="button"
			variant="outline"
			className="h-auto justify-start gap-3 py-3 transition-colors hover:bg-accent/60"
			onClick={onConnect}
			disabled={disabled}
		>
			{Icon ? (
				<Icon className="size-7" />
			) : (
				<span className="size-7 rounded bg-muted" />
			)}
			<span className="flex-1 text-left">
				<span className="block text-sm font-medium">{connector.name}</span>
				<span className="block text-xs text-muted-foreground">
					{pending
						? "Confirm in wallet…"
						: installed === null
							? "Checking…"
							: "Detected"}
				</span>
			</span>
		</Button>
	);
}

export function ConnectGate({
	title = "Connect your wallet",
	description = "You'll sign a one-time message to derive your encryption key.",
}: {
	title?: string;
	description?: string;
}) {
	const hydrated = useHydrated();

	if (!hydrated) {
		return <WalletLoadingCard title={title} description={description} />;
	}

	return (
		<Card className="mx-auto max-w-md gap-4 py-6 shadow-sm">
			<CardHeader className="items-center text-center">
				<div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10">
					<Wallet className="size-5 text-primary" />
				</div>
				<CardTitle className="mt-2">{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<WalletList />
			</CardContent>
		</Card>
	);
}

export function UnlockDialog() {
	const { isConnected } = useAccount();
	const { key, isDeriving, error, derive } = useDerivedKey();
	const open = isConnected && !key;

	return (
		<Dialog open={open}>
			<DialogContent
				showClose={false}
				className="sm:max-w-sm"
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
			>
				<div className="flex flex-col items-center gap-4 py-2 text-center">
					<div
						className={
							"grid size-14 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
						}
					>
						<Lock className={isDeriving ? "size-6 animate-pulse" : "size-6"} />
					</div>
					<DialogHeader className="gap-1.5">
						<DialogTitle className="text-center">
							Your vault is locked
						</DialogTitle>
						<DialogDescription className="text-center">
							Sign once with your wallet to unlock it. Same wallet, same
							signature, same vault.
						</DialogDescription>
					</DialogHeader>
					<Button
						type="button"
						size="lg"
						className="w-full"
						onClick={() => derive()}
						disabled={isDeriving}
					>
						{isDeriving ? "Unlocking…" : "Unlock vault"}
					</Button>
					<Link
						to="/"
						className="text-sm text-muted-foreground underline-offset-4 hover:underline"
					>
						Back to home
					</Link>
					{error && (
						<p className="text-sm text-destructive" role="alert">
							{error}
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

function useHydrated() {
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(true);
	}, []);

	return hydrated;
}

function WalletLoadingButton({
	size,
	label,
}: {
	size: ConnectButtonProps["size"];
	label: string;
}) {
	return (
		<Button type="button" size={size} disabled>
			<Wallet className="size-4 animate-pulse" />
			{label}
		</Button>
	);
}

function WalletLoadingCard({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<Card className="mx-auto max-w-md gap-4 py-6 shadow-sm">
			<CardHeader className="items-center text-center">
				<div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10">
					<Wallet className="size-5 animate-pulse text-primary" />
				</div>
				<CardTitle className="mt-2">{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="rounded-md border border-dashed px-4 py-3 text-center text-sm text-muted-foreground">
					Checking wallet connection…
				</div>
			</CardContent>
		</Card>
	);
}
