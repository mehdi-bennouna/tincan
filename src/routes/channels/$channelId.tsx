import { createFileRoute } from "@tanstack/react-router";
import { Chat } from "#/components/channel/chat.tsx";
import { PeersList } from "#/components/channel/peers-list.tsx";
import { type } from "arktype";

export const Route = createFileRoute("/channels/$channelId")({
	component: RouteComponent,
	validateSearch: type({
		roomId: "string > 0",
		peerName: "string > 0",
		password: "string > 0",
	}),
});

function RouteComponent() {
	return (
		<div className="grid grid-cols-[1fr_5fr] grid-rows-1 gap-4 h-dvh w-dvw p-4">
			<PeersList />
			<Chat />
		</div>
	);
}
