import { createContext, useContext, useState, type ReactNode } from "react";
import { createStore, useStore, type StoreApi } from "zustand";


export type ChannelPeer = {
	id: string;
	name: string;
	inVoice: boolean;
};

export type BaseMessage = {
	id: string;
	authorId: string;
	timestamp: number;
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
	peers: Record<string, ChannelPeer>;
	messages: Array<ChannelMessage>;

	upsertPeer: (peerId: string, peer: ChannelPeer) => void;
	removePeer: (peerId: string) => void;
	addMessage: (messageId: ChannelMessage) => void;
	peerFromPeerId: (peerId: string) => ChannelPeer;
	reset: () => void;
};

type ChannelInit = { id: string };

const baseState = {
	peers: {},
	messages: [],
};

function createChannelStore({ id }: ChannelInit) {
	return createStore<ChannelStore>()((set, get) => ({
		id,
		...baseState,
		upsertPeer: (peerId, peer) => {
			set((s) => ({ peers: { ...s.peers, [peerId]: peer } }));
		},
		removePeer: (peerId) => {
			set((s) => {
				const { [peerId]: _, ...rest } = s.peers;
				return { peers: rest };
			});
		},
		addMessage: (message: ChannelMessage) => {
			set((s) => ({ ...s, messages: [...s.messages, message] }));
		},
		peerFromPeerId: (peerId: string) => {
			return get().peers[peerId];
		},

		reset: () => {
			set((s) => ({ id: s.id, baseState }));
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
