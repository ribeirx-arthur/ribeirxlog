import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
    title: "Ribeirx Log ERP | Inteligência Logística",
    description: "A inteligência definitiva para gestão de frotas e logística.",
};

const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_YmVsb3ZlZC1kb3J5LTIzLmNsZXJrLmFjY291bnRzLmRldiQ';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
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
