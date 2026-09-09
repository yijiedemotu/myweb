import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import HeaderNav from "@/components/HeaderNav";
import HeaderRight from "@/components/HeaderRight";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "我的作品与文章",
  description: "展示个人项目与博客文章的个人网站",
  alternates: {
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // 下面的预渲染脚本会在 React 水合前给 <html> 加 dark/light 类，
      // 必然导致服务端/客户端 className 不一致，因此这里显式忽略该差异，
      // 避免 hydration 报错影响后续交互（否则“保存”等表单可能不触发）。
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Apply theme before first paint to avoid a flash. Resolves stored
            preference, otherwise the OS scheme, and keeps following OS changes
            until the user explicitly toggles. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var K='theme',r=document.documentElement;try{var s=localStorage.getItem(K);var mq=window.matchMedia('(prefers-color-scheme: dark)');function apply(f){var dark=s==='dark'?true:s==='light'?false:(f!=null?f:!!mq.matches);r.classList.toggle('dark',dark);r.classList.toggle('light',!dark);}apply();if(!s&&mq.addEventListener){mq.addEventListener('change',function(e){if(!localStorage.getItem(K))apply(e.matches);});}}catch(e){}})();`,
          }}
        />
        <header className="border-b border-black/10 dark:border-white/10 sticky top-0 bg-[var(--background)]/85 backdrop-blur z-20">
          <div className="max-w-5xl mx-auto px-6 h-14 grid grid-cols-[1fr_auto_1fr] items-center">
            <Link href="/" className="flex items-center justify-self-start">
              <Image
                src="/logo.jpg"
                alt="网站 Logo"
                width={240}
                height={143}
                priority
                className="h-10 w-auto"
              />
            </Link>
            <nav className="flex items-center gap-6 text-base justify-self-center">
              <HeaderNav />
            </nav>
            <div className="justify-self-end">
              <HeaderRight />
            </div>
          </div>
        </header>
        <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-6 pb-14">
          {children}
        </main>
        <footer className="border-t border-black/10 dark:border-white/10">
          <div className="max-w-5xl mx-auto px-6 py-6 text-center text-sm opacity-50">
            © {new Date().getFullYear()} · 个人作品与文章
          </div>
        </footer>
      </body>
    </html>
  );
}
