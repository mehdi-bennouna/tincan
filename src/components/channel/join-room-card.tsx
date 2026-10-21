import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { Field, FieldError, FieldGroup, FieldLabel } from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { type } from "arktype";

const RoomFormSchema = type({
	channelId: "string > 0",
	peerName: "string > 0",
});

export function JoinRoomCard() {
	const navigate = useNavigate();

	const form = useForm({
		defaultValues: {
			channelId: "",
			peerName: "",
		},
		validators: {
			onSubmit: RoomFormSchema,
		},
		onSubmit: ({ value }) => {
			navigate({
				to: `/channels/${value.channelId}`,
				search: { channelId: value.channelId, selfPeerName: value.peerName },
			});
		},
	});
	return (
		<Card className="w-md max-w-11/12">
			<CardContent>
				<form
					id="room-form"
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<FieldGroup>
						<FieldGroup>
							<form.Field
								name={"channelId"}
								children={(field) => {
									const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

									return (
										<Field>
											<FieldLabel htmlFor={field.name}>Channel ID</FieldLabel>
											<Input
												id={field.name}
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

							<form.Field
								name={"peerName"}
								children={(field) => {
									const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

									return (
										<Field>
											<FieldLabel htmlFor={field.name}>Username</FieldLabel>
											<Input
												id={field.name}
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
						</FieldGroup>

						<Field orientation="responsive">
							<Button type="submit" form="room-form">
								Join Room
							</Button>
						</Field>
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	);
}
