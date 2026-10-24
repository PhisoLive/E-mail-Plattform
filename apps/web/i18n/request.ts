import { getRequestConfig } from "next-intl/server";
import messages from "../messages/de.json";

/** Single locale "de" without locale routing; all UI texts come from messages/de.json. */
export default getRequestConfig(async () => ({
  locale: "de",
  messages,
  timeZone: "Europe/Berlin",
}));
