const RMS_THRESHOLD = 0.02;
const HOLD_MS = 300;
const POLL_MS = 100;

type Monitor = {
	source: MediaStreamAudioSourceNode;
	analyser: AnalyserNode;
	buffer: Float32Array<ArrayBuffer>;
	speaking: boolean;
	lastLoudAt: number;
};

export type SpeakingDetector = {
	// must first be called from a user gesture so the AudioContext is allowed to start
	ensureContext: () => void;
	monitor: (id: string, stream: MediaStream) => void;
	unmonitor: (id: string) => void;
	destroy: () => void;
};

export function createSpeakingDetector(onChange: (id: string, speaking: boolean) => void): SpeakingDetector {
	let context: AudioContext | null = null;
	let pollTimer: ReturnType<typeof setInterval> | null = null;
	const monitors = new Map<string, Monitor>();

	function ensureContext() {
		context ??= new AudioContext();
		if (context.state === "suspended") context.resume().catch(() => {});
	}

	function poll() {
		const now = performance.now();

		for (const [id, m] of monitors) {
			m.analyser.getFloatTimeDomainData(m.buffer);
			let sum = 0;
			for (const v of m.buffer) sum += v * v;
			if (Math.sqrt(sum / m.buffer.length) > RMS_THRESHOLD) m.lastLoudAt = now;

			const speaking = now - m.lastLoudAt < HOLD_MS;
			if (speaking !== m.speaking) {
				m.speaking = speaking;
				onChange(id, speaking);
			}
		}
	}

	function monitor(id: string, stream: MediaStream) {
		unmonitor(id);
		if (stream.getAudioTracks().length === 0) return;

		ensureContext();
		if (!context) return;

		const source = context.createMediaStreamSource(stream);
		const analyser = context.createAnalyser();
		analyser.fftSize = 512;
		source.connect(analyser);

		monitors.set(id, {
			source,
			analyser,
			buffer: new Float32Array(analyser.fftSize),
			speaking: false,
			lastLoudAt: -Infinity,
		});
		pollTimer ??= setInterval(poll, POLL_MS);
	}

	function unmonitor(id: string) {
		const m = monitors.get(id);
		if (!m) return;

		m.source.disconnect();
		monitors.delete(id);
		if (m.speaking) onChange(id, false);

		if (monitors.size === 0 && pollTimer !== null) {
			clearInterval(pollTimer);
			pollTimer = null;
		}
	}

	function destroy() {
		for (const id of [...monitors.keys()]) unmonitor(id);
		context?.close().catch(() => {});
		context = null;
	}

	return { ensureContext, monitor, unmonitor, destroy };
}
