import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bud — Personal Budget",
  description: "Your monthly budget, in the cloud.",
};

const NO_FOUC_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem("bud-theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FOUC_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
