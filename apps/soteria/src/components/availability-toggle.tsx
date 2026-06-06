import { Clock, Power, Radio } from "lucide-react";
import { useEffect, useState } from "react";

import {
	AVAILABILITY_OPTIONS,
	availabilityProgress,
	formatAvailableUntil,
	formatRemaining,
	isAvailable,
	PROGRESS_RING_CIRCUMFERENCE,
	PROGRESS_RING_RADIUS,
	type AvailabilityDuration,
} from "~/lib/availability";

const DEFAULT_DURATION: AvailabilityDuration = "6h";
const CONFIRM_ENABLE_MS = 4000;

type AvailabilityToggleProps = {
	availableUntil: string | null;
	availableSince: string | null;
	selectedDuration: AvailabilityDuration | null;
	onEnable: (duration: AvailabilityDuration) => void;
	onDisable: () => void;
};

export const AvailabilityToggle = ({
	availableUntil,
	availableSince,
	selectedDuration,
	onEnable,
	onDisable,
}: AvailabilityToggleProps) => {
	const active = isAvailable(availableUntil);
	const [pendingDuration, setPendingDuration] = useState<AvailabilityDuration>(
		selectedDuration ?? DEFAULT_DURATION,
	);
	const [confirmEnable, setConfirmEnable] = useState(false);
	const [, setTick] = useState(0);

	useEffect(() => {
		if (active) return;
		setPendingDuration(selectedDuration ?? DEFAULT_DURATION);
		setConfirmEnable(false);
	}, [active, selectedDuration]);

	useEffect(() => {
		if (!confirmEnable) return;
		const timer = setTimeout(() => setConfirmEnable(false), CONFIRM_ENABLE_MS);
		return () => clearTimeout(timer);
	}, [confirmEnable]);

	useEffect(() => {
		if (!active || !availableUntil) return;
		const timer = setInterval(() => setTick((t) => t + 1), 1000);
		return () => clearInterval(timer);
	}, [active, availableUntil]);

	const pendingLabel =
		AVAILABILITY_OPTIONS.find((o) => o.duration === pendingDuration)?.label ?? pendingDuration;

	const handleMainButton = () => {
		if (active) {
			onDisable();
			return;
		}
		if (!confirmEnable) {
			setConfirmEnable(true);
			return;
		}
		setConfirmEnable(false);
		onEnable(pendingDuration);
	};

	const handleDuration = (duration: AvailabilityDuration) => {
		if (active) {
			onEnable(duration);
			return;
		}
		setPendingDuration(duration);
		setConfirmEnable(true);
	};

	const remaining = active && availableUntil ? formatRemaining(availableUntil) : null;
	const progress =
		active && availableSince && availableUntil
			? availabilityProgress(availableSince, availableUntil)
			: 0;
	const progressOffset = PROGRESS_RING_CIRCUMFERENCE * (1 - progress);

	const statusMessage = active
		? `Available until ${availableUntil ? formatAvailableUntil(availableUntil) : ""}${remaining ? `, ${remaining}` : ""}`
		: confirmEnable
			? `Confirm going available for ${pendingLabel}`
			: "Not available for emergencies";

	return (
		<div className="availability-card">
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				{statusMessage}
			</div>

			<p className="text-center text-2xl font-extrabold tracking-tight text-ink">
				{active ? "Ready to help" : "Not available"}
			</p>
			<p className="mt-1.5 text-center text-sm text-muted">
				{active
					? "On call — tap button to go off"
					: confirmEnable
						? `Tap the button to confirm · ${pendingLabel}`
						: "Choose a duration, then tap the button"}
			</p>

			<div className="availability-hero-wrap mx-auto mt-6">
				{active && availableSince && (
					<svg
						className="availability-progress"
						viewBox="0 0 100 100"
						aria-hidden="true"
					>
						<circle
							cx="50"
							cy="50"
							r={PROGRESS_RING_RADIUS}
							className="availability-progress-track"
						/>
						<circle
							cx="50"
							cy="50"
							r={PROGRESS_RING_RADIUS}
							className="availability-progress-fill"
							strokeDasharray={PROGRESS_RING_CIRCUMFERENCE}
							strokeDashoffset={progressOffset}
						/>
					</svg>
				)}
				<button
					type="button"
					onClick={handleMainButton}
					aria-pressed={active}
					aria-label={
						active
							? "go unavailable"
							: confirmEnable
								? `confirm go available for ${pendingLabel}`
								: `go available for ${pendingLabel}`
					}
					className={`availability-hero ${active ? "availability-hero-active" : ""} ${confirmEnable && !active ? "availability-hero-confirm" : ""}`}
				>
					<span
						className={`availability-hero-knob ${active ? "availability-hero-knob-active" : ""}`}
					>
						{active ? (
							<Radio size={32} strokeWidth={1.75} aria-hidden />
						) : (
							<Power size={32} strokeWidth={1.75} aria-hidden />
						)}
					</span>
				</button>
			</div>

			<div className="duration-pills mt-5" role="group" aria-label="availability duration">
				{AVAILABILITY_OPTIONS.map((option) => {
					const isActive = active && selectedDuration === option.duration;
					const isPending = !active && pendingDuration === option.duration;
					const pillClass = isActive
						? "duration-pill-active"
						: isPending
							? "duration-pill-pending"
							: "";
					return (
						<button
							key={option.duration}
							type="button"
							onClick={() => handleDuration(option.duration)}
							className={`duration-pill ${pillClass}`}
							aria-pressed={isActive || isPending}
							aria-label={
								active
									? `extend availability to ${option.label}`
									: `select ${option.label}`
							}
						>
							{option.label}
						</button>
					);
				})}
			</div>

			{active && availableUntil && (
				<div className="availability-meta mt-5">
					<Clock size={18} strokeWidth={1.75} className="shrink-0 text-brand" />
					<div className="min-w-0 flex-1">
						<p className="text-sm font-medium text-ink">
							Until {formatAvailableUntil(availableUntil)}
						</p>
						{remaining && (
							<p className="mt-0.5 text-sm font-bold text-active">{remaining}</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
