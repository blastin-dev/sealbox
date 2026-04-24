import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "../lib/wagmi";
import { DerivedKeyProvider } from "./DerivedKeyProvider";

export function WalletProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient());
	return (
		<WagmiProvider config={wagmiConfig}>
			<QueryClientProvider client={queryClient}>
				<DerivedKeyProvider>{children}</DerivedKeyProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
