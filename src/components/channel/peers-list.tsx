import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card.tsx";
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

export function PeersList() {
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
		</Card>
	);
}
