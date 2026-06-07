const modules = import.meta.glob("../../pictures/*.{jpeg,jpg,png,webp}", {
	eager: true,
	query: "?url",
	import: "default",
}) as Record<string, string>;

export const ALLY_PICTURE_URLS = Object.values(modules);

if (ALLY_PICTURE_URLS.length === 0)
	throw new Error("no images found in apps/dashboard/pictures");

export const pickRandomPicture = (rng: () => number): string =>
	ALLY_PICTURE_URLS[Math.floor(rng() * ALLY_PICTURE_URLS.length)]!;
