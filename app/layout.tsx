import Sidebar from "./components/sidebar";
import Header from "./components/header";
import Player from "./components/player";
import ThemeProvider from "./components/ThemeProvider";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-black text-white antialiased overflow-hidden`}
      >
        <ThemeProvider>
          <div className="flex h-screen w-full">

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex flex-col flex-1 min-w-0">

              {/* Header */}
              <Header />

              {/* Scrollable Content */}
              <main
                className="
                  flex-1
                  overflow-y-auto
                  pt-16
                  pb-28
                  px-4
                  sm:px-5
                  md:px-6
                  lg:px-8
                "
              >
                {children}
              </main>

            </div>

          </div>

          {/* Music Player */}
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <Player />
          </div>

        </ThemeProvider>
      </body>
    </html>
  );
}