import { createServerFn } from "@tanstack/react-start";
import { nanoid } from "nanoid";
import { verifyMessage } from "viem";
import { authMessage } from "../constants";
import {
	deleteCiphertext,
	getCiphertext,
	getRequest,
	listInbox,
	markSubmitted,
	type PasswordRequest,
	type StoredCiphertext,
	saveCiphertext,
	saveRequest,
} from "./kv";

export const createRequest = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			label: string;
			recipientPubkey: string;
			recipientAddress: string;
		}) => data,
	)
	.handler(async ({ data }) => {
		const id = nanoid(10);
		const now = Date.now();
		const req: PasswordRequest = {
			id,
			label: data.label.slice(0, 200),
			recipientPubkey: data.recipientPubkey,
			recipientAddress: data.recipientAddress.toLowerCase(),
			createdAt: now,
			expiresAt: now + 7 * 24 * 60 * 60 * 1000,
			submitted: false,
		};
		await saveRequest(req);
		return { id };
	});

export const fetchRequest = createServerFn({ method: "GET" })
	.inputValidator((id: string) => id)
	.handler(async ({ data: id }) => {
		const req = await getRequest(id);
		if (!req) throw new Error("Request not found or expired");
		return {
			id: req.id,
			label: req.label,
			recipientPubkey: req.recipientPubkey,
			recipientAddress: req.recipientAddress,
			submitted: req.submitted,
		};
	});

export const submitCiphertext = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { id: string; epk: string; n: string; ct: string }) => data,
	)
	.handler(async ({ data }) => {
		const req = await getRequest(data.id);
		if (!req) throw new Error("Request not found or expired");
		if (req.submitted) throw new Error("Request already fulfilled");
		await saveCiphertext(data.id, {
			v: 1,
			epk: data.epk,
			n: data.n,
			ct: data.ct,
		});
		await markSubmitted(data.id);
		return { ok: true };
	});

async function verifyInboxAuth(
	address: string,
	signature: string,
	nonce: string,
) {
	const message = authMessage(nonce);
	const valid = await verifyMessage({
		address: address as `0x${string}`,
		message,
		signature: signature as `0x${string}`,
	});
	if (!valid) throw new Error("Invalid signature");
	const nonceAgeMs = Date.now() - Number(nonce);
	if (
		!Number.isFinite(nonceAgeMs) ||
		nonceAgeMs < 0 ||
		nonceAgeMs > 5 * 60 * 1000
	) {
		throw new Error("Nonce expired or invalid");
	}
}

export const inboxList = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { address: string; signature: string; nonce: string }) => data,
	)
	.handler(async ({ data }) => {
		await verifyInboxAuth(data.address, data.signature, data.nonce);
		const reqs = await listInbox(data.address);
		return reqs.map((r) => ({
			id: r.id,
			label: r.label,
			createdAt: r.createdAt,
			submitted: r.submitted,
		}));
	});

export const inboxRetrieve = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { id: string; address: string; signature: string; nonce: string }) =>
			data,
	)
	.handler(async ({ data }): Promise<StoredCiphertext | null> => {
		await verifyInboxAuth(data.address, data.signature, data.nonce);
		const req = await getRequest(data.id);
		if (!req) throw new Error("Request not found");
		if (req.recipientAddress !== data.address.toLowerCase()) {
			throw new Error("Not authorized for this request");
		}
		const ct = await getCiphertext(data.id);
		return ct;
	});

export const inboxConsume = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { id: string; address: string; signature: string; nonce: string }) =>
			data,
	)
	.handler(async ({ data }) => {
		await verifyInboxAuth(data.address, data.signature, data.nonce);
		const req = await getRequest(data.id);
		if (!req) return { ok: true };
		if (req.recipientAddress !== data.address.toLowerCase()) {
			throw new Error("Not authorized for this request");
		}
		await deleteCiphertext(data.id);
		return { ok: true };
	});
