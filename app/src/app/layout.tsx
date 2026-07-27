import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Türkiye Sokakları — Küçük Kâşifler, Koca Türkiye',
  description:
    'Türkiye’nin illerini kısa, keşif odaklı 3B sokaklarda gezen çocuk dostu öğrenme deneyimi.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#16324F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
