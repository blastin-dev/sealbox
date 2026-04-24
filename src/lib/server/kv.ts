import { env } from "cloudflare:workers";

export type PasswordRequest = {
	id: string;
	label: string;
	recipientPubkey: string;
	recipientAddress: string;
	createdAt: number;
	expiresAt: number;
	submitted: boolean;
};

export type StoredCiphertext = {
	v: 1;
	epk: string;
	n: string;
	ct: string;
	submittedAt: number;
};

const REQUEST_TTL_SECONDS = 60 * 60 * 24 * 7;
const CIPHERTEXT_TTL_SECONDS = 60 * 60 * 24 * 7;

const reqKey = (id: string) => `req:${id}`;
const ctKey = (id: string) => `ct:${id}`;
const inboxKey = (address: string, id: string) =>
	`inbox:${address.toLowerCase()}:${id}`;

export async function saveRequest(req: PasswordRequest): Promise<void> {
	const kv = env.REQUESTS;
	await Promise.all([
		kv.put(reqKey(req.id), JSON.stringify(req), {
			expirationTtl: REQUEST_TTL_SECONDS,
		}),
		kv.put(inboxKey(req.recipientAddress, req.id), req.id, {
			expirationTtl: REQUEST_TTL_SECONDS,
		}),
	]);
}

export async function getRequest(id: string): Promise<PasswordRequest | null> {
	const raw = await env.REQUESTS.get(reqKey(id));
	return raw ? (JSON.parse(raw) as PasswordRequest) : null;
}

export async function markSubmitted(id: string): Promise<void> {
	const req = await getRequest(id);
	if (!req) return;
	req.submitted = true;
	await env.REQUESTS.put(reqKey(id), JSON.stringify(req), {
		expirationTtl: REQUEST_TTL_SECONDS,
	});
}

export async function saveCiphertext(
	id: string,
	payload: Omit<StoredCiphertext, "submittedAt">,
): Promise<void> {
	const stored: StoredCiphertext = { ...payload, submittedAt: Date.now() };
	await env.REQUESTS.put(ctKey(id), JSON.stringify(stored), {
		expirationTtl: CIPHERTEXT_TTL_SECONDS,
	});
}

export async function getCiphertext(
	id: string,
): Promise<StoredCiphertext | null> {
	const raw = await env.REQUESTS.get(ctKey(id));
	return raw ? (JSON.parse(raw) as StoredCiphertext) : null;
}

export async function deleteCiphertext(id: string): Promise<void> {
	await env.REQUESTS.delete(ctKey(id));
}

export async function listInbox(
	address: string,
): Promise<Array<PasswordRequest>> {
	const prefix = `inbox:${address.toLowerCase()}:`;
	const { keys } = await env.REQUESTS.list({ prefix });
	const reqs = await Promise.all(
		keys.map(async (k) => {
			const id = k.name.slice(prefix.length);
			return getRequest(id);
		}),
	);
	return reqs.filter((r): r is PasswordRequest => r !== null);
}
