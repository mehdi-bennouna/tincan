import { joinRoom, selfId } from "@trystero-p2p/supabase";
import { type ChannelMessage, type ChannelPeer } from "#/providers/channel-provider.tsx";

export type CreateChannelClientProps = {
	config: {
		channelId: string;
		selfPeerName: string;
	};
	events: {
		onPeerJoin: (peerId: string) => void;
		onPeerLeave: (peerId: string) => void;
		onPeerAnnounce: (peerId: string, peer: ChannelPeer) => void;
		onChannelMessage: (message: ChannelMessage) => void;
	};
};

export type ChannelClient = {
	sendChannelMessage: ({ text }: { text: string }) => void;
};

export function createChannelClient({ config: { channelId, selfPeerName }, events }: CreateChannelClientProps): ChannelClient {
	const selfPeer = { id: selfId, name: selfPeerName };

	const connection = joinRoom(
		{
			appId: import.meta.env.VITE_APP_ID,
			relayConfig: { supabaseKey: import.meta.env.VITE_APP_PUBLIC_KEY },
		},
		channelId,
		{
			onJoinError: (e) => {
				console.log("join-error", e);
			},
		},
	);

	const announceAction = connection.makeAction<ChannelPeer>("announce");
	const channelMessageAction = connection.makeAction<ChannelMessage>("channel-message");

	connection.onPeerJoin = (peerId) => {
		announceAction.send(selfPeer, { target: peerId });
		events.onPeerJoin(peerId);
	};

	connection.onPeerLeave = (peerId) => {
		events.onPeerLeave(peerId);
	};

	announceAction.onMessage = (payload, { peerId }) => {
		events.onPeerAnnounce(peerId, payload);
	};

	channelMessageAction.onMessage = (payload) => {
		events.onChannelMessage(payload);
	};

	function sendChannelMessage({ text }: { text: string }) {
		const payload: ChannelMessage = {
			id: crypto.randomUUID(),
			type: "text",
			authorId: selfPeer.id,
			timestamp: Date.now(),
			text,
		};
		channelMessageAction.send(payload);
		events.onChannelMessage(payload);
	}

	return { sendChannelMessage };
}
