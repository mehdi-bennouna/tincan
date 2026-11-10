import { createFileRoute } from "@tanstack/react-router";
import { Chat } from "#/components/channel/chat.tsx";
import { JoinRoomCard } from "#/components/channel/join-room-card.tsx";
import { PeersList } from "#/components/channel/peers-list.tsx";
import { useUnreadTitle } from "#/hooks/use-unread-title.ts";
import { useSavedUsername } from "#/lib/username.ts";
import { ChannelProvider } from "#/providers/channel-provider.tsx";
import { useState } from "react";

export const Route = createFileRoute("/channels/$channelId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { channelId } = Route.useParams();
	const username = useSavedUsername();

	if (username === undefined) return null;

	if (username === null) {
		return (
			<div className="flex items-center justify-center h-dvh w-dvw">
				<JoinRoomCard channelId={channelId} />
			</div>
		);
	}

	return (
		<ChannelProvider channelId={channelId} selfName={username}>
			<Page />
		</ChannelProvider>
	);
}

function Page() {
	const [peersListVisible, setPeersListVisible] = useState(false);
	useUnreadTitle();

	return (
		<div className="grid grid-cols-1 md:grid-cols-[1fr_5fr] grid-rows-1 gap-4 h-dvh w-dvw p-4">
			<div className={`${peersListVisible ? "block" : "hidden"} md:block col-start-1 row-start-1 z-10`}>
				<PeersList togglePeersListVisible={() => setPeersListVisible((old) => !old)} />
			</div>
			<div className="col-start-1 md:col-start-2 row-start-1">
				<Chat togglePeersListVisible={() => setPeersListVisible((old) => !old)} />
			</div>
		</div>
	);
}
