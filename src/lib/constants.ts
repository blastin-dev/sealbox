export const KEY_DERIVATION_MESSAGE =
	"password-request: derive encryption key v1\n\nSign this to unlock your inbox. Signing is safe and free.";

export const AUTH_MESSAGE_PREFIX = "password-request: auth inbox v1\n\nnonce: ";

export function authMessage(nonce: string): string {
	return AUTH_MESSAGE_PREFIX + nonce;
}

export function newNonce(): string {
	return Date.now().toString();
}
