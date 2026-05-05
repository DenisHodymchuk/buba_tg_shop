import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata = {
  title: "3D Магазин Іграшок",
  description: "Преміальні 3D іграшки в Telegram",
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk" className="h-full antialiased" suppressHydrationWarning>
      <body className={`${geist.className} min-h-full flex flex-col`} suppressHydrationWarning>
        {children}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <Script src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js" type="module" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
