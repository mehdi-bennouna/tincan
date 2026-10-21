import { selfId } from "@trystero-p2p/supabase";
import { createChannelClient, type ChannelClient } from "#/lib/webrtc/channel-client.ts";
import { useChannelStore, type ChannelStore } from "#/providers/channel-provider.tsx";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";

export type UseConnectionProps = {
	selfPeerName: string;
	channelId: string;
};

export function useChannel({ selfPeerName, channelId }: UseConnectionProps) {
	const [client, setClient] = useState<ChannelClient | null>(null);

	const { addMessage, upsertPeer, removePeer } = useChannelStore<{
		addMessage: ChannelStore["addMessage"];
		upsertPeer: ChannelStore["upsertPeer"];
		removePeer: ChannelStore["removePeer"];
	}>(
		useShallow((s) => ({
			messages: s.messages,
			peers: s.peers,
			addMessage: s.addMessage,
			upsertPeer: s.upsertPeer,
			removePeer: s.removePeer,
		})),
	);

	useEffect(() => {
		upsertPeer(selfId, { id: selfId, name: selfPeerName });
	}, []);

	useEffect(() => {
		setClient(
			createChannelClient({
				config: { channelId, selfPeerName: selfPeerName },
				events: {
					onPeerJoin: (peerId) => {
						console.log("peer join", { peerId });
					},
					onPeerLeave: (peerId) => {
						removePeer(peerId);
					},
					onPeerAnnounce: (peerId, peer) => {
						upsertPeer(peerId, peer);
					},
					onChannelMessage: (message) => {
						addMessage(message);
					},
				},
			}),
		);
	}, []);

	return { client };
}
