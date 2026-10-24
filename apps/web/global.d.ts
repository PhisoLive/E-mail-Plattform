import type messages from "./messages/de.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: "de";
    Messages: typeof messages;
  }
}
