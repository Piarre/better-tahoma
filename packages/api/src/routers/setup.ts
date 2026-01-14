import { db, podsTable } from "@better-tahoma/db";
import { publicProcedure, router } from "../index";

export const setupRouter = router({
    getStatus: publicProcedure.query(() => {
        const pods = db.select().from(podsTable).all();

        if (pods.length === 0) {
            return { complete: false };
        }

        const hasSetupAny = pods.some((pod) => pod.setupComplete);

        return { complete: hasSetupAny };
    }),
});
