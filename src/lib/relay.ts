import { createStoredString } from "#/lib/stored-string.ts";
import { type } from "arktype";
import { useMemo } from "react";

export type RelayConfig = {
	url: string;
	key: string;
};

const RelayConfigSchema = type({ url: "string", key: "string" });
const stored = createStoredString("tincan:relay");

export function getDefaultRelay(): RelayConfig | null {
	const url: unknown = import.meta.env.VITE_APP_ID;
	const key: unknown = import.meta.env.VITE_APP_PUBLIC_KEY;
	return typeof url === "string" && url !== "" && typeof key === "string" && key !== "" ? { url, key } : null;
}

export function isDefaultRelay(relay: RelayConfig) {
	const fallback = getDefaultRelay();
	return fallback !== null && fallback.url === relay.url && fallback.key === relay.key;
}

export function relayUrlError(url: string): string | null {
	let parsed: URL;
	try {
		parsed = new URL(url.trim());
	} catch {
		return "Enter your project URL, like https://abcd.supabase.co";
	}

	const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
	if (parsed.protocol !== "https:" && !(isLocal && parsed.protocol === "http:")) {
		return "The project URL must use https";
	}
	return null;
}

function jwtRole(token: string): unknown {
	const payload = token.split(".")[1];
	if (payload === undefined) return undefined;

	try {
		const json: unknown = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
		return typeof json === "object" && json !== null && "role" in json ? json.role : undefined;
	} catch {
		return undefined;
	}
}

export function relayKeyError(key: string): string | null {
	const trimmed = key.trim();
	if (!trimmed) return "Enter your project's publishable (anon) key";
	if (trimmed.startsWith("sb_secret_") || jwtRole(trimmed) === "service_role") {
		return "This is a secret key. Use the publishable (anon) key instead, it gets shared in invite links.";
	}
	return null;
}

function parseRelay(raw: string | null): RelayConfig | null {
	if (raw === null) return null;
	try {
		const relay = RelayConfigSchema(JSON.parse(raw));
		if (relay instanceof type.errors) return null;
		return relayUrlError(relay.url) === null && relayKeyError(relay.key) === null ? relay : null;
	} catch {
		return null;
	}
}

export function getSavedRelay(): RelayConfig | null {
	return parseRelay(stored.get());
}

export function saveRelay(relay: RelayConfig | null) {
	stored.set(relay ? JSON.stringify({ url: relay.url.trim(), key: relay.key.trim() }) : null);
}

export function useSavedRelay(): RelayConfig | null | undefined {
	const raw = stored.useValue();
	return useMemo(() => (raw === undefined ? undefined : parseRelay(raw)), [raw]);
}

export function relayFromHash(hash: string): RelayConfig | null {
	const params = new URLSearchParams(hash.replace(/^#/, ""));
	const url = params.get("relay");
	const key = params.get("key");
	if (url === null || key === null) return null;
	return relayUrlError(url) === null && relayKeyError(key) === null ? { url, key } : null;
}

export function relayToHash(relay: RelayConfig) {
	return new URLSearchParams({ relay: relay.url, key: relay.key }).toString();
}
