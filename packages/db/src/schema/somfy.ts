import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v7 } from "uuid";

export const podsTable = sqliteTable("pods", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => v7()),
	name: text("name", { length: 255 }).notNull(),
	host: text("host", { length: 255 }).notNull(),
	pin: text("pin", { length: 255 }).notNull().unique(),
	txt: text("txt", { length: 1024 }).notNull(),
	token: text("token", { length: 1024 }),
	refreshToken: text("refresh_token", { length: 1024 }),
	expirationTime: integer("expiration_time", { mode: "number" }),
	setupComplete: integer("setup_complete", { mode: "boolean" })
		.notNull()
		.default(false),
});

export const roomsTable = sqliteTable("rooms", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => v7()),
	lastUpdateTime: integer("last_update_time", { mode: "number" }),
	label: text("label", { length: 255 }).notNull(),
	type: integer("type"),
	metadata: text("metadata", { length: 2048 }),
	oid: text("oid").notNull().unique(),
});

export const devicesTable = sqliteTable("devices", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => v7()),
	label: text("label", { length: 255 }).notNull(),
	lastUpdateTime: integer("last_update_time", { mode: "number" }),
	available: integer("available", { mode: "boolean" }).notNull().default(true),
	enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
	type: integer("type"),
	deviceURL: text("device_url", { length: 255 }).notNull().unique(),
	placeOID: text("place_oid").references(() => roomsTable.id),
	podId: text("pod_id").references(() => podsTable.id),
});
