import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

type EthProvider = {
	isMetaMask?: boolean;
	isBraveWallet?: boolean;
	isTrust?: boolean;
	isTrustWallet?: boolean;
	isPhantom?: boolean;
	isCoinbaseWallet?: boolean;
	isRabby?: boolean;
	providers?: EthProvider[];
};

function candidates(window: unknown): EthProvider[] {
	const eth = (window as { ethereum?: EthProvider } | undefined)?.ethereum;
	if (!eth) return [];
	return eth.providers ?? [eth];
}

const metaMask = injected({
	target: () => ({
		id: "metaMask",
		name: "MetaMask",
		provider: (window) =>
			candidates(window).find(
				(p) =>
					p.isMetaMask &&
					!p.isBraveWallet &&
					!p.isTrust &&
					!p.isTrustWallet &&
					!p.isPhantom &&
					!p.isCoinbaseWallet &&
					!p.isRabby,
			) as never,
	}),
});

const trustWallet = injected({
	target: () => ({
		id: "trust",
		name: "Trust Wallet",
		provider: (window) => {
			const trust = (window as { trustwallet?: EthProvider } | undefined)
				?.trustwallet;
			if (trust) return trust as never;
			return candidates(window).find(
				(p) => p.isTrust || p.isTrustWallet,
			) as never;
		},
	}),
});

const braveWallet = injected({
	target: () => ({
		id: "brave",
		name: "Brave Wallet",
		provider: (window) =>
			candidates(window).find((p) => p.isBraveWallet) as never,
	}),
});

export const wagmiConfig = createConfig({
	chains: [mainnet],
	multiInjectedProviderDiscovery: false,
	connectors: [metaMask, trustWallet, braveWallet],
	transports: { [mainnet.id]: http() },
	ssr: true,
});

export const WALLET_INSTALL_URLS: Record<string, string> = {
	metaMask: "https://metamask.io/download",
	trust: "https://trustwallet.com/download",
	brave: "https://brave.com/wallet/",
};

declare module "wagmi" {
	interface Register {
		config: typeof wagmiConfig;
	}
}
