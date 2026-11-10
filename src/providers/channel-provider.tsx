import { createChannel, type Channel } from "#/lib/channel/channel.ts";
import { type ChannelState } from "#/lib/channel/types.ts";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useStore } from "zustand";

const ChannelContext = createContext<Channel | null>(null);

export function ChannelProvider({ children, channelId, selfName }: Readonly<{ children: ReactNode; channelId: string; selfName: string }>) {
	const [channel, setChannel] = useState<Channel | null>(null);

	useEffect(() => {
		const next = createChannel({
			channelId,
			selfName,
			onJoinError: (error) => toast.error("Could not join channel", { description: error }),
		});
		setChannel(next);

		return () => {
			next.destroy();
			setChannel(null);
		};
	}, [channelId, selfName]);

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
