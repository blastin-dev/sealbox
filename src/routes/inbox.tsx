import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "../components/ConnectButton";
import { useDerivedKey } from "../components/DerivedKeyProvider";
import { authMessage, newNonce } from "../lib/constants";
import { decryptWithPrivateKey } from "../lib/crypto";
import { inboxConsume, inboxList, inboxRetrieve } from "../lib/server/fns";

export const Route = createFileRoute("/inbox")({ component: Inbox });

type ListItem = {
	id: string;
	label: string;
	createdAt: number;
	submitted: boolean;
};

function Inbox() {
	const { address, isConnected } = useAccount();
	const { signMessageAsync } = useSignMessage();
	const { key, isDeriving, derive } = useDerivedKey();
	const [items, setItems] = useState<ListItem[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const loadInbox = useCallback(async () => {
		if (!address) return;
		setLoading(true);
		setErr(null);
		try {
			const nonce = newNonce();
			const signature = await signMessageAsync({ message: authMessage(nonce) });
			const list = await inboxList({ data: { address, signature, nonce } });
			setItems(list.sort((a, b) => b.createdAt - a.createdAt));
		} catch (e) {
			setErr(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [address, signMessageAsync]);

	return (
		<div className="mx-auto max-w-2xl px-6 py-12">
			<h1 className="text-2xl font-semibold">Inbox</h1>

			<div className="mt-6">
				<ConnectButton />
			</div>

			{isConnected && !key && (
				<div className="mt-6 rounded border bg-amber-50 p-4">
					<p className="text-sm">
						Sign once to derive your encryption key (needed to decrypt received
						passwords).
					</p>
					<button
						type="button"
						onClick={() => derive()}
						disabled={isDeriving}
						className="mt-3 rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
					>
						{isDeriving ? "Waiting…" : "Derive key"}
					</button>
				</div>
			)}

			{key && (
				<div className="mt-6">
					<button
						type="button"
						onClick={loadInbox}
						disabled={loading}
						className="rounded border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
					>
						{loading ? "Loading…" : items ? "Refresh" : "Load inbox"}
					</button>
				</div>
			)}

			{err && <p className="mt-4 text-sm text-red-600">{err}</p>}

			{items && (
				<ul className="mt-6 flex flex-col gap-3">
					{items.length === 0 && (
						<li className="text-sm text-gray-500">No requests yet.</li>
					)}
					{items.map((it) => (
						<InboxItem key={it.id} item={it} />
					))}
				</ul>
			)}
		</div>
	);
}

function InboxItem({ item }: { item: ListItem }) {
	const { address } = useAccount();
	const { signMessageAsync } = useSignMessage();
	const { key } = useDerivedKey();
	const [plaintext, setPlaintext] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	async function decrypt() {
		if (!address || !key) return;
		setBusy(true);
		setErr(null);
		try {
			const nonce = newNonce();
			const signature = await signMessageAsync({ message: authMessage(nonce) });
			const ct = await inboxRetrieve({
				data: { id: item.id, address, signature, nonce },
			});
			if (!ct) {
				setErr(
					"Ciphertext not available (not yet submitted or already consumed)",
				);
				return;
			}
			const pt = decryptWithPrivateKey(
				{ v: ct.v, epk: ct.epk, n: ct.n, ct: ct.ct },
				key.privateKey,
			);
			setPlaintext(pt);
		} catch (e) {
			setErr(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(false);
		}
	}

	async function consume() {
		if (!address) return;
		setBusy(true);
		setErr(null);
		try {
			const nonce = newNonce();
			const signature = await signMessageAsync({ message: authMessage(nonce) });
			await inboxConsume({ data: { id: item.id, address, signature, nonce } });
			setPlaintext(null);
		} catch (e) {
			setErr(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(false);
		}
	}

	return (
		<li className="rounded border p-4">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="font-medium">{item.label}</p>
					<p className="mt-1 text-xs text-gray-500">
						{new Date(item.createdAt).toLocaleString()} ·{" "}
						{item.submitted ? "submitted" : "pending"}
					</p>
				</div>
				<div className="flex gap-2">
					{item.submitted && !plaintext && (
						<button
							type="button"
							onClick={decrypt}
							disabled={busy}
							className="rounded bg-black px-3 py-1 text-xs text-white hover:bg-gray-800 disabled:opacity-50"
						>
							Decrypt
						</button>
					)}
					{plaintext && (
						<button
							type="button"
							onClick={consume}
							disabled={busy}
							className="rounded border px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
						>
							Delete from server
						</button>
					)}
				</div>
			</div>
			{plaintext && (
				<pre className="mt-3 overflow-x-auto rounded bg-gray-900 p-3 font-mono text-sm text-green-300">
					{plaintext}
				</pre>
			)}
			{err && <p className="mt-2 text-sm text-red-600">{err}</p>}
		</li>
	);
}
