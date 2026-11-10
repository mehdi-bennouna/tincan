export type Member = {
	id: string;
	name: string;
	presence: "online" | "offline";
	inVoice: boolean;
	lastSeen: number;
};

type BaseTimelineItem = {
	id: string;
	at: number;
};

export type TextItem = BaseTimelineItem & {
	kind: "text";
	authorId: string;
	authorName: string;
	text: string;
};

export type FileItem = BaseTimelineItem & {
	kind: "file";
	authorId: string;
	authorName: string;
	file: {
		name: string;
		url: string;
		size: number; // bytes
		mimeType: string;
	};
};

export type PresenceItem = BaseTimelineItem & {
	kind: "member-joined" | "member-left";
	memberId: string;
};

export type TimelineItem = TextItem | FileItem | PresenceItem;

export type ChannelState = {
	id: string;
	selfId: string;
	members: Record<string, Member>;
	timeline: Array<TimelineItem>;
};
