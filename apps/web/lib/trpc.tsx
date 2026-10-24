"use client";

import { type ErrorCode, errorCodes } from "@ep/core/errors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { type ReactNode, useState } from "react";
import superjson from "superjson";
import type { AppRouter } from "../server/trpc/routers/_app";
import { activeWorkspace } from "./workspace-store";

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
    },
  });
}

export function TrpcProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          headers: () => {
            const workspaceId = activeWorkspace();
            return workspaceId ? { "x-workspace-id": workspaceId } : {};
          },
        }),
      ],
    }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}

/**
 * Error code of a failed tRPC call – the text comes from de.json `errors.<CODE>`.
 * Unknown codes and transport errors (offline, timeouts) map to INTERNAL.
 */
export function errorCode(error: unknown): ErrorCode {
  if (error instanceof TRPCClientError) {
    const data = error.data as { appError?: { code: string } | null } | undefined;
    const code = data?.appError?.code ?? error.message;
    if ((errorCodes as readonly string[]).includes(code)) return code as ErrorCode;
  }
  return "INTERNAL";
}
