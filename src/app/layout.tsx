import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import AppLayout from "@/components/AppLayout";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";
import { getServerSession } from "next-auth";

// Import the options directly with a relative path
import { options } from "../app/api/auth/[...nextauth]/options";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GIS Ticket Management App",
  description: "A modern ticket management application",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(options);
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <ToastProvider>
            <AppLayout>{children}</AppLayout>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
