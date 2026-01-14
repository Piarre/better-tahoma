import { db, devicesTable } from "@better-tahoma/db";
import { somfyClient } from "@better-tahoma/somfy";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "../index";

export const devicesRouter = router({
    getAll: publicProcedure.query(async () => {
        const devices = await db.select().from(devicesTable);
        return devices;
    }),

    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            const device = await db
                .select()
                .from(devicesTable)
                .where(eq(devicesTable.id, input.id))
                .limit(1);

            if (device.length === 0) {
                throw new Error("Device not found");
            }

            return device[0];
        }),

    open: publicProcedure
        .input(z.object({ deviceURL: z.string() }))
        .mutation(async ({ input }) => {
            const device = await db
                .select()
                .from(devicesTable)
                .where(eq(devicesTable.deviceURL, input.deviceURL))
                .limit(1);

            if (!device || device.length === 0) {
                throw new Error("Device not found");
            }

            await somfyClient.restoreToken(device[0]?.podId!);

            return await somfyClient.openShutter(
                decodeURIComponent(device[0]?.deviceURL!)
            );
        }),
    close: publicProcedure
        .input(z.object({ deviceURL: z.string() }))
        .mutation(async ({ input }) => {
            const device = await db
                .select()
                .from(devicesTable)
                .where(eq(devicesTable.deviceURL, input.deviceURL))
                .limit(1);

            if (device.length === 0) {
                throw new Error("Device not found");
            }

            await somfyClient.restoreToken(device[0]?.podId!);

            return await somfyClient.closeShutter(
                decodeURIComponent(device[0]?.deviceURL!)
            );
        }),
    stop: publicProcedure
        .input(z.object({ deviceURL: z.string() }))
        .mutation(async ({ input }) => {
            const device = await db
                .select()
                .from(devicesTable)
                .where(eq(devicesTable.deviceURL, input.deviceURL))
                .limit(1);

            if (device.length === 0) {
                throw new Error("Device not found");
            }

            await somfyClient.restoreToken(device[0]?.podId!);

            return await somfyClient.stopShutter(
                decodeURIComponent(device[0]?.deviceURL!)
            );
        }),
    setPosition: publicProcedure
        .input(z.object({ deviceURL: z.string(), position: z.number().min(0).max(100) }))
        .mutation(async ({ input }) => {
            const device = await db
                .select()
                .from(devicesTable)
                .where(eq(devicesTable.deviceURL, input.deviceURL))
                .limit(1);

            if (device.length === 0) {
                throw new Error("Device not found");
            }

            await somfyClient.restoreToken(device[0]?.podId!);

            return await somfyClient.setShutterPosition(
                decodeURIComponent(device[0]?.deviceURL!),
                input.position
            );
        }),
    // myPosition: publicProcedure
    //     .input(z.object({ deviceURL: z.string() }))
    //     .mutation(async ({ input }) => {
    //         const device = await db
    //             .select()
    //             .from(devicesTable)
    //             .where(eq(devicesTable.id, input.id))
    //             .limit(1);

    //         if (device.length === 0) {
    //             throw new Error("Device not found");
    //         }

    //         await somfyClient.restoreToken(device[0]?.podId!);

    //         return await somfyClient.openShutter(device[0]?.deviceURL!);
    //     }),
});
