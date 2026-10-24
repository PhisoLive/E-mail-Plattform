import type { ReactNode } from "react";

/** Public pages for recipients (unsubscribe, link redirect): no app shell, no tracking. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <main id="inhalt" className="flex min-h-dvh items-center justify-center px-4 py-10">
      {children}
    </main>
  );
}
