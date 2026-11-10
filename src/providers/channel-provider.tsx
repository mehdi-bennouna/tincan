import { createChannel, type Channel } from "#/lib/channel/channel.ts";
import { getDisplayNames } from "#/lib/channel/names.ts";
import { type ChannelState } from "#/lib/channel/types.ts";
import { type RelayConfig } from "#/lib/relay.ts";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useStore } from "zustand";

const ChannelContext = createContext<Channel | null>(null);

export function ChannelProvider({
	children,
	channelId,
	selfName,
	relay,
}: Readonly<{ children: ReactNode; channelId: string; selfName: string; relay: RelayConfig }>) {
	const [channel, setChannel] = useState<Channel | null>(null);

	const { url: relayUrl, key: relayKey } = relay;
	useEffect(() => {
		const next = createChannel({
			channelId,
			selfName,
			relay: { url: relayUrl, key: relayKey },
			onJoinError: (error) => toast.error("Could not join channel", { description: error }),
		});
		setChannel(next);

		return () => {
			next.destroy();
			setChannel(null);
		};
	}, [channelId, relayUrl, relayKey]);

	useEffect(() => {
		channel?.setName(selfName);
	}, [channel, selfName]);

	if (!channel) return null;

	return <ChannelContext.Provider value={channel}>{children}</ChannelContext.Provider>;
}

export function useChannel(): Channel {
	const channel = useContext(ChannelContext);
	if (!channel) {
		throw new Error("useChannel must be used within a <ChannelProvider>");
	}

	return channel;
}

export function useChannelState<T>(selector: (state: ChannelState) => T): T {
	return useStore(useChannel().store, selector);
}

export function useDisplayNames(): Record<string, string> {
	const members = useChannelState((s) => s.members);
	return useMemo(() => getDisplayNames(members), [members]);
}
