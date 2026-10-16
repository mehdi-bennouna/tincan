import { createFileRoute } from "@tanstack/react-router";
import { JoinRoomCard } from "#/components/channel/join-room-card.tsx";

export const Route = createFileRoute("/")({ component: RouteComponent });

function RouteComponent() {
	return (
		<div className="flex items-center justify-center h-dvh w-dvw">
			<JoinRoomCard />
		</div>
	);
}
