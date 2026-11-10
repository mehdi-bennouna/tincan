import { type ChannelState } from "#/lib/channel/types.ts";

export function shortId(id: string) {
	return id.slice(0, 4);
}

export function getDisplayNames(members: ChannelState["members"]): Record<string, string> {
	const onlineCounts = new Map<string, number>();
	for (const m of Object.values(members)) {
		if (m.presence === "online") onlineCounts.set(m.name, (onlineCounts.get(m.name) ?? 0) + 1);
	}

	const names: Record<string, string> = {};
	for (const m of Object.values(members)) {
		const others = (onlineCounts.get(m.name) ?? 0) - (m.presence === "online" ? 1 : 0);
		names[m.id] = others > 0 ? `${m.name} #${shortId(m.id)}` : m.name;
	}

	return names;
}
