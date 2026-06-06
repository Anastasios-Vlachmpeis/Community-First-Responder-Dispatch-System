import { Camera } from "lucide-react";
import { useRef } from "react";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png"];

type UploadZoneProps = {
	label: string;
	preview: string | null;
	onUpload: (dataUrl: string) => void;
	onError: (message: string) => void;
};

const readFile = (file: File) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(new Error("failed to read file"));
		reader.readAsDataURL(file);
	});

export const UploadZone = ({ label, preview, onUpload, onError }: UploadZoneProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFile = async (file: File | undefined) => {
		if (!file) return;
		if (!ACCEPTED.includes(file.type)) {
			onError("only photos are accepted — photograph your certificate");
			return;
		}
		if (file.size > MAX_BYTES) {
			onError("photo must be 10 MB or smaller");
			return;
		}
		try {
			onUpload(await readFile(file));
		} catch {
			onError("failed to read photo");
		}
	};

	return (
		<div className="rounded-lg bg-card p-4">
			<p className="mb-3 text-sm font-medium text-ink">{label}</p>
			{preview ? (
				<div className="flex flex-col items-center gap-3">
					<img
						src={preview}
						alt={`${label} preview`}
						className="h-40 w-full rounded-lg object-cover"
					/>
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						className="text-sm font-medium text-brand"
						aria-label={`retake photo for ${label}`}
					>
						Retake photo
					</button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-on-surface/25 bg-white transition-colors hover:border-secondary/50 hover:bg-secondary/5"
					aria-label={`photograph certificate for ${label}`}
				>
					<Camera size={28} strokeWidth={1.5} className="text-secondary" aria-hidden />
					<span className="text-sm font-medium text-on-surface">Photograph certificate</span>
					<span className="text-xs text-muted">Use your camera — no PDFs or file uploads</span>
				</button>
			)}
			<input
				ref={inputRef}
				type="file"
				accept="image/jpeg,image/png"
				capture="environment"
				className="hidden"
				onChange={(e) => {
					handleFile(e.target.files?.[0]);
					e.target.value = "";
				}}
			/>
		</div>
	);
};
