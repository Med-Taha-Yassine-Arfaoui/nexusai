import "./globals.css";

export const metadata = {
  title: "NexusAI",
  description: "AI Research Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}