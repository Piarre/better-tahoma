interface Root {
    subPlaces: Room[];
}

/**
 * Also know as "subPlace" in the JSON's Somfy API
 */
interface Room {
    id?: string;
    label: string;
    lastUpdateTime: number;
    type: number;
    /** Stringified JSON */
    metadata: string;
    /** Room ID in the App */
    oid: string;
}

export type { Root, Room };
