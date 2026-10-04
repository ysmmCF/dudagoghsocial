import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Festa de 15 Anos da Eduarda | Mural de Memórias",
  description: "Rede social privada para convidados compartilharem fotos, legendas e curtidas na festa de 15 anos da Eduarda.",
  keywords: ["15 anos", "Eduarda", "festa de 15 anos", "mural de fotos", "Noite Estrelada", "fotos da festa"],
  openGraph: {
    title: "15 Anos da Eduarda — Mural de Fotos",
    description: "Compartilhe suas memórias da festa sob as estrelas!",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#060919",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
