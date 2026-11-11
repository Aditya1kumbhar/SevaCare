import type { Metadata, Viewport } from 'next'
import { Roboto } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { LanguageProvider } from '@/components/LanguageProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const roboto = Roboto({ subsets: ['latin'], variable: '--font-roboto', weight: ['300', '400', '500', '700'] })

export const metadata: Metadata = {
  title: 'SevaCare - Elder Care Management',
  description: 'A comprehensive caretaker management application for old age homes. Manage residents, track health information, and provide compassionate care.',
  metadataBase: new URL('https://seva-care-db.vercel.app'),
  openGraph: {
    title: 'SevaCare - Elder Care Management',
    description: 'A comprehensive caretaker management application for old age homes. Manage residents, track health information, and provide compassionate care.',
    url: 'https://seva-care-db.vercel.app',
    siteName: 'SevaCare',
    images: [{ url: '/og-sevacare-v2.jpg', width: 1200, height: 630, alt: 'SevaCare, offline-first elderly care' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SevaCare - Elder Care Management',
    description: 'Offline-first elderly care records for old age homes: residents, health tracking and caretaker workflows that keep working without the internet.',
    images: ['/og-sevacare-v2.jpg'],
  },
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#2874f0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-flicker: set dark class BEFORE first paint */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            if (localStorage.getItem('sevacare-theme') === 'dark') {
              document.documentElement.classList.add('dark');
            }
          } catch(e) {}
        `}} />
      </head>
      <body suppressHydrationWarning className={`${roboto.variable} font-sans antialiased w-full max-w-full overflow-x-hidden`}>
        <ThemeProvider>
          <LanguageProvider>
            {children}
            <Toaster position="top-center" richColors />
          </LanguageProvider>
        </ThemeProvider>
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
