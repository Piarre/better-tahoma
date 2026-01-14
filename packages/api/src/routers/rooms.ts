import { db, devicesTable, roomsTable } from "@better-tahoma/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "..";

export const roomsRouter = router({
    getAll: publicProcedure.query(async () => {
        const rooms = await db.select().from(roomsTable);
        return rooms;
    }),

    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            const room = await db
                .select()
                .from(roomsTable)
                .where(eq(roomsTable.id, input.id))
                .limit(1);

            console.log(room);
            return room;
        }),

    getDevices: publicProcedure
        .input(z.object({ roomId: z.string() }))
        .query(async ({ input }) => {
            const devices = await db
                .select()
                .from(devicesTable)
                .where(eq(devicesTable.placeOID, input.roomId));

            return devices;
        }),
});
