import { useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { useChannel, useChannelState, useDisplayNames } from "#/providers/channel-provider.tsx";
import { Headphones, Mic, MicOff, X } from "lucide-react";
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

function Peer({
	id,
	name,
	inVoice,
	muted,
	speaking,
}: Readonly<{ id: string; name: string; inVoice: boolean; muted: boolean; speaking: boolean }>) {
	return (
		<div className="flex items-center justify-between gap-2 border-b w-full p-4">
			<div className="flex min-w-0 flex-col gap-2">
				<p className="font-semibold">{name}</p>
				<p className="font-light truncate">{id}</p>
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

	const online = Object.values(members).filter((m) => m.presence === "online");

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
						id={m.id}
						name={names[m.id] ?? m.name}
						inVoice={m.inVoice}
						muted={m.muted}
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
