interface Device {
	label: string;
	lastUpdateTime: number;
	/** Device URL starting with io:// */
	deviceURL: string;
	available: boolean;
	enabled: boolean;
	/** Room ID in the App */
	placeOID: string;
	type: number;
}

export type { Device };
