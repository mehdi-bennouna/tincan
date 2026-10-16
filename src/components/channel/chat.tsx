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
import { type } from "arktype";
import { Send } from "lucide-react";
import { toast } from "sonner";

const SendChatFormSchema = type({
	content: "string > 0",
});

const messages = [
	{
		id: "1",
		content: "Hello people",
		author: {
			id: "1",
			name: "Azpect",
		},
	},
	{
		id: "2",
		content: "message content",
		author: {
			id: "2",
			name: "Bob",
		},
	},
];

const meId = "1";

export function Chat() {
	const sendMessageForm = useForm({
		defaultValues: {
			content: "",
		},
		validators: {
			onSubmit: SendChatFormSchema,
		},
		onSubmit: () => {
			toast("message sent");
		},
	});

	return (
		<Card className="flex h-full flex-col">
			<CardHeader className="border-b">
				<CardTitle>Chat</CardTitle>
			</CardHeader>

			<CardContent className="min-h-0 flex-1">
				<MessageScrollerProvider>
					<MessageScroller>
						<MessageScrollerViewport>
							<MessageScrollerContent>
								{messages.map((message) => {
									const isMe = message.author.id === meId;

									return (
										<MessageScrollerItem key={message.id} messageId={message.id}>
											<Message align={isMe ? "end" : "start"}>
												<MessageContent>
													<span className={`text-muted-foreground text-xs ${isMe ? "self-end" : "self-start"}`}>
														{message.author.name}
													</span>
													<Bubble>
														<BubbleContent className="whitespace-pre-wrap wrap-break-word">
															{message.content}
														</BubbleContent>
													</Bubble>
												</MessageContent>
											</Message>
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
					className="flex items-start justify-start w-full gap-2"
					onSubmit={(e) => {
						e.preventDefault();
						sendMessageForm.handleSubmit();
					}}
				>
					<sendMessageForm.Field
						name={"content"}
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
						<Button type="submit" size="icon">
							<Send />
						</Button>
					</Field>
				</form>
			</CardFooter>
		</Card>
	);
}
