import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Header } from './header'
import { Footer } from './footer'
import { ThemeProvider } from 'next-themes'
import { Analytics } from '@vercel/analytics/next'
import { WEBSITE_URL } from '@/lib/constants'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf8f9' },
    { media: '(prefers-color-scheme: dark)', color: '#14112a' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(WEBSITE_URL),
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'Sidharth Shah',
    template: '%s | Sidharth Shah',
  },
  description:
    'Sidharth Shah builds machine learning for drug discovery and computational biology. Biomedical engineering at the University of Waterloo.',
  openGraph: {
    title: 'Sidharth Shah',
    description:
      'Machine learning for molecules and genomes. Biomedical engineering at the University of Waterloo.',
    url: WEBSITE_URL,
    siteName: 'Sidharth Shah',
    type: 'website',
  },
}

// Self-hosted variable font (weight 200–800, width 75–100%)
const bricolage = localFont({
  src: '../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2',
  variable: '--font-bricolage',
  weight: '200 800',
  style: 'normal',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '75% 100%' }],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bricolage.variable} bg-ground font-sans text-ink antialiased`}
      >
        <ThemeProvider
          enableSystem={true}
          attribute="class"
          storageKey="theme"
          defaultTheme="system"
          disableTransitionOnChange
        >
          <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 sm:px-8">
            <Header />
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
