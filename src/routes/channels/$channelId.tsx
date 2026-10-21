import { createFileRoute } from "@tanstack/react-router";
import { Chat } from "#/components/channel/chat.tsx";
import { PeersList } from "#/components/channel/peers-list.tsx";
import { useChannel } from "#/hooks/use-channel.tsx";
import { ChannelProvider } from "#/providers/channel-provider.tsx";
import { type } from "arktype";

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
	const { selfPeerName, channelId } = Route.useSearch();

	const { client } = useChannel({ selfPeerName, channelId });

	if (!client) {
		return null;
	}

	return (
		<div className="grid grid-cols-[1fr_5fr] grid-rows-1 gap-4 h-dvh w-dvw p-4">
			<PeersList />
			<Chat client={client} />
		</div>
	);
}
