import { useChannel } from "#/providers/channel-provider.tsx";
import { useEffect } from "react";

export function useUnreadTitle() {
	const { store } = useChannel();

	useEffect(() => {
		const baseTitle = document.title;
		let unread = 0;

		function render() {
			document.title = unread > 0 ? `(${unread}) ${baseTitle}` : baseTitle;
		}

		const unsubscribe = store.subscribe((state, prev) => {
			if (!document.hidden || state.timeline === prev.timeline) return;

			const added = state.timeline.slice(prev.timeline.length).filter((i) => i.kind === "text" && i.authorId !== state.selfId).length;
			if (added === 0) return;

			unread += added;
			render();
		});

		function onVisibilityChange() {
			if (document.hidden) return;
			unread = 0;
			render();
		}

		document.addEventListener("visibilitychange", onVisibilityChange);

		return () => {
			unsubscribe();
			document.removeEventListener("visibilitychange", onVisibilityChange);
			document.title = baseTitle;
		};
	}, [store]);
}
