import type { Station } from "~/domain/types";

export const STATIONS: Station[] = [
	{ id: "hosp-qmh", name: "Queen Mary Hospital", service: "ambulance", lat: 22.2699, lng: 114.1314 },
	{ id: "hosp-pwh", name: "Prince of Wales Hospital", service: "ambulance", lat: 22.3815, lng: 114.1953 },
	{ id: "hosp-qeh", name: "Queen Elizabeth Hospital", service: "ambulance", lat: 22.3248, lng: 114.1844 },
	{ id: "hosp-rmh", name: "Ruttonjee Hospital", service: "ambulance", lat: 22.2765, lng: 114.1782 },
	{ id: "hosp-twh", name: "Tuen Mun Hospital", service: "ambulance", lat: 22.4078, lng: 113.9765 },
	{ id: "hosp-pmh", name: "Pamela Youde Nethersole Eastern", service: "ambulance", lat: 22.2691, lng: 114.2365 },
	{ id: "pol-central", name: "Central Police Station", service: "police", lat: 22.2819, lng: 114.1553 },
	{ id: "pol-tsim", name: "Tsim Sha Tsui Police Station", service: "police", lat: 22.2974, lng: 114.1721 },
	{ id: "pol-mongkok", name: "Mong Kok Police Station", service: "police", lat: 22.3193, lng: 114.1694 },
	{ id: "pol-kwun", name: "Kwun Tong Police Station", service: "police", lat: 22.3125, lng: 114.2256 },
	{ id: "pol-shatin", name: "Sha Tin Police Station", service: "police", lat: 22.3812, lng: 114.1889 },
	{ id: "pol-tsuen", name: "Tsuen Wan Police Station", service: "police", lat: 22.3701, lng: 114.1134 },
	{ id: "fire-central", name: "Central Fire Station", service: "fire-engine", lat: 22.2812, lng: 114.1578 },
	{ id: "fire-causeway", name: "Causeway Bay Fire Station", service: "fire-engine", lat: 22.2801, lng: 114.1845 },
	{ id: "fire-kwun", name: "Kwun Tong Fire Station", service: "fire-engine", lat: 22.3102, lng: 114.2289 },
	{ id: "fire-shatin", name: "Sha Tin Fire Station", service: "fire-engine", lat: 22.3823, lng: 114.1912 },
	{ id: "fire-tsim", name: "Tsim Sha Tsui Fire Station", service: "fire-engine", lat: 22.2998, lng: 114.1701 },
	{ id: "fire-tuen", name: "Tuen Mun Fire Station", service: "fire-engine", lat: 22.3945, lng: 113.9734 },
];
