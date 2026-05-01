export const KEY_DERIVATION_MESSAGE =
	"sealbox: derive encryption key v1\n\nSign this to unlock your inbox. Signing is safe and free.";

export function newNonce(): string {
	return Date.now().toString();
}
