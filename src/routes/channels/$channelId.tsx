import { createFileRoute } from "@tanstack/react-router";
import { Chat } from "#/components/channel/chat.tsx";
import { PeersList } from "#/components/channel/peers-list.tsx";
import { useChannel } from "#/hooks/use-channel.tsx";
import { ChannelProvider } from "#/providers/channel-provider.tsx";
import { type } from "arktype";
import { useState } from "react";

export const Route = createFileRoute("/channels/$channelId")({
	component: RouteComponent,
	validateSearch: type({
		selfPeerName: "string > 0",
		channelId: "string > 0",
	}),
});

function RouteComponent() {
	const { channelId } = Route.useSearch();

	return (
		<ChannelProvider channelId={channelId}>
			<Page />
		</ChannelProvider>
	);
}

function Page() {
	const [peersListVisible, setPeersListVisible] = useState(false);
	const { selfPeerName, channelId } = Route.useSearch();

	const { client } = useChannel({ localPeerName: selfPeerName, channelId });

	if (!client) {
		return null;
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-[1fr_5fr] grid-rows-1 gap-4 h-dvh w-dvw p-4">
			<div className={`${peersListVisible ? "block" : "hidden"} md:block col-start-1 row-start-1 z-10`}>
				<PeersList client={client} togglePeersListVisible={() => setPeersListVisible((old) => !old)} />
			</div>
			<div className="col-start-1 md:col-start-2 row-start-1">
				<Chat client={client} togglePeersListVisible={() => setPeersListVisible((old) => !old)} />
			</div>
		</div>
	);
}
