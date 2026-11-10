import { CircleHelp } from "lucide-react";
import { type ReactNode } from "react";

function ExternalLink({ href, children }: Readonly<{ href: string; children: ReactNode }>) {
	return (
		<a href={href} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">
			{children}
		</a>
	);
}

function Path({ children }: Readonly<{ children: ReactNode }>) {
	return <span className="font-medium text-foreground">{children}</span>;
}

export function SupabaseGuide() {
	return (
		<details className="group text-xs text-muted-foreground">
			<summary className="flex cursor-pointer list-none items-center gap-1.5 text-foreground [&::-webkit-details-marker]:hidden">
				<CircleHelp className="size-3.5" />
				How do I get these?
			</summary>

			<ol className="mt-3 flex list-decimal flex-col gap-2 pl-4">
				<li>
					Create a free project at <ExternalLink href="https://supabase.com/dashboard">supabase.com/dashboard</ExternalLink>. No
					tables or SQL are needed, only Realtime is used.
				</li>
				<li>
					Open the project and click <Path>Connect</Path> at the top. It shows the project URL and the publishable key. You can
					also find the keys under <Path>Settings → API Keys</Path>.
				</li>
				<li>
					Paste the <Path>project URL</Path>, which looks like <code>https://abcd.supabase.co</code>.
				</li>
				<li>
					Paste the <Path>publishable key</Path> (<code>sb_publishable_…</code>). Older projects may only have the legacy{" "}
					<Path>anon</Path> key, which also works. Never use a <Path>secret</Path> or <Path>service_role</Path> key.
				</li>
				<li>
					Keep <Path>Allow public access</Path> enabled under <Path>Realtime → Settings</Path>. It's on by default. If it's off,
					peers can't find each other.
				</li>
				<li>Send your friends an invite link from the chat so they connect through the same project.</li>
			</ol>
		</details>
	);
}
