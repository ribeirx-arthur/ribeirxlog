import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
    title: "Ribeirx Log ERP | Inteligência Logística",
    description: "A inteligência definitiva para gestão de frotas e logística. Calcule fretes e aumente sua margem de lucro com Inteligência Artificial.",
    themeColor: "#10b981",
    manifest: "/manifest.json",
    openGraph: {
        title: "Ribeirx Log ERP | Inteligência Logística",
        description: "Assuma o controle total da sua frota com o app que organiza suas finanças e roteiros, tudo pelo Zap e direto na tela do celular.",
        url: "https://www.ribeirxlog.com.br",
        siteName: "Ribeirx Log",
        images: [
            {
                url: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200&h=630&auto=format&fit=crop", // Great generic truck tech image for OG
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
    return (
        <ClerkProvider>
            <html lang="pt-BR">
                <head>
                    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" async></script>
                </head>
                <body className="antialiased">
                    {children}
                </body>
            </html>
        </ClerkProvider>
    );
}
