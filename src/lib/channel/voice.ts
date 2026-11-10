import { type joinRoom } from "@trystero-p2p/supabase";

type Room = ReturnType<typeof joinRoom>;

export type Voice = {
	isActive: () => boolean;
	join: () => Promise<boolean>;
	leave: () => void;
	handlePeerJoin: (peerId: string) => void;
	handlePeerStream: (peerId: string, stream: MediaStream) => void;
	handlePeerLeftVoice: (peerId: string) => void;
	handlePeerLeave: (peerId: string) => void;
	destroy: () => void;
};

export function createVoice(room: Room): Voice {
	let localStream: MediaStream | null = null;
	let attempt = 0;
	const remoteStreams = new Map<string, MediaStream>();
	const remoteAudio = new Map<string, HTMLAudioElement>();

	function attach(peerId: string, stream: MediaStream) {
		let audio = remoteAudio.get(peerId);

		if (!audio) {
			audio = new Audio();
			audio.autoplay = true;
			remoteAudio.set(peerId, audio);
		}

		audio.srcObject = stream;
	}

	function detach(peerId: string) {
		const audio = remoteAudio.get(peerId);
		if (!audio) return;
		audio.pause();
		audio.srcObject = null;
	}

	function isActive() {
		return localStream !== null;
	}

	async function join() {
		if (localStream) return true;
		const current = ++attempt;

		const stream = await navigator.mediaDevices.getUserMedia({
			audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
		});

		if (current !== attempt) {
			stream.getTracks().forEach((t) => t.stop());
			return false;
		}

		localStream = stream;
		room.addStream(stream);
		for (const [peerId, s] of remoteStreams) attach(peerId, s);
		return true;
	}

	function leave() {
		attempt++;

		if (localStream) {
			room.removeStream(localStream);
			localStream.getTracks().forEach((t) => t.stop());
			localStream = null;
		}

		for (const peerId of remoteAudio.keys()) detach(peerId);
	}

	function handlePeerJoin(peerId: string) {
		if (localStream) room.addStream(localStream, { target: peerId });
	}

	function handlePeerStream(peerId: string, stream: MediaStream) {
		remoteStreams.set(peerId, stream);
		if (localStream) attach(peerId, stream);
	}

	function handlePeerLeftVoice(peerId: string) {
		remoteStreams.delete(peerId);
		detach(peerId);
	}

	function handlePeerLeave(peerId: string) {
		handlePeerLeftVoice(peerId);
		remoteAudio.delete(peerId);
	}

	function destroy() {
		leave();
		remoteStreams.clear();
		remoteAudio.clear();
	}

	return { isActive, join, leave, handlePeerJoin, handlePeerStream, handlePeerLeftVoice, handlePeerLeave, destroy };
}
