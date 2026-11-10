import { joinRoom, selfId } from "@trystero-p2p/supabase";
import { AnnouncePayload, TextPayload } from "#/lib/channel/protocol.ts";
import { type ChannelState, type Member, type TimelineItem } from "#/lib/channel/types.ts";
import { createVoice } from "#/lib/channel/voice.ts";
import { type RelayConfig } from "#/lib/relay.ts";
import { type } from "arktype";
import { createStore, type StoreApi } from "zustand";

export type CreateChannelOptions = {
	channelId: string;
	selfName: string;
	relay: RelayConfig;
	onJoinError?: (error: string) => void;
};

export type Channel = {
	store: StoreApi<ChannelState>;
	relay: RelayConfig;
	sendText: (text: string) => void;
	joinVoice: () => Promise<void>;
	leaveVoice: () => void;
	setMuted: (muted: boolean) => void;
	setName: (name: string) => void;
	destroy: () => void;
};

export function createChannel({ channelId, selfName, relay, onJoinError }: CreateChannelOptions): Channel {
	const store = createStore<ChannelState>()(() => ({
		id: channelId,
		selfId,
		members: {
			[selfId]: { id: selfId, name: selfName, presence: "online", inVoice: false, muted: false, lastSeen: Date.now() },
		},
		timeline: [],
		speaking: {},
	}));

	const room = joinRoom(
		{
			appId: relay.url,
			relayConfig: { supabaseKey: relay.key },
		},
		channelId,
		{
			onJoinError: (e) => {
				console.error("channel join error", e);
				onJoinError?.(e.error);
			},
		},
	);

	const voice = createVoice(room, {
		selfId,
		onSpeakingChange: (id, isSpeaking) => {
			store.setState((s) => ({
				speaking: isSpeaking
					? { ...s.speaking, [id]: true }
					: Object.fromEntries(Object.entries(s.speaking).filter(([key]) => key !== id)),
			}));
		},
	});
	const announceAction = room.makeAction<AnnouncePayload>("announce");
	const textAction = room.makeAction<TextPayload>("text");
	let destroyed = false;
	let name = selfName;

	function announceSelf(target?: string) {
		announceAction.send({ name, inVoice: voice.isActive(), muted: voice.isMuted() }, target ? { target } : undefined);
	}

	function syncSelfVoiceState() {
		store.setState((s) => {
			const self = s.members[selfId];
			return self ? { members: { ...s.members, [selfId]: { ...self, inVoice: voice.isActive(), muted: voice.isMuted() } } } : {};
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
			const previous = s.members[peerId];
			const member: Member = {
				id: peerId,
				name: payload.name,
				presence: "online",
				inVoice: payload.inVoice,
				muted: payload.muted ?? false,
				lastSeen: now,
			};
			let event: TimelineItem | null = null;
			if (previous?.presence !== "online") {
				event = { kind: "member-joined", id: crypto.randomUUID(), at: now, memberId: peerId };
			} else if (previous.name !== payload.name) {
				event = {
					kind: "member-renamed",
					id: crypto.randomUUID(),
					at: now,
					memberId: peerId,
					previousName: previous.name,
					name: payload.name,
				};
			}

			return {
				members: { ...s.members, [peerId]: member },
				timeline: event ? [...s.timeline, event] : s.timeline,
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
		const payload: TextPayload = { id: crypto.randomUUID(), authorName: name, text, at: Date.now() };
		textAction.send(payload);
		appendText(selfId, payload);
	}

	async function joinVoice() {
		if (await voice.join()) syncSelfVoiceState();
	}

	function leaveVoice() {
		voice.leave();
		syncSelfVoiceState();
	}

	function setMuted(muted: boolean) {
		voice.setMuted(muted);
		syncSelfVoiceState();
	}

	function setName(next: string) {
		const trimmed = next.trim();
		if (!trimmed || trimmed === name) return;

		const previousName = name;
		name = trimmed;
		store.setState((s) => {
			const self = s.members[selfId];
			if (!self) return {};
			return {
				members: { ...s.members, [selfId]: { ...self, name } },
				timeline: [
					...s.timeline,
					{ kind: "member-renamed", id: crypto.randomUUID(), at: Date.now(), memberId: selfId, previousName, name },
				],
			};
		});
		announceSelf();
	}

	function destroy() {
		if (destroyed) return;
		destroyed = true;
		voice.destroy();
		room.leave();
	}

	return { store, relay, sendText, joinVoice, leaveVoice, setMuted, setName, destroy };
}
