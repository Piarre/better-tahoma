import { useQuery, type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, HeadContent, Outlet, redirect, useMatches } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Home } from "lucide-react";
import { motion } from "motion/react";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { type trpc, trpcClient } from "@/utils/trpc";
import "../index.css";

export interface RouterAppContext {
  trpc: typeof trpc;
  queryClient: QueryClient;
  title: string;
  description?: string;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  beforeLoad: async ({ location }) => {
    const setupStatus = await trpcClient.setup.getStatus.query();

    if (location.pathname == "/home/setup") {
      if (setupStatus.complete) {
        throw redirect({
          to: "/home",
        });
      } else {
        return;
      }
    }

    if (!setupStatus.complete) {
      throw redirect({
        to: "/home/setup",
      });
    } else {
      return;
    }
  },
  head: () => ({
    meta: [
      {
        title: "Local Tahoma",
      },
      {
        name: "description",
        content: "local-tahoma is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
    ],
  }),
});

function RootComponent() {
  const matches = useMatches();
  const currentRoute = matches[matches.length - 1];
  const title = currentRoute?.context?.title || "Local Tahoma";
  const description = currentRoute?.context?.description;

  const { data: rooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => trpcClient.rooms.getAll.query(),
  });

  const navLinks =
    rooms && rooms.length > 0
      ? [
          {
            label: "Rooms",
            type: "menu" as const,
            items: rooms.map((room) => ({
              title: room.label,
              href: `/home/room/${room.id}`,
              description: `Gérer les devices de ${room.label}`,
              icon: <Home className="size-4" />,
            })),
          },
        ]
      : [];

  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange storageKey="vite-ui-theme">
        <HeadContent />
        <SidebarProvider>
          {/* <Sidebar>
            <SidebarHeader />
            <SidebarContent>
              <SidebarGroup />
              <SidebarGroup />
            </SidebarContent>
            <SidebarFooter />
          </Sidebar> */}
          <main className="grid h-svh grid-rows-[auto_1fr] w-full">
            <div className="flex items-center gap-2 border-b px-4 py-2">
              <SidebarTrigger />
            </div>
            <Header />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-3xl font-bold mb-2">{title}</h1>
              {description && <p className="text-muted-foreground mb-8">{description}</p>}
            </motion.div>

            <Outlet />
          </main>
        </SidebarProvider>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </>
  );
}
