import { createStoredString } from "#/lib/stored-string.ts";

const stored = createStoredString("icy-link:username");

function normalize(raw: string | null) {
	return raw?.trim() || null;
}

export function getSavedUsername(): string | null {
	return normalize(stored.get());
}

export function saveUsername(name: string) {
	stored.set(normalize(name));
}

export function useSavedUsername(): string | null | undefined {
	const raw = stored.useValue();
	return raw === undefined ? undefined : normalize(raw);
}
