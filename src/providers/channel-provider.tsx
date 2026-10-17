import { createContext, useContext, useState, type ReactNode } from "react";
import { createStore, useStore, type StoreApi } from "zustand";

export type ChannelPeer = {
	id: string;
	name: string;
};

export type BaseMessage = {
	id: string;
	authorId: string;
	timestamp: string;
};

export type TextMessage = BaseMessage & {
	type: "text";
	text: string;
};

export type FileMessage = BaseMessage & {
	type: "file";
	file: {
		name: string;
		url: string;
		size: number; // bytes
		mimeType: string;
	};
};

export type ChannelMessage = TextMessage | FileMessage;

export type ChannelStore = {
	id: string;
	peers: Array<ChannelPeer>;
	messages: Array<ChannelMessage>;

	addPeer: (peer: ChannelPeer) => void;
	removePeer: (peerId: string) => void;
};

type ChannelInit = { id: string };

function createChannelStore({ id }: ChannelInit) {
	return createStore<ChannelStore>()((set) => ({
		id,
		peers: [],
		messages: [],

		addPeer: (peer: ChannelPeer) => {
			set((s) => (s.peers.some((p) => p.id === peer.id) ? s : { peers: [...s.peers, peer] }));
		},
		removePeer: (peerId) => {
			set((s) => ({ peers: s.peers.filter((p) => p.id !== peerId) }));
		},
	}));
}

const ChannelContext = createContext<StoreApi<ChannelStore> | null>(null);

export function ChannelProvider({ children, channelId }: Readonly<{ children: ReactNode; channelId: string }>) {
	const [store] = useState(() => createChannelStore({ id: channelId }));

	return <ChannelContext.Provider value={store}>{children}</ChannelContext.Provider>;
}

export function useChannelStore<T>(selector: (state: ChannelStore) => T): T {
	const store = useContext(ChannelContext);
	if (!store) {
		throw new Error("useChannel must be used within a <ChannelProvider>");
	}

	return useStore(store, selector);
}
