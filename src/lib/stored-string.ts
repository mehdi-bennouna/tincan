import { useSyncExternalStore } from "react";

export type StoredString = {
	get: () => string | null;
	set: (value: string | null) => void;
	useValue: () => string | null | undefined;
};

export function createStoredString(key: string): StoredString {
	const listeners = new Set<() => void>();
	let memory: string | null = null;

	function get() {
		try {
			return localStorage.getItem(key) ?? memory;
		} catch {
			return memory;
		}
	}

	function set(value: string | null) {
		memory = value;
		try {
			if (value === null) localStorage.removeItem(key);
			else localStorage.setItem(key, value);
		} catch {}
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

	function useValue() {
		return useSyncExternalStore(subscribe, get, () => undefined);
	}

	return { get, set, useValue };
}
