import { type joinRoom } from "@trystero-p2p/supabase";
import { createSpeakingDetector } from "#/lib/channel/speaking.ts";

type Room = ReturnType<typeof joinRoom>;

export type Voice = {
	isActive: () => boolean;
	isMuted: () => boolean;
	// persists across leave/join, like a mute toggle in most voice apps
	setMuted: (muted: boolean) => void;
	join: () => Promise<boolean>;
	leave: () => void;
	handlePeerJoin: (peerId: string) => void;
	handlePeerStream: (peerId: string, stream: MediaStream) => void;
	handlePeerLeftVoice: (peerId: string) => void;
	handlePeerLeave: (peerId: string) => void;
	destroy: () => void;
};

export type CreateVoiceOptions = {
	selfId: string;
	onSpeakingChange: (id: string, speaking: boolean) => void;
};

export function createVoice(room: Room, { selfId, onSpeakingChange }: CreateVoiceOptions): Voice {
	let localStream: MediaStream | null = null;
	let attempt = 0;
	let muted = false;
	const remoteStreams = new Map<string, MediaStream>();
	const remoteAudio = new Map<string, HTMLAudioElement>();
	const speaking = createSpeakingDetector(onSpeakingChange);

	function attach(peerId: string, stream: MediaStream) {
		let audio = remoteAudio.get(peerId);

		if (!audio) {
			audio = new Audio();
			audio.autoplay = true;
			remoteAudio.set(peerId, audio);
		}

		audio.srcObject = stream;
		speaking.monitor(peerId, stream);
	}

	function detach(peerId: string) {
		speaking.unmonitor(peerId);
		const audio = remoteAudio.get(peerId);
		if (!audio) return;
		audio.pause();
		audio.srcObject = null;
	}

	function isActive() {
		return localStream !== null;
	}

	function isMuted() {
		return muted;
	}

	function setMuted(next: boolean) {
		muted = next;
		localStream?.getAudioTracks().forEach((t) => (t.enabled = !muted));
	}

	async function join() {
		if (localStream) return true;
		const current = ++attempt;
		speaking.ensureContext();

		const stream = await navigator.mediaDevices.getUserMedia({
			audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
		});

		if (current !== attempt) {
			stream.getTracks().forEach((t) => t.stop());
			return false;
		}

		localStream = stream;
		setMuted(muted);
		room.addStream(stream);
		speaking.monitor(selfId, stream);
		for (const [peerId, s] of remoteStreams) attach(peerId, s);
		return true;
	}

	function leave() {
		attempt++;
		speaking.unmonitor(selfId);

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
		speaking.destroy();
		remoteStreams.clear();
		remoteAudio.clear();
	}

	return { isActive, isMuted, setMuted, join, leave, handlePeerJoin, handlePeerStream, handlePeerLeftVoice, handlePeerLeave, destroy };
}
