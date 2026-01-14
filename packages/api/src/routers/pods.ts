import { db, podsTable } from "@better-tahoma/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "..";

export const podsRouter = router({
    getAll: publicProcedure.query(async () => {
        const pods = await db.select().from(podsTable);
        return pods;
    }),

    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            const pod = await db
                .select()
                .from(podsTable)
                .where(eq(podsTable.id, input.id))
                .limit(1);

            if (pod.length === 0) {
                throw new Error("Pod not found");
            }

            return pod[0];
        }),
});
