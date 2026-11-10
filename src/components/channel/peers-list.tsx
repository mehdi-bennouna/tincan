import { useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { shortId } from "#/lib/channel/names.ts";
import { type Member } from "#/lib/channel/types.ts";
import { saveUsername } from "#/lib/username.ts";
import { useChannel, useChannelState, useDisplayNames } from "#/providers/channel-provider.tsx";
import { Headphones, Mic, MicOff, Pencil, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

function voiceErrorMessage(e: unknown) {
	if (!(e instanceof DOMException)) return "Something went wrong while accessing the microphone.";

	switch (e.name) {
		case "NotAllowedError":
			return "Microphone access was denied. Allow it in your browser settings and try again.";
		case "NotFoundError":
			return "No microphone was found.";
		case "NotReadableError":
			return "Your microphone is being used by another app.";
		default:
			return e.message;
	}
}

function SelfName({ name, displayName }: Readonly<{ name: string; displayName: string }>) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(name);
	const cancelled = useRef(false);

	function commit() {
		if (!cancelled.current && draft.trim()) saveUsername(draft);
		setEditing(false);
	}

	if (editing) {
		return (
			<form
				onSubmit={(e) => {
					e.preventDefault();
					commit();
				}}
			>
				<Input
					autoFocus
					aria-label="Your name"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onBlur={commit}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							cancelled.current = true;
							setEditing(false);
						}
					}}
				/>
			</form>
		);
	}

	return (
		<div className="flex min-w-0 items-center gap-1">
			<p className="truncate font-semibold">
				{displayName} <span className="font-normal text-muted-foreground">(you)</span>
			</p>
			<Button
				size="icon-xs"
				variant="ghost"
				aria-label="Change name"
				onClick={() => {
					cancelled.current = false;
					setDraft(name);
					setEditing(true);
				}}
			>
				<Pencil />
			</Button>
		</div>
	);
}

function Peer({
	member,
	displayName,
	isSelf,
	speaking,
}: Readonly<{ member: Member; displayName: string; isSelf: boolean; speaking: boolean }>) {
	const { id, name, inVoice, muted } = member;

	return (
		<div className="flex items-center justify-between gap-2 border-b w-full p-4">
			<div className="flex min-w-0 flex-col gap-1">
				{isSelf ? <SelfName name={name} displayName={displayName} /> : <p className="truncate font-semibold">{displayName}</p>}
				<p className="text-xs font-light text-muted-foreground" title={id}>
					#{shortId(id)}
				</p>
			</div>
			{inVoice && muted && <MicOff aria-label="Muted" className="size-4 shrink-0 text-destructive" />}
			{inVoice && !muted && (
				<Headphones
					aria-label={speaking ? "Speaking" : "In voice"}
					className={`size-4 shrink-0 transition-colors ${speaking ? "text-green-500" : "text-muted-foreground"}`}
				/>
			)}
		</div>
	);
}

export function PeersList({ togglePeersListVisible }: Readonly<{ togglePeersListVisible: () => void }>) {
	const channel = useChannel();
	const navigate = useNavigate();
	const { self, members, speaking } = useChannelState(
		useShallow((s) => ({
			self: s.members[s.selfId],
			members: s.members,
			speaking: s.speaking,
		})),
	);
	const names = useDisplayNames();

	if (!self) return null;

	const others = Object.values(members).filter((m) => m.presence === "online" && m.id !== self.id);
	const online = [self, ...others];

	return (
		<Card className="flex h-full flex-col gap-0">
			<CardHeader className="flex justify-between border-b">
				<CardTitle>Peers</CardTitle>
				<Button size="icon" onClick={togglePeersListVisible} className="md:hidden">
					<X />
				</Button>
			</CardHeader>

			<CardContent className="min-h-0 flex-1 p-0">
				{online.map((m) => (
					<Peer
						key={m.id}
						member={m}
						displayName={names[m.id] ?? m.name}
						isSelf={m.id === self.id}
						speaking={speaking[m.id] ?? false}
					/>
				))}
			</CardContent>

			<CardFooter className="flex-col gap-3">
				{self.inVoice ? (
					<div className="flex w-full gap-3">
						<Button
							size="icon"
							variant={self.muted ? "destructive" : "default"}
							onClick={() => channel.setMuted(!self.muted)}
							aria-label={self.muted ? "Unmute" : "Mute"}
							aria-pressed={self.muted}
						>
							{self.muted ? <MicOff /> : <Mic />}
						</Button>
						<Button className="flex-1" onClick={() => channel.leaveVoice()}>
							Leave Voice
						</Button>
					</div>
				) : (
					<Button
						className="w-full"
						onClick={() => {
							channel.joinVoice().catch((e: unknown) => {
								console.error("could not join voice", e);
								toast.error("Could not join voice", { description: voiceErrorMessage(e) });
							});
						}}
					>
						Join Voice
					</Button>
				)}
				<Button className="w-full" variant="destructive" onClick={() => navigate({ to: "/" })}>
					Leave channel
				</Button>
			</CardFooter>
		</Card>
	);
}
