import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { x25519 } from "@noble/curves/ed25519.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import {
	bytesToHex,
	hexToBytes,
	randomBytes,
	utf8ToBytes,
} from "@noble/hashes/utils.js";

const HKDF_INFO = utf8ToBytes("password-request/ecies/v1");

export type EncryptedPayload = {
	v: 1;
	epk: string;
	n: string;
	ct: string;
};

function toB64(bytes: Uint8Array): string {
	let binary = "";
	for (let i = 0; i < bytes.length; i++)
		binary += String.fromCharCode(bytes[i]);
	return btoa(binary);
}

function fromB64(s: string): Uint8Array {
	const binary = atob(s);
	const out = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
	return out;
}

export function derivePrivateKey(walletSignatureHex: string): Uint8Array {
	const sig = hexToBytes(walletSignatureHex.replace(/^0x/, ""));
	return sha256(sig);
}

export function getPublicKey(privateKey: Uint8Array): Uint8Array {
	return x25519.getPublicKey(privateKey);
}

export function publicKeyHex(privateKey: Uint8Array): string {
	return bytesToHex(getPublicKey(privateKey));
}

export function encryptForRecipient(
	plaintext: string,
	recipientPublicKeyHex: string,
): EncryptedPayload {
	const recipientPub = hexToBytes(recipientPublicKeyHex.replace(/^0x/, ""));
	const ephemeralPriv = x25519.utils.randomSecretKey();
	const ephemeralPub = x25519.getPublicKey(ephemeralPriv);
	const shared = x25519.getSharedSecret(ephemeralPriv, recipientPub);
	const key = hkdf(sha256, shared, ephemeralPub, HKDF_INFO, 32);
	const nonce = randomBytes(24);
	const cipher = xchacha20poly1305(key, nonce);
	const ct = cipher.encrypt(utf8ToBytes(plaintext));
	return { v: 1, epk: toB64(ephemeralPub), n: toB64(nonce), ct: toB64(ct) };
}

export function decryptWithPrivateKey(
	payload: EncryptedPayload,
	privateKey: Uint8Array,
): string {
	if (payload.v !== 1)
		throw new Error(`unsupported payload version: ${payload.v}`);
	const ephemeralPub = fromB64(payload.epk);
	const nonce = fromB64(payload.n);
	const ct = fromB64(payload.ct);
	const shared = x25519.getSharedSecret(privateKey, ephemeralPub);
	const key = hkdf(sha256, shared, ephemeralPub, HKDF_INFO, 32);
	const cipher = xchacha20poly1305(key, nonce);
	const plaintext = cipher.decrypt(ct);
	return new TextDecoder().decode(plaintext);
}
