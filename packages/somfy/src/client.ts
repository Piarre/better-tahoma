import { CLIENT, URL } from "@better-tahoma/config/constants/somfy";
import { db, podsTable } from "@better-tahoma/db";
import type { Device, Room } from "@better-tahoma/types";
import { eq } from "drizzle-orm";
import type { CommandResponse, SetupResponse, TokenResponse } from "./types";

export class SomfyOverkizClient {
	private token: string | null = null;
	private refreshTokenValue: string | null = null;
	private expiresAt: Date | null = null;

	/**
	 * Authenticate with Somfy API
	 */
	async login(
		podId: string,
		username: string,
		password: string,
	): Promise<void> {
		const form = new URLSearchParams();

		form.append("grant_type", "password");
		form.append("username", username);
		form.append("password", password);
		form.append("client_id", CLIENT.id);
		form.append("client_secret", CLIENT.secret);

		const data = await this.request<TokenResponse>(
			"/oauth/oauth/v2/token/jwt",
			{
				method: "POST",
				baseUrl: URL.SOMFY_ACCOUNTS_URL,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: form.toString(),
				requireAuth: false,
			},
		);

		if (data.message === "error.invalid.grant") {
			throw new Error("Invalid credentials provided");
		}

		if (!data.access_token) {
			throw new Error("No access token received from Somfy API");
		}

		this.token = data.access_token;
		this.refreshTokenValue = data.refresh_token;
		this.expiresAt = new Date(Date.now() + (data.expires_in - 5) * 1000);

		await db
			.update(podsTable)
			.set({
				token: this.token,
				refreshToken: this.refreshTokenValue,
				expirationTime: new Date(this.expiresAt).getTime(),
			})
			.where(eq(podsTable.pin, podId));
	}

	/**
	 * Get authentication token
	 */
	getToken(): string | null {
		return this.token;
	}

	/**
	 * Get refresh token
	 */
	getRefreshToken(): string | null {
		return this.refreshTokenValue;
	}

	/**
	 * Refresh the access token
	 */
	async refreshToken(podId?: string): Promise<void> {
		if (!this.refreshTokenValue) {
			throw new Error("No refresh token available. Login first.");
		}

		const form = new URLSearchParams();

		form.append("grant_type", "refresh_token");
		form.append("refresh_token", this.refreshTokenValue);
		form.append("client_id", CLIENT.id);
		form.append("client_secret", CLIENT.secret);

		const data = await this.request<TokenResponse>(
			"/oauth/oauth/v2/token/jwt",
			{
				method: "POST",
				baseUrl: URL.SOMFY_ACCOUNTS_URL,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: form.toString(),
				requireAuth: false,
			},
		);

		if (data.message === "error.invalid.grant") {
			throw new Error("Invalid refresh token");
		}

		if (!data.access_token) {
			throw new Error("No access token received");
		}

		this.token = data.access_token;
		this.refreshTokenValue = data.refresh_token;
		this.expiresAt = new Date(Date.now() + (data.expires_in - 5) * 1000);

		// Save to DB if podId is provided
		if (podId) {
			await db
				.update(podsTable)
				.set({
					token: this.token,
					refreshToken: this.refreshTokenValue,
					expirationTime: new Date(this.expiresAt).getTime(),
				})
				.where(eq(podsTable.pin, podId));
		}
	}

	/**
	 * Restore token from database
	 */
	async restoreToken(podId: string): Promise<boolean> {
		const pods = await db
			.select()
			.from(podsTable)
			.where(eq(podsTable.pin, podId))
			.limit(1);

		if (pods.length === 0 || !pods[0]?.token || !pods[0]?.refreshToken) {
			return false;
		}

		const pod = pods[0];
		this.token = pod.token;
		this.refreshTokenValue = pod.refreshToken;
		this.expiresAt = pod.expirationTime ? new Date(pod.expirationTime) : null;

		// Auto-refresh if expired
		if (this.isTokenExpired()) {
			try {
				await this.refreshToken(podId);
				return true;
			} catch {
				return false;
			}
		}

		return true;
	}

	/**
	 * Get setup (rooms and devices)
	 */
	async getSetup(): Promise<SetupResponse> {
		return await this.request<SetupResponse>("/setup");
	}

	/**
	 * Get all rooms
	 */
	async getRooms(): Promise<Room[]> {
		this.ensureAuthenticated();
		const setup = await this.getSetup();
		return setup.rootPlace.subPlaces || [];
	}

	/**
	 * Get all devices
	 */
	async getDevices(): Promise<Device[]> {
		this.ensureAuthenticated();
		const setup = await this.getSetup();
		return setup.devices || [];
	}

	/**
	 * Get devices by room ID
	 */
	async getDevicesByRoom(roomId: string): Promise<Device[]> {
		const devices = await this.getDevices();
		return devices.filter((device) => device.placeOID === roomId);
	}

	/**
	 * Execute a command on a device
	 */
	async executeCommand(
		deviceURL: string,
		commandName: string,
		parameters?: unknown[],
	): Promise<string> {
		const data = await this.request<CommandResponse>("/exec/apply", {
			method: "POST",
			body: {
				actions: [
					{
						commands: [
							{
								name: commandName,
								parameters: parameters || [],
							},
						],
						deviceURL,
					},
				],
			},
		});

		return data.execId;
	}

	/**
	 * Open shutter
	 */
	async openShutter(deviceURL: string): Promise<string> {
		return await this.executeCommand(deviceURL, "open");
	}

	/**
	 * Close shutter
	 */
	async closeShutter(deviceURL: string): Promise<string> {
		return await this.executeCommand(deviceURL, "close");
	}

	/**
	 * Set shutter position
	 * @param deviceURL Device URL
	 * @param position Position (0-100)
	 */
	async setShutterPosition(
		deviceURL: string,
		position: number,
	): Promise<string> {
		return await this.executeCommand(deviceURL, "setClosure", [position]);
	}

	/**
	 * Stop shutter movement
	 */
	async stopShutter(deviceURL: string): Promise<string> {
		return await this.executeCommand(deviceURL, "stop");
	}

	/**
	 * Get device states
	 */
	async getDeviceStates(deviceURL: string): Promise<unknown> {
		return await this.request<unknown>(
			`/setup/devices/${encodeURIComponent(deviceURL)}/states`,
		);
	}

	/**
	 * Check if token is expired
	 */
	isTokenExpired(): boolean {
		if (!this.expiresAt) {
			return true;
		}
		return new Date() >= this.expiresAt;
	}

	/**
	 * Generic request method for API calls
	 */
	private async request<T>(
		endpoint: string,
		options?: {
			method?: "GET" | "POST" | "PUT" | "DELETE";
			body?: unknown;
			baseUrl?: string;
			headers?: Record<string, string>;
			requireAuth?: boolean;
		},
	): Promise<T> {
		const requireAuth = options?.requireAuth !== false;

		if (requireAuth) {
			await this.ensureAuthenticated();
		}

		const baseUrl = options?.baseUrl || URL.OVERKIZ_URL;
		const defaultHeaders = options?.headers || {
			"Content-Type": "application/json",
		};

		const headers: Record<string, string> = {
			...defaultHeaders,
		};

		if (requireAuth && this.token) {
			headers.Authorization = `Bearer ${this.token}`;
		}

		const response = await fetch(`${baseUrl}${endpoint}`, {
			method: options?.method || "GET",
			headers,
			body: options?.body
				? typeof options.body === "string"
					? options.body
					: JSON.stringify(options.body)
				: undefined,
		});

		if (!response.ok) {
			const text = await response.text();
			let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

			try {
				const json = JSON.parse(text);
				if (json.error) errorMessage = json.error;
				if (json.message) errorMessage = json.message;
			} catch {
				if (text) errorMessage = text;
			}

			throw new Error(errorMessage);
		}

		return (await response.json()) as T;
	}

	private async ensureAuthenticated(): Promise<void> {
		if (!this.token) {
			throw new Error("Not authenticated. Please login first.");
		}

		// Auto-refresh if token is expired
		if (this.isTokenExpired()) {
			if (!this.refreshTokenValue) {
				throw new Error(
					"Token expired and no refresh token available. Please login again.",
				);
			}

			await this.refreshToken();
		}
	}
}

export const somfyClient = new SomfyOverkizClient();
