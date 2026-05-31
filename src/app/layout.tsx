import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bharat Benefits Navigator — AI-Powered Government Scheme Discovery',
  description: 'Discover every government scheme, scholarship, subsidy, and welfare benefit you qualify for. Powered by AI and Coral cross-source SQL.',
  keywords: 'government schemes, scholarships, India, benefits, eligibility, welfare, subsidy',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
