import { useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { useChannel, useChannelState } from "#/providers/channel-provider.tsx";
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

export function PeersList({ togglePeersListVisible }: Readonly<{ togglePeersListVisible: () => void }>) {
	const channel = useChannel();
	const navigate = useNavigate();
	const { self, members } = useChannelState(
		useShallow((s) => ({
			self: s.members[s.selfId],
			members: s.members,
		})),
	);

	if (!self) return null;

	const online = Object.values(members).filter((m) => m.presence === "online");

	return (
		<Card className="flex h-full flex-col gap-0">
			<CardHeader className="flex justify-between border-b">
				<CardTitle>Peers</CardTitle>
				<Button size="icon" onClick={togglePeersListVisible} className="md:hidden">
					<X />
				</Button>
			</CardHeader>

			<CardContent className="min-h-0 flex-1 p-0">
				{online.map((m) => (
					<Peer key={m.id} id={m.id} name={m.name} />
				))}
			</CardContent>

			<CardFooter className="flex-col gap-3">
				{self.inVoice ? (
					<Button className="w-full" onClick={() => channel.leaveVoice()}>
						Leave Voice
					</Button>
				) : (
					<Button
						className="w-full"
						onClick={() => {
							channel.joinVoice().catch((e: unknown) => {
								console.error("could not join voice", e);
							});
						}}
					>
						Join Voice
					</Button>
				)}
				<Button className="w-full" variant="destructive" onClick={() => navigate({ to: "/" })}>
					Leave channel
				</Button>
			</CardFooter>
		</Card>
	);
}
