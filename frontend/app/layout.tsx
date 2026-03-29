import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Inter, Space_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  weight: ['400', '700'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Galaxy Messages',
  description: 'Every anonymous message becomes a living celestial body in a shared galaxy.',
};

export const viewport: Viewport = {
  themeColor: '#00000f',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${spaceMono.variable} ${inter.variable} bg-void font-body text-star antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

