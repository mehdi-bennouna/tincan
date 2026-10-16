import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "#/components/ui/card.tsx";

const peers = [
	{ id: "1", name: "Azpect" },
	{ id: "2", name: "Bob" },
];

function Peer({ id, name }: Readonly<{ id: string; name: string }>) {
	return (
		<div className="flex flex-col gap-2 border-b w-full p-4">
			<p className="font-semibold">{name}</p>
			<p className="font-light">{id}</p>
		</div>
	);
}

export function PeersList() {
	return (
		<Card className="flex h-full flex-col gap-0">
			<CardHeader className="border-b">
				<CardTitle>Peers</CardTitle>
			</CardHeader>

			<CardContent className="min-h-0 flex-1 p-0">
				{peers.map(({ id, name }) => (
					<Peer key={id} id={id} name={name} />
				))}
			</CardContent>

			<CardFooter className="h-16 bg-card"></CardFooter>
		</Card>
	);
}
