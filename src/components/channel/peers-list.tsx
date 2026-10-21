import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { type ChannelClient } from "#/lib/webrtc/channel-client.ts";
import { useChannelStore, type ChannelStore } from "#/providers/channel-provider.tsx";
import { useShallow } from "zustand/react/shallow";

function Peer({ id, name }: Readonly<{ id: string; name: string }>) {
	return (
		<div className="flex flex-col gap-2 border-b w-full p-4">
			<p className="font-semibold">{name}</p>
			<p className="font-light">{id}</p>
		</div>
	);
}

export function PeersList({ client }: Readonly<{ client: ChannelClient }>) {
	const { peers } = useChannelStore<{
		peers: ChannelStore["peers"];
	}>(
		useShallow((s) => ({
			peers: s.peers,
		})),
	);

	return (
		<Card className="flex h-full flex-col gap-0">
			<CardHeader className="border-b">
				<CardTitle>Peers</CardTitle>
			</CardHeader>

			<CardContent className="min-h-0 flex-1 p-0">
				{Object.entries(peers).map(([id, p]) => (
					<Peer key={id} id={id} name={p.name} />
				))}
			</CardContent>

			<CardFooter className="flex-col gap-3">
				<Button className="w-full">Join Voice</Button>
				<Button className="w-full" variant="destructive" onClick={() => client.leaveChannel()}>
					Leave channel
				</Button>
			</CardFooter>
		</Card>
	);
}
