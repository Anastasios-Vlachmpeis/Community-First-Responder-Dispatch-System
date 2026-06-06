const OTP_RATE_KEY = "soteria-otp-rate";
const DEMO_OTP = "123456";
const MAX_OTP_PER_PHONE = 3;
const MAX_OTP_PER_CLIENT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const VOIP_PREFIXES = ["+1800", "+1888", "+1877", "+1866", "+1855", "+1844", "+1833"];
const DISPOSABLE_PREFIXES = ["+1555010", "+1555011", "+1555012"];

type OtpRateEntry = {
	phone: string;
	at: number;
};

type OtpRateStore = {
	byPhone: Record<string, OtpRateEntry[]>;
	byClient: OtpRateEntry[];
};

const loadRateStore = (): OtpRateStore => {
	try {
		const raw = sessionStorage.getItem(OTP_RATE_KEY);
		if (!raw) return { byPhone: {}, byClient: [] };
		return JSON.parse(raw) as OtpRateStore;
	} catch {
		return { byPhone: {}, byClient: [] };
	}
};

const saveRateStore = (store: OtpRateStore) => {
	sessionStorage.setItem(OTP_RATE_KEY, JSON.stringify(store));
};

const prune = (entries: OtpRateEntry[]) =>
	entries.filter((e) => Date.now() - e.at < RATE_WINDOW_MS);

const normalizePhone = (phone: string) => phone.replace(/[\s()-]/g, "");

export const isValidPhone = (phone: string) => {
	const digits = normalizePhone(phone).replace(/\D/g, "");
	return digits.length >= 10 && digits.length <= 15;
};

const isVoipNumber = (phone: string) => {
	const normalized = normalizePhone(phone);
	return VOIP_PREFIXES.some((prefix) => normalized.startsWith(prefix));
};

const isDisposableNumber = (phone: string) => {
	const normalized = normalizePhone(phone);
	return DISPOSABLE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
};

export type SendOtpError = "rate_limited" | "voip_blocked" | "disposable_blocked" | "invalid_phone";

export type SendOtpResult =
	| { ok: true }
	| { ok: false; error: SendOtpError };

export const sendOtp = (phone: string): SendOtpResult => {
	if (!isValidPhone(phone)) return { ok: false, error: "invalid_phone" };
	if (isVoipNumber(phone)) return { ok: false, error: "voip_blocked" };
	if (isDisposableNumber(phone)) return { ok: false, error: "disposable_blocked" };

	const store = loadRateStore();
	const now = Date.now();
	const normalized = normalizePhone(phone);

	store.byPhone[normalized] = prune(store.byPhone[normalized] ?? []);
	store.byClient = prune(store.byClient);

	if (store.byPhone[normalized].length >= MAX_OTP_PER_PHONE)
		return { ok: false, error: "rate_limited" };
	if (store.byClient.length >= MAX_OTP_PER_CLIENT) return { ok: false, error: "rate_limited" };

	const entry = { phone: normalized, at: now };
	store.byPhone[normalized].push(entry);
	store.byClient.push(entry);
	saveRateStore(store);

	return { ok: true };
};

export type VerifyOtpError = "invalid_code";

export type VerifyOtpResult = { ok: true } | { ok: false; error: VerifyOtpError };

export const verifyOtp = (_phone: string, code: string): VerifyOtpResult => {
	if (code === DEMO_OTP) return { ok: true };
	return { ok: false, error: "invalid_code" };
};

export const sendOtpErrorMessage: Record<SendOtpError, string> = {
	invalid_phone: "enter a valid mobile number",
	rate_limited: "too many attempts — try again later",
	voip_blocked: "voip numbers aren't supported — use a mobile number",
	disposable_blocked: "this number can't be used — try a different one",
};
