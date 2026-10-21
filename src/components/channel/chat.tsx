import { useForm } from "@tanstack/react-form";
import { selfId } from "@trystero-p2p/supabase";
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
import { type ChannelClient } from "#/lib/webrtc/channel-client.ts";
import { useChannelStore, type ChannelStore } from "#/providers/channel-provider.tsx";
import { type } from "arktype";
import { Send, Users } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

const SendChatFormSchema = type({
	text: "string > 0",
});

export function Chat({ client, togglePeersListVisible }: Readonly<{ client: ChannelClient; togglePeersListVisible: () => void }>) {
	const { messages, peerFromPeerId } = useChannelStore<{
		messages: ChannelStore["messages"];
		peerFromPeerId: ChannelStore["peerFromPeerId"];
	}>(
		useShallow((s) => ({
			messages: s.messages,
			peerFromPeerId: s.peerFromPeerId,
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
			client.sendChannelMessage({ text: value.text });
			formApi.reset();
		},
	});

	return (
		<Card className="flex h-full flex-col">
			<CardHeader className="flex justify-between border-b">
				<CardTitle>Chat</CardTitle>
				<Button size="icon" onClick={togglePeersListVisible} className="md:hidden">
					<Users />
				</Button>
			</CardHeader>

			<CardContent className="min-h-0 flex-1">
				<MessageScrollerProvider>
					<MessageScroller>
						<MessageScrollerViewport>
							<MessageScrollerContent>
								{messages.map((message) => {
									const isMe = message.authorId === selfId;

									if (message.type === "text") {
										return (
											<MessageScrollerItem key={message.id} messageId={message.id}>
												<Message align={isMe ? "end" : "start"}>
													<MessageContent>
														<span
															className={`text-muted-foreground text-xs ${isMe ? "self-end" : "self-start"}`}
														>
															{peerFromPeerId(message.authorId).name}
														</span>
														<Bubble>
															<BubbleContent className="whitespace-pre-wrap wrap-break-word">
																{message.text}
															</BubbleContent>
														</Bubble>
													</MessageContent>
												</Message>
											</MessageScrollerItem>
										);
									}

									return null;
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
