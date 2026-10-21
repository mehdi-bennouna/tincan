import { selfId } from "@trystero-p2p/supabase";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { type ChannelClient } from "#/lib/webrtc/channel-client.ts";
import { useChannelStore, type ChannelPeer, type ChannelStore } from "#/providers/channel-provider.tsx";
import { X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

function Peer({ id, name }: Readonly<{ id: string; name: string }>) {
	return (
		<div className="flex flex-col gap-2 border-b w-full p-4">
			<p className="font-semibold">{name}</p>
			<p className="font-light">{id}</p>
		</div>
	);
}

export function PeersList({ client, togglePeersListVisible }: Readonly<{ client: ChannelClient; togglePeersListVisible: () => void }>) {
	const { localPeer, peers } = useChannelStore<{
		localPeer: ChannelPeer | undefined;
		peers: ChannelStore["peers"];
	}>(
		useShallow((s) => ({
			localPeer: s.peers[selfId],
			peers: s.peers,
		})),
	);

	if (!localPeer) return null;

	return (
		<Card className="flex h-full flex-col gap-0">
			<CardHeader className="flex justify-between border-b">
				<CardTitle>Peers</CardTitle>
				<Button size="icon" onClick={togglePeersListVisible} className="md:hidden">
					<X />
				</Button>
			</CardHeader>

			<CardContent className="min-h-0 flex-1 p-0">
				{Object.entries(peers).map(([id, p]) => (
					<Peer key={id} id={id} name={p.name} />
				))}
			</CardContent>

			<CardFooter className="flex-col gap-3">
				{localPeer.inVoice ? (
					<Button className="w-full" onClick={() => client.leaveVoice()}>
						Leave Voice
					</Button>
				) : (
					<Button className="w-full" onClick={() => client.joinVoice()}>
						Join Voice
					</Button>
				)}
				<Button className="w-full" variant="destructive" onClick={() => client.leaveChannel()}>
					Leave channel
				</Button>
			</CardFooter>
		</Card>
	);
}
