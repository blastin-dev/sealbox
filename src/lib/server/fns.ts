import { createServerFn } from "@tanstack/react-start";
import { nanoid } from "nanoid";
import { authVerify } from "../crypto";
import {
	deleteCiphertext,
	deleteInboxEntry,
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
			recipientAuthPubkey: string;
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
			recipientAuthPubkey: data.recipientAuthPubkey,
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

function verifyInboxAuth(authPubkey: string, authSig: string, nonce: string) {
	if (!authVerify(authPubkey, nonce, authSig)) {
		throw new Error("Invalid signature");
	}
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
		(data: {
			address: string;
			authPubkey: string;
			authSig: string;
			nonce: string;
		}) => data,
	)
	.handler(async ({ data }) => {
		verifyInboxAuth(data.authPubkey, data.authSig, data.nonce);
		const reqs = await listInbox(data.address);
		return reqs
			.filter((r) => r.recipientAuthPubkey === data.authPubkey)
			.map((r) => ({
				id: r.id,
				label: r.label,
				createdAt: r.createdAt,
				submitted: r.submitted,
			}));
	});

export const inboxRetrieve = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			id: string;
			address: string;
			authPubkey: string;
			authSig: string;
			nonce: string;
		}) => data,
	)
	.handler(async ({ data }): Promise<StoredCiphertext | null> => {
		verifyInboxAuth(data.authPubkey, data.authSig, data.nonce);
		const req = await getRequest(data.id);
		if (!req) throw new Error("Request not found");
		if (req.recipientAddress !== data.address.toLowerCase()) {
			throw new Error("Not authorized for this request");
		}
		if (req.recipientAuthPubkey !== data.authPubkey) {
			throw new Error("Not authorized for this request");
		}
		const ct = await getCiphertext(data.id);
		return ct;
	});

export const inboxConsume = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			id: string;
			address: string;
			authPubkey: string;
			authSig: string;
			nonce: string;
		}) => data,
	)
	.handler(async ({ data }) => {
		verifyInboxAuth(data.authPubkey, data.authSig, data.nonce);
		const req = await getRequest(data.id);
		if (!req) return { ok: true };
		if (req.recipientAddress !== data.address.toLowerCase()) {
			throw new Error("Not authorized for this request");
		}
		if (req.recipientAuthPubkey !== data.authPubkey) {
			throw new Error("Not authorized for this request");
		}
		await deleteCiphertext(data.id);
		await deleteInboxEntry(req.recipientAddress, data.id);
		return { ok: true };
	});
