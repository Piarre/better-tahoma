import { protectedProcedure, publicProcedure, router } from "../index";
import { devicesRouter } from "./devices";
import { podsRouter } from "./pods";
import { roomsRouter } from "./rooms";
import { setupRouter } from "./setup";

export const appRouter = router({
    healthCheck: publicProcedure.query(() => {
        return "OK";
    }),
    privateData: protectedProcedure.query(({ ctx }) => {
        return {
            message: "This is private",
            user: ctx.session.user,
        };
    }),
    rooms: roomsRouter,
    devices: devicesRouter,
    setup: setupRouter,
    pods: podsRouter,
});
export type AppRouter = typeof appRouter;
