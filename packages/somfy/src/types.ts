import type { Device, Room } from "@better-tahoma/types";

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    message?: string;
}

interface SetupResponse {
    rootPlace: {
        subPlaces: Room[];
    };
    devices: Device[];
    id: string;
}

interface CommandResponse {
    execId: string;
}

export type { TokenResponse, SetupResponse, CommandResponse };
