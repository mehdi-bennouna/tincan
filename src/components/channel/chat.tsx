import { useForm } from "@tanstack/react-form";
import { Bubble, BubbleContent } from "#/components/ui/bubble.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { Field, FieldError } from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "#/components/ui/message-scroller.tsx";
import { Message, MessageContent } from "#/components/ui/message.tsx";
import { type TextItem, type TimelineItem } from "#/lib/channel/types.ts";
import { useChannel, useChannelState, useDisplayNames } from "#/providers/channel-provider.tsx";
import { type } from "arktype";
import { Link, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

const SendChatFormSchema = type({
	text: "string > 0",
});

const GROUP_WINDOW_MS = 5 * 60 * 1000;
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

function formatTime(at: number) {
	const date = new Date(at);
	return date.toDateString() === new Date().toDateString() ? timeFormat.format(date) : dateTimeFormat.format(date);
}

function continuesGroup(prev: TimelineItem | undefined, item: TimelineItem) {
	return item.kind === "text" && prev?.kind === "text" && prev.authorId === item.authorId && item.at - prev.at < GROUP_WINDOW_MS;
}

function TextEntry({ item, isMe, name, grouped }: Readonly<{ item: TextItem; isMe: boolean; name: string; grouped: boolean }>) {
	return (
		<Message align={isMe ? "end" : "start"}>
			<MessageContent>
				{!grouped && (
					<span className={`text-muted-foreground text-xs ${isMe ? "self-end" : "self-start"}`}>
						{name} · <time dateTime={new Date(item.at).toISOString()}>{formatTime(item.at)}</time>
					</span>
				)}
				<Bubble title={dateTimeFormat.format(item.at)}>
					<BubbleContent className="whitespace-pre-wrap wrap-break-word">{item.text}</BubbleContent>
				</Bubble>
			</MessageContent>
		</Message>
	);
}

function copyInviteLink(channelId: string) {
	const url = `${window.location.origin}/channels/${encodeURIComponent(channelId)}`;
	navigator.clipboard.writeText(url).then(
		() => toast.success("Invite link copied"),
		() => toast.error("Could not copy the invite link", { description: url }),
	);
}

function TimelineEntry({
	item,
	selfId,
	names,
	grouped,
}: Readonly<{ item: TimelineItem; selfId: string; names: Record<string, string>; grouped: boolean }>) {
	switch (item.kind) {
		case "text":
			return (
				<TextEntry item={item} isMe={item.authorId === selfId} name={names[item.authorId] ?? item.authorName} grouped={grouped} />
			);
		case "member-joined":
		case "member-left":
			return (
				<p className="text-muted-foreground text-center text-xs">
					{names[item.memberId] ?? "Someone"} {item.kind === "member-joined" ? "joined" : "left"}
				</p>
			);
		case "file":
			return null;
	}
}

export function Chat({ togglePeersListVisible }: Readonly<{ togglePeersListVisible: () => void }>) {
	const channel = useChannel();
	const names = useDisplayNames();
	const { channelId, selfId, timeline } = useChannelState(
		useShallow((s) => ({
			channelId: s.id,
			selfId: s.selfId,
			timeline: s.timeline,
		})),
	);

	const sendTextMessageForm = useForm({
		defaultValues: {
			text: "",
		},
		validators: {
			onSubmit: SendChatFormSchema,
		},
		onSubmit: ({ value, formApi }) => {
			channel.sendText(value.text);
			formApi.reset();
		},
	});

	return (
		<Card className="flex h-full flex-col">
			<CardHeader className="flex justify-between border-b">
				<CardTitle>Chat</CardTitle>
				<div className="flex gap-2">
					<Button size="icon" onClick={() => copyInviteLink(channelId)} aria-label="Copy invite link">
						<Link />
					</Button>
					<Button size="icon" onClick={togglePeersListVisible} className="md:hidden">
						<Users />
					</Button>
				</div>
			</CardHeader>

			<CardContent className="min-h-0 flex-1">
				<MessageScrollerProvider>
					<MessageScroller>
						<MessageScrollerViewport>
							<MessageScrollerContent>
								{timeline.map((item, i) => {
									const grouped = continuesGroup(timeline[i - 1], item);
									return (
										<MessageScrollerItem key={item.id} messageId={item.id} className={grouped ? "-mt-5" : undefined}>
											<TimelineEntry item={item} selfId={selfId} names={names} grouped={grouped} />
										</MessageScrollerItem>
									);
								})}
							</MessageScrollerContent>
						</MessageScrollerViewport>
						<MessageScrollerButton />
					</MessageScroller>
				</MessageScrollerProvider>
			</CardContent>

			<CardFooter className="h-16 bg-card">
				<form
					id="send-text-message-form"
					className="flex items-start justify-start w-full gap-2"
					onSubmit={(e) => {
						e.preventDefault();
						sendTextMessageForm.handleSubmit();
					}}
				>
					<sendTextMessageForm.Field
						name={"text"}
						children={(field) => {
							const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid} className="w-full" orientation="horizontal">
									<Input
										className="w-full"
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
										autoComplete="off"
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					/>

					<Field orientation="horizontal" className="flex-1">
						<Button type="submit" size="icon" form="send-text-message-form">
							<Send />
						</Button>
					</Field>
				</form>
			</CardFooter>
		</Card>
	);
}
