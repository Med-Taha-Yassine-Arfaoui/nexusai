import "./globals.css";
import "../styles/template.css";
import { headers } from "next/headers";

const detectLang = async () => {
  const headersObj = await headers();
  const acceptLanguage = headersObj.get?.("accept-language") ?? "";
  const primaryLocale = acceptLanguage.split(",")[0]?.split(";")[0]?.trim();
  if (!primaryLocale) return "en";
  return primaryLocale.split("-")[0] ?? "en";
};

export const metadata = {
  title: "NexusAI",
  description: "AI Research Platform",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await detectLang();

  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}