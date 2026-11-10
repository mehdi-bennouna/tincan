import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { SupabaseGuide } from "#/components/channel/supabase-guide.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { getDefaultRelay, getSavedRelay, relayKeyError, relayUrlError, saveRelay, type RelayConfig } from "#/lib/relay.ts";
import { getSavedUsername, saveUsername } from "#/lib/username.ts";
import { type } from "arktype";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect } from "react";

const RoomFormSchema = type({
	channelId: "string > 0",
	peerName: "string > 0",
	useCustomRelay: "boolean",
	relayUrl: "string",
	relayKey: "string",
});

function TextField({
	field,
	label,
	description,
	type: inputType = "text",
}: Readonly<{ field: AnyFieldApi; label: string; description?: string; type?: string }>) {
	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

	return (
		<Field>
			<FieldLabel htmlFor={field.name}>{label}</FieldLabel>
			<Input
				id={field.name}
				name={field.name}
				type={inputType}
				value={field.state.value as string}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				aria-invalid={isInvalid}
				autoComplete="off"
			/>
			{description !== undefined && <FieldDescription>{description}</FieldDescription>}
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
		</Field>
	);
}

export function JoinRoomCard({ channelId, linkRelay = null }: Readonly<{ channelId?: string; linkRelay?: RelayConfig | null }>) {
	const navigate = useNavigate();
	const relayRequired = linkRelay === null && getDefaultRelay() === null;

	const form = useForm({
		defaultValues: {
			channelId: channelId ?? "",
			peerName: "",
			useCustomRelay: relayRequired,
			relayUrl: "",
			relayKey: "",
		},
		validators: {
			onSubmit: RoomFormSchema,
		},
		onSubmit: ({ value }) => {
			saveUsername(value.peerName);
			if (linkRelay === null) {
				saveRelay(value.useCustomRelay ? { url: value.relayUrl, key: value.relayKey } : null);
			}
			if (channelId === undefined) {
				navigate({ to: "/channels/$channelId", params: { channelId: value.channelId } });
			}
		},
	});

	useEffect(() => {
		const saved = getSavedUsername();
		if (saved !== null) form.setFieldValue("peerName", saved);

		const relay = getSavedRelay();
		if (relay !== null) {
			form.setFieldValue("useCustomRelay", true);
			form.setFieldValue("relayUrl", relay.url);
			form.setFieldValue("relayKey", relay.key);
		}
	}, [form]);

	const whenCustomRelay =
		(check: (value: string) => string | null) =>
		({ value, fieldApi }: { value: string; fieldApi: AnyFieldApi }) =>
			fieldApi.form.getFieldValue("useCustomRelay") === true ? (check(value) ?? undefined) : undefined;

	return (
		<Card className="w-md max-w-11/12">
			{channelId !== undefined && (
				<CardHeader>
					<CardTitle>Join {channelId}</CardTitle>
				</CardHeader>
			)}
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
							{channelId === undefined && (
								<form.Field name="channelId" children={(field) => <TextField field={field} label="Channel ID" />} />
							)}

							<form.Field name="peerName" children={(field) => <TextField field={field} label="Username" />} />

							{linkRelay !== null ? (
								<FieldDescription>Connecting through the Supabase project from your invite link.</FieldDescription>
							) : (
								<form.Field
									name="useCustomRelay"
									children={(toggle) => (
										<>
											{!relayRequired && (
												<Button
													type="button"
													variant="ghost"
													className="justify-start px-0"
													aria-expanded={toggle.state.value}
													onClick={() => toggle.handleChange(!toggle.state.value)}
												>
													{toggle.state.value ? <ChevronDown /> : <ChevronRight />}
													Use your own Supabase project
												</Button>
											)}

											{toggle.state.value && (
												<>
													<form.Field
														name="relayUrl"
														validators={{ onSubmit: whenCustomRelay(relayUrlError) }}
														children={(field) => (
															<TextField field={field} label="Supabase project URL" type="url" />
														)}
													/>
													<form.Field
														name="relayKey"
														validators={{ onSubmit: whenCustomRelay(relayKeyError) }}
														children={(field) => (
															<TextField
																field={field}
																label="Publishable (anon) key"
																description="Only people using the same project can find each other. The key is shared in your invite links, so never use a secret key."
															/>
														)}
													/>
													<SupabaseGuide />
												</>
											)}
										</>
									)}
								/>
							)}
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
