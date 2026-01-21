import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PID 밸브 뷰어",
  description: "배관계장도 밸브 검색 및 조회 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className="bg-background-dark text-white">
        {children}
      </body>
    </html>
  );
}
