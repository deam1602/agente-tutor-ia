import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agente Tutor IA | Pensamiento Computacional",
  description: "Asistente inteligente y tutor virtual para el aprendizaje académico interactivo mediante texto y voz.",
  keywords: ["Tutor IA", "Pensamiento Computacional", "Educación", "Inteligencia Artificial"],
  authors: [{ name: "Equipo de Proyecto" }],
  openGraph: {
    title: "Agente Tutor IA | Aprendizaje Interactivo",
    description: "Tutor virtual impulsado por IA para explicar conceptos y apoyar el estudio de Pensamiento Computacional.",
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
