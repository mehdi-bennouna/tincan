import { useSyncExternalStore } from "react";

const KEY = "icy-link:username";
const listeners = new Set<() => void>();
// fallback for when storage is blocked, so the name still lasts for this page load
let memoryName: string | null = null;

export function getSavedUsername(): string | null {
	try {
		return localStorage.getItem(KEY)?.trim() || memoryName;
	} catch {
		return memoryName;
	}
}

export function saveUsername(name: string) {
	memoryName = name.trim() || null;
	try {
		localStorage.setItem(KEY, name.trim());
	} catch {
		// storage can be blocked (private mode, disabled site data); memoryName covers this page load
	}
	listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	window.addEventListener("storage", listener);
	return () => {
		listeners.delete(listener);
		window.removeEventListener("storage", listener);
	};
}

// undefined while rendering on the server / hydrating, null when no name is saved
export function useSavedUsername(): string | null | undefined {
	return useSyncExternalStore(subscribe, getSavedUsername, () => undefined);
}
