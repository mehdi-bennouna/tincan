import { type } from "arktype";

export const AnnouncePayload = type({
	"name": "string > 0",
	"inVoice": "boolean",
	"muted?": "boolean",
});
export type AnnouncePayload = typeof AnnouncePayload.infer;

export const TextPayload = type({
	id: "string > 0",
	authorName: "string > 0",
	text: "string > 0",
	at: "number",
});
export type TextPayload = typeof TextPayload.infer;
