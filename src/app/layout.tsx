
import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Provider from "@/components/Provider";
import "react-loading-skeleton/dist/skeleton.css";
import { Toaster } from "@/components/ui/toaster";


const IBMPlex = IBM_Plex_Sans({ subsets: ["latin"], weight: ['400', '500', '600', '700'], variable: '--font-ibm-plex'});

export const metadata: Metadata = {
  title: "SAAS Starter",
  description: "SAAS Starter AI powered",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    
    <html lang="en">
      <Provider>
      <body className={cn("min-h-screen bg-background font-IBMPlex antialiased", IBMPlex.variable)}>
        <Toaster />
        <Navbar />
        {children}
      </body>
      </Provider>
      

    </html>
  );
}
