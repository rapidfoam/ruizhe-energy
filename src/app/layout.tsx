import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "睿筑·建筑评估 - 免费国标对标评估工具",
  description: "依据GB 55015-2021和GB 50118-2010，3分钟免费评估建筑节能和隔音水平，A级可申请官方认证",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#0f172a] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
