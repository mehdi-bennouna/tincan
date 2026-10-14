import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "#/components/ui/card.tsx";

export const Route = createFileRoute("/")({ component: RouteComponent });

function RouteComponent() {
	return (
		<div className="flex items-center justify-center h-dvh w-dvw">
			<Card className="w-md">
				<CardContent>
					<p className='text-center'>ICY COMMS</p>
				</CardContent>
			</Card>
		</div>
	);
}
