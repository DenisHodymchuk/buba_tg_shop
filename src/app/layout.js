import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata = {
  title: "ANDE3D STORE — Куточок 3D виробів",
  description: "Авторські 3D-друковані фігурки, декор та подарунки з доставкою по Україні та за кордон.",
  openGraph: {
    title: "ANDE3D STORE — Куточок 3D виробів",
    description: "Авторські 3D-друковані фігурки, декор та подарунки з доставкою по Україні та за кордон.",
    siteName: "ANDE3D STORE",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk" className="h-full antialiased" suppressHydrationWarning>
      <body className={`${geist.className} min-h-full flex flex-col`} suppressHydrationWarning>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
        <Script src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
