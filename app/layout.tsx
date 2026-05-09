import type { Metadata } from "next";
import "./globals.css";
import { BackgroundScene } from "@/src/components/background-scene";

export const metadata: Metadata = {
  title: "Emodiary | 绪语",
  description: "AI-powered emotion diary with mock analysis.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <BackgroundScene />
        <div className="content-layer">
          {children}
        </div>
      </body>
    </html>
  );
}
