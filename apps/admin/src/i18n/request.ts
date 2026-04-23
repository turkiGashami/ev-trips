import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const SUPPORTED = ["ar", "en"] as const;
export type Locale = (typeof SUPPORTED)[number];
export const DEFAULT_LOCALE: Locale = "ar";

export default getRequestConfig(async () => {
  const cookie = cookies().get("admin_locale")?.value;
  const locale: Locale = (SUPPORTED as readonly string[]).includes(cookie ?? "")
    ? (cookie as Locale)
    : DEFAULT_LOCALE;
  const messages = (await import(`./messages/${locale}.json`)).default;
  return { locale, messages };
});
