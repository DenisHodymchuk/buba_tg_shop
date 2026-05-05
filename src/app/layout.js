import { Geist } from "next/font/google";
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
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>
      <body className={`${geist.className} min-h-full flex flex-col`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
