export interface ShellWorkspace {
  id: string;
  name: string;
  role: "owner" | "admin" | "member" | "viewer";
}

export interface ShellUser {
  name: string;
  email: string;
  isPlatformAdmin: boolean;
}

export interface ShellAgent {
  id: string;
  name: string;
  conversations: Array<{ id: string; title: string }>;
}

/** Cookie with the sidebar state, read on the server so the first render is right. */
export const sidebarCookie = "ep_sidebar";
