import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { useAccount, useSignMessage } from "wagmi";
import { KEY_DERIVATION_MESSAGE } from "../lib/constants";
import { derivePrivateKey, publicKeyHex } from "../lib/crypto";

type DerivedKey = { privateKey: Uint8Array; publicKeyHex: string };

type Ctx = {
	key: DerivedKey | null;
	isDeriving: boolean;
	error: string | null;
	derive: () => Promise<DerivedKey | null>;
	clear: () => void;
};

const DerivedKeyContext = createContext<Ctx | null>(null);

export function DerivedKeyProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const { address } = useAccount();
	const { signMessageAsync } = useSignMessage();
	const [key, setKey] = useState<DerivedKey | null>(null);
	const [isDeriving, setDeriving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const derive = useCallback(async () => {
		if (!address) {
			setError("Connect a wallet first");
			return null;
		}
		setDeriving(true);
		setError(null);
		try {
			const sig = await signMessageAsync({ message: KEY_DERIVATION_MESSAGE });
			const priv = derivePrivateKey(sig);
			const pub = publicKeyHex(priv);
			const next = { privateKey: priv, publicKeyHex: pub };
			setKey(next);
			return next;
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
			return null;
		} finally {
			setDeriving(false);
		}
	}, [address, signMessageAsync]);

	const clear = useCallback(() => setKey(null), []);

	const value = useMemo(
		() => ({ key, isDeriving, error, derive, clear }),
		[key, isDeriving, error, derive, clear],
	);

	return (
		<DerivedKeyContext.Provider value={value}>
			{children}
		</DerivedKeyContext.Provider>
	);
}

export function useDerivedKey(): Ctx {
	const ctx = useContext(DerivedKeyContext);
	if (!ctx)
		throw new Error("useDerivedKey must be used inside DerivedKeyProvider");
	return ctx;
}
