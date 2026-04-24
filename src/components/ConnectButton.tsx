import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectButton() {
	const { address, isConnected } = useAccount();
	const { connectors, connect, status, error } = useConnect();
	const { disconnect } = useDisconnect();

	if (isConnected && address) {
		return (
			<div className="flex items-center gap-3">
				<span className="font-mono text-sm">
					{address.slice(0, 6)}…{address.slice(-4)}
				</span>
				<button
					type="button"
					onClick={() => disconnect()}
					className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
				>
					Disconnect
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-wrap gap-2">
				{connectors.map((connector) => (
					<button
						key={connector.uid}
						type="button"
						onClick={() => connect({ connector })}
						disabled={status === "pending"}
						className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
					>
						Connect {connector.name}
					</button>
				))}
			</div>
			{error && <p className="text-sm text-red-600">{error.message}</p>}
		</div>
	);
}
