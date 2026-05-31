import Sidebar from "./components/sidebar";
import Header from "./components/header";
import Player from "./components/player";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white flex h-screen w-screen overflow-hidden antialiased`}>
        {/* Sidebar: Handles its own responsive visibility (fixed on mobile, static on desktop) */}
        <Sidebar />

        {/* Dynamic viewport layout wrapper that subtracts space for the fixed player */}
        <div className="flex-1 flex flex-col relative min-w-0 h-full pb-[96px] md:pb-[112px]">
          
          {/* Header: Hide on mobile if your Sidebar already provides a Mobile Header */}
          <div className="hidden lg:block sticky top-0 z-40 flex-shrink-0">
            <Header />
          </div>

          {/* MAIN CONTENT 
            Changed from flex-1 overflow-y-auto to allow sub-views (like layouts with a side chat 
            or overlays) to fully handle their own internal container heights seamlessly.
          */}
          <main className="flex-1 w-full relative mt-16 lg:mt-0 overflow-y-auto px-4 md:px-8 py-6">
            {children}
          </main>

          {/* PLAYER: Fixed at the absolute viewport bottom */}
          <div className="fixed bottom-0 left-0 right-0 z-[100] h-[96px] md:h-[112px] bg-black border-t border-neutral-900">
            <Player />
          </div>
        </div>
      </body>
    </html>
  );
}