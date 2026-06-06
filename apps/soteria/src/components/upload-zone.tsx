import { useRef } from "react";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "application/pdf"];

type UploadZoneProps = {
	label: string;
	preview: string | null;
	isPdf?: boolean;
	optional?: boolean;
	onUpload: (dataUrl: string, isPdf: boolean) => void;
	onSkip?: () => void;
	onError: (message: string) => void;
};

const readFile = (file: File) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(new Error("failed to read file"));
		reader.readAsDataURL(file);
	});

export const UploadZone = ({
	label,
	preview,
	isPdf,
	optional,
	onUpload,
	onSkip,
	onError,
}: UploadZoneProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFile = async (file: File | undefined) => {
		if (!file) return;
		if (!ACCEPTED.includes(file.type)) {
			onError("only JPG, PNG, and PDF files are accepted");
			return;
		}
		if (file.size > MAX_BYTES) {
			onError("file must be 10 MB or smaller");
			return;
		}
		try {
			onUpload(await readFile(file), file.type === "application/pdf");
		} catch {
			onError("failed to read file");
		}
	};

	return (
		<div className={`rounded-2xl p-4 ${optional ? "bg-white" : "bg-card"}`}>
			<div className="mb-3 flex items-center justify-between">
				<p className={`text-sm font-medium ${optional ? "text-muted" : "text-navy"}`}>
					{optional ? "Add proof (optional)" : label}
				</p>
				{optional && !preview && onSkip && (
					<button
						type="button"
						onClick={onSkip}
						className="text-sm font-medium text-teal"
						aria-label={`skip upload for ${label}`}
					>
						Skip for now
					</button>
				)}
			</div>
			{preview ? (
				<div className="flex flex-col items-center gap-3">
					{isPdf ? (
						<div
							role="img"
							className="flex h-32 w-full items-center justify-center rounded-xl bg-card text-muted"
							aria-label="pdf document uploaded"
						>
							<span className="text-4xl" aria-hidden="true">
								📄
							</span>
						</div>
					) : (
						<img
							src={preview}
							alt={`${label} preview`}
							className="h-32 w-full rounded-xl object-cover"
						/>
					)}
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						className="text-sm font-medium text-teal"
						aria-label={`replace ${label}`}
					>
						Replace file
					</button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					className={`flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-white transition-colors ${
						optional
							? "border-navy/15 text-muted hover:border-teal/40 hover:bg-teal/5"
							: "border-teal/40 hover:border-teal hover:bg-teal/5"
					}`}
					aria-label={`upload ${label}`}
				>
					<span className="text-2xl" aria-hidden="true">
						📎
					</span>
					<span className="text-sm">tap to upload or take a photo</span>
				</button>
			)}
			<input
				ref={inputRef}
				type="file"
				accept="image/jpeg,image/png,application/pdf"
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
