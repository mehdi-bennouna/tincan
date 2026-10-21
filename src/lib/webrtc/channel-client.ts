import { joinRoom, selfId } from "@trystero-p2p/supabase";
import { type ChannelMessage, type ChannelPeer } from "#/providers/channel-provider.tsx";

export type CreateChannelClientProps = {
	config: {
		channelId: string;
		selfPeerName: string;
	};
	events: {
		onPeerJoin: (peerId: string) => void;
		onPeerLeave: (peerId: string) => void;
		onPeerAnnounce: (peerId: string, peer: ChannelPeer) => void;
		onChannelMessage: (message: ChannelMessage) => void;
		onLeaveChannel: () => void;
	};
};

export type ChannelClient = {
	sendChannelMessage: ({ text }: { text: string }) => void;
	joinVoice: () => void;
	leaveVoice: () => void;
	leaveChannel: () => void;
};

export function createChannelClient({ config: { channelId, selfPeerName }, events }: CreateChannelClientProps): ChannelClient {
	const selfPeer = { id: selfId, name: selfPeerName };

	let inVoice = false;
	let localStream: MediaStream | null = null;
	const remoteAudioStreams = new Map<string, MediaStream>();
	const remoteAudio = new Map<string, HTMLAudioElement>();

	const connection = joinRoom(
		{
			appId: import.meta.env.VITE_APP_ID,
			relayConfig: { supabaseKey: import.meta.env.VITE_APP_PUBLIC_KEY },
		},
		channelId,
		{
			onJoinError: (e) => {
				console.log("join-error", e);
			},
		},
	);

	const announceAction = connection.makeAction<ChannelPeer>("announce");
	const channelMessageAction = connection.makeAction<ChannelMessage>("channel-message");

	connection.onPeerJoin = (peerId) => {
		if (localStream) {
			connection.addStream(localStream, { target: peerId });
		}

		announceAction.send(selfPeer, { target: peerId });
		events.onPeerJoin(peerId);
	};

	connection.onPeerLeave = (peerId) => {
		remoteAudioStreams.delete(peerId);
		const audio = remoteAudio.get(peerId);
		if (audio) {
			audio.srcObject = null;
			remoteAudio.delete(peerId);
		}
		events.onPeerLeave(peerId);
	};

	connection.onPeerStream = (stream, peerId) => {
		remoteAudioStreams.set(peerId, stream); // always remember it
		if (inVoice) attachVoice(peerId, stream); // only play it while in voice
	};

	announceAction.onMessage = (payload, { peerId }) => {
		events.onPeerAnnounce(peerId, payload);
	};

	channelMessageAction.onMessage = (payload) => {
		events.onChannelMessage(payload);
	};

	function sendChannelMessage({ text }: { text: string }) {
		const payload: ChannelMessage = {
			id: crypto.randomUUID(),
			type: "text",
			authorId: selfPeer.id,
			timestamp: Date.now(),
			text,
		};
		channelMessageAction.send(payload);
		events.onChannelMessage(payload);
	}

	function attachVoice(peerId: string, stream: MediaStream) {
		let audio = remoteAudio.get(peerId);

		if (!audio) {
			audio = new Audio();
			audio.autoplay = true;
			remoteAudio.set(peerId, audio);
		}

		audio.srcObject = stream;
	}

	function detachAllVoice() {
		for (const audio of remoteAudio.values()) {
			audio.pause();
			audio.srcObject = null;
		}
	}

	async function joinVoice() {
		if (inVoice) return;
		inVoice = true;

		let stream: MediaStream;
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
			});
		} catch (e) {
			inVoice = false;
			throw e;
		}

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!inVoice) {
			stream.getTracks().forEach((t) => t.stop());
			return;
		}

		localStream = stream;
		connection.addStream(stream);
		for (const [peerId, s] of remoteAudioStreams) attachVoice(peerId, s);
	}

	function leaveVoice() {
		inVoice = false;

		if (localStream) {
			connection.removeStream(localStream);
			localStream.getTracks().forEach((t) => t.stop());
			localStream = null;
		}

		detachAllVoice();
	}

	function leaveChannel() {
		leaveVoice();
		connection.leave();
		remoteAudioStreams.clear();
		remoteAudio.clear();
		events.onLeaveChannel();
	}

	return { sendChannelMessage, joinVoice, leaveVoice, leaveChannel };
}
