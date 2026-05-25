import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "QAFlow AI — AI QA Workflow & Skill Platform",
  description: "Dựng quy trình QA chuẩn hóa, thiết kế test kịch bản tự động bằng AI",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
