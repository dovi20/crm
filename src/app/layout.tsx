import type { Metadata, Viewport } from "next";
import ThemeRegistry from "../theme/ThemeRegistry";
import theme from "../theme";
import "./globals.css";
import { Heebo } from "next/font/google";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "מערכת ניהול מלאי - ריווחית",
  description: "מערכת ניהול מלאי והזמנות - ריווחית",
};

export const viewport: Viewport = {
  themeColor: theme.palette.primary.main,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={heebo.className}>
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
