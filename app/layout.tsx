import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
    themeColor: "#10b981",
    width: "device-width",
    initialScale: 1,
};

export const metadata: Metadata = {
    title: "Ribeirx Log ERP | Inteligência Logística",
    description: "A inteligência definitiva para gestão de frotas e logística. Calcule fretes e aumente sua margem de lucro com Inteligência Artificial.",
    manifest: "/manifest.json",
    openGraph: {
        title: "Ribeirx Log ERP | Inteligência Logística",
        description: "Assuma o controle total da sua frota com o app que organiza suas finanças e roteiros, tudo pelo Zap e direto na tela do celular.",
        url: "https://www.ribeirxlog.com.br",
        siteName: "Ribeirx Log",
        images: [
            {
                url: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200&h=630&auto=format&fit=crop",
                width: 1200,
                height: 630,
                alt: "Ribeirx Log ERP Thumbnail",
            }
        ],
        locale: "pt_BR",
        type: "website",
    }
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const clerkKey = "pk_test_YmVsb3ZlZC1kb3J5LTIzLmNsZXJrLmFjY291bnRzLmRldiQ";

    return (
        <ClerkProvider publishableKey={clerkKey}>
            <html lang="pt-BR" className={inter.className}>
                <head>
                    <meta charSet="utf-8" />
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" async></script>
                </head>
                <body className="antialiased">
                    {children}
                    <Analytics />
                    <SpeedInsights />
                </body>
            </html>
        </ClerkProvider>
    );
}
