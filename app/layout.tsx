import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/provider";
import { Providers } from "@/app/providers";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import '@/styles/rst-tailwind-theme.css';


export const metadata: Metadata = {
  title: "BookEditor - Publish Your books",
  description:
    "Publish your books with BookEditor.",
  openGraph: {
    title: "BookEditor - Publish Your books",
    description:
      "Publish your books with BookEditor.",
    url: "bookeditor.xyz",
    siteName: "BookEditor - Publish Your books",
    images: [
      {
        url: "https://jdj14ctwppwprnqu.public.blob.vercel-storage.com/nsk-w9fFwBBmLDLxrB896I4xqngTUEEovS.png",
        width: 1200,
        height: 630,
        alt: "BookEditor - Publish Your books",
      },
    ],
    locale: "en-US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers>
            {children}
            <Toaster />
            <Analytics />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
