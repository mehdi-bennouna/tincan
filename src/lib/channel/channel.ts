import { joinRoom, selfId } from "@trystero-p2p/supabase";
import { AnnouncePayload, TextPayload } from "#/lib/channel/protocol.ts";
import { type ChannelState, type Member } from "#/lib/channel/types.ts";
import { createVoice } from "#/lib/channel/voice.ts";
import { type } from "arktype";
import { createStore, type StoreApi } from "zustand";

export type CreateChannelOptions = {
	channelId: string;
	selfName: string;
	onJoinError?: (error: string) => void;
};

export type Channel = {
	store: StoreApi<ChannelState>;
	sendText: (text: string) => void;
	joinVoice: () => Promise<void>;
	leaveVoice: () => void;
	destroy: () => void;
};

export function createChannel({ channelId, selfName, onJoinError }: CreateChannelOptions): Channel {
	const store = createStore<ChannelState>()(() => ({
		id: channelId,
		selfId,
		members: {
			[selfId]: { id: selfId, name: selfName, presence: "online", inVoice: false, lastSeen: Date.now() },
		},
		timeline: [],
	}));

	const room = joinRoom(
		{
			appId: import.meta.env.VITE_APP_ID,
			relayConfig: { supabaseKey: import.meta.env.VITE_APP_PUBLIC_KEY },
		},
		channelId,
		{
			onJoinError: (e) => {
				console.error("channel join error", e);
				onJoinError?.(e.error);
			},
		},
	);

	const voice = createVoice(room);
	const announceAction = room.makeAction<AnnouncePayload>("announce");
	const textAction = room.makeAction<TextPayload>("text");
	let destroyed = false;

	function announceSelf(target?: string) {
		announceAction.send({ name: selfName, inVoice: voice.isActive() }, target ? { target } : undefined);
	}

	function setSelfInVoice(inVoice: boolean) {
		store.setState((s) => {
			const self = s.members[selfId];
			return self ? { members: { ...s.members, [selfId]: { ...self, inVoice } } } : {};
		});
		announceSelf();
	}

	room.onPeerJoin = (peerId) => {
		voice.handlePeerJoin(peerId);
		announceSelf(peerId);
	};

	room.onPeerLeave = (peerId) => {
		voice.handlePeerLeave(peerId);

		store.setState((s) => {
			const member = s.members[peerId];
			if (member?.presence !== "online") return {};

			const now = Date.now();
			const offline: Member = { ...member, presence: "offline", inVoice: false, lastSeen: now };
			return {
				members: { ...s.members, [peerId]: offline },
				timeline: [...s.timeline, { kind: "member-left", id: crypto.randomUUID(), at: now, memberId: peerId }],
			};
		});
	};

	room.onPeerStream = (stream, peerId) => {
		voice.handlePeerStream(peerId, stream);
	};

	announceAction.onMessage = (data, { peerId }) => {
		const payload = AnnouncePayload(data);
		if (payload instanceof type.errors) return;

		if (!payload.inVoice) voice.handlePeerLeftVoice(peerId);

		store.setState((s) => {
			const now = Date.now();
			const wasOnline = s.members[peerId]?.presence === "online";
			const member: Member = { id: peerId, name: payload.name, presence: "online", inVoice: payload.inVoice, lastSeen: now };
			return {
				members: { ...s.members, [peerId]: member },
				timeline: wasOnline
					? s.timeline
					: [...s.timeline, { kind: "member-joined", id: crypto.randomUUID(), at: now, memberId: peerId }],
			};
		});
	};

	textAction.onMessage = (data, { peerId }) => {
		const payload = TextPayload(data);
		if (payload instanceof type.errors) return;

		appendText(peerId, payload);
	};

	function appendText(authorId: string, { id, authorName, text, at }: TextPayload) {
		store.setState((s) => ({
			timeline: [...s.timeline, { kind: "text", id, authorId, authorName, text, at }],
		}));
	}

	function sendText(text: string) {
		const payload: TextPayload = { id: crypto.randomUUID(), authorName: selfName, text, at: Date.now() };
		textAction.send(payload);
		appendText(selfId, payload);
	}

	async function joinVoice() {
		if (await voice.join()) setSelfInVoice(true);
	}

	function leaveVoice() {
		voice.leave();
		setSelfInVoice(false);
	}

	function destroy() {
		if (destroyed) return;
		destroyed = true;
		// peers see onPeerLeave, which also clears our voice state on their side
		voice.destroy();
		room.leave();
	}

	return { store, sendText, joinVoice, leaveVoice, destroy };
}
