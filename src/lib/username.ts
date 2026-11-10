import { useSyncExternalStore } from "react";

const KEY = "icy-link:username";
const listeners = new Set<() => void>();

export function getSavedUsername(): string | null {
	try {
		return localStorage.getItem(KEY);
	} catch {
		return null;
	}
}

export function saveUsername(name: string) {
	try {
		localStorage.setItem(KEY, name);
	} catch {
		// storage can be blocked (private mode, disabled site data); the name just won't be remembered
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
