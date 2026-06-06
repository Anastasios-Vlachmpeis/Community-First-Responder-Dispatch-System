import { useCallback, useEffect, useRef, useState } from "react";

type GuideShape = "oval" | "card";

type CameraCaptureProps = {
	guideShape: GuideShape;
	onCapture: (dataUrl: string) => void;
	description: string;
	facingMode?: "user" | "environment";
};

type Phase = "live" | "preview";

const guideClass: Record<GuideShape, string> = {
	oval: "h-[55%] w-[70%] rounded-[50%] border-2 border-white/80",
	card: "aspect-[1.586/1] w-[85%] rounded-xl border-2 border-white/80",
};

export const CameraCapture = ({
	guideShape,
	onCapture,
	description,
	facingMode = "user",
}: CameraCaptureProps) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [phase, setPhase] = useState<Phase>("live");
	const [preview, setPreview] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const stopStream = useCallback(() => {
		if (!streamRef.current) return;
		for (const track of streamRef.current.getTracks()) track.stop();
		streamRef.current = null;
	}, []);

	const startCamera = useCallback(async () => {
		setLoading(true);
		setError(null);
		stopStream();
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode,
					width: { ideal: 1280 },
					height: { ideal: 720 },
				},
				audio: false,
			});
			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play();
			}
		} catch {
			setError(
				"camera access was denied. enable camera permissions in your browser settings, then reload this page",
			);
		} finally {
			setLoading(false);
		}
	}, [facingMode, stopStream]);

	useEffect(() => {
		startCamera();
		return stopStream;
	}, [startCamera, stopStream]);

	const capture = () => {
		const video = videoRef.current;
		if (!video) return;
		const canvas = document.createElement("canvas");
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.drawImage(video, 0, 0);
		const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
		setPreview(dataUrl);
		setPhase("preview");
		stopStream();
	};

	const retake = () => {
		setPreview(null);
		setPhase("live");
		startCamera();
	};

	const confirm = () => {
		if (!preview) return;
		onCapture(preview);
	};

	if (error)
		return (
			<div className="rounded-2xl bg-card p-6 text-center">
				<p className="mb-2 text-4xl" aria-hidden="true">
					📷
				</p>
				<p className="mb-4 text-sm leading-relaxed text-navy">{error}</p>
				<button
					type="button"
					onClick={startCamera}
					className="min-h-14 w-full rounded-2xl bg-teal font-semibold text-white"
					aria-label="retry camera access"
				>
					Try again
				</button>
			</div>
		);

	return (
		<div className="flex flex-col gap-4">
			<div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-navy">
				{phase === "live" ? (
					<>
						<div className="h-full w-full" role="img" aria-label={description}>
							<video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
						</div>
						<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
							<div className={guideClass[guideShape]} />
						</div>
						{loading && (
							<div className="absolute inset-0 flex items-center justify-center bg-navy/60 text-white">
								Starting camera…
							</div>
						)}
					</>
				) : (
					<img src={preview ?? ""} alt="captured preview" className="h-full w-full object-cover" />
				)}
			</div>

			{phase === "live" ? (
				<button
					type="button"
					onClick={capture}
					disabled={loading}
					className="min-h-14 w-full rounded-2xl bg-teal font-semibold text-white transition-opacity disabled:opacity-50"
					aria-label="capture photo"
				>
					Capture
				</button>
			) : (
				<div className="flex flex-col gap-3">
					<button
						type="button"
						onClick={retake}
						className="min-h-14 w-full rounded-2xl border-2 border-navy/10 bg-white font-semibold text-navy"
						aria-label="retake photo"
					>
						Retake
					</button>
					<button
						type="button"
						onClick={confirm}
						className="min-h-14 w-full rounded-2xl bg-teal font-semibold text-white"
						aria-label="confirm photo"
					>
						Looks good →
					</button>
				</div>
			)}
		</div>
	);
};
