import { createServer } from "node:net";

/** Resolves true if nothing listens on 127.0.0.1:<port> (and the port is bindable). */
export function isPortFree(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, host);
  });
}

export async function assertPortsFree(ports: Record<string, number>): Promise<void> {
  const busy: string[] = [];
  for (const [name, port] of Object.entries(ports)) {
    if (!(await isPortFree(port))) busy.push(`${name}=${port}`);
  }
  if (busy.length > 0) {
    throw new Error(
      `Ports already in use: ${busy.join(", ")}. Another project may use them – choose free ports via the *_PORT variables.`,
    );
  }
}
