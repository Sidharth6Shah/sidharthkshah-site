import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Header } from './header'
import { Footer } from './footer'
import { ThemeProvider } from 'next-themes'
import { Analytics } from '@vercel/analytics/next'
import { WEBSITE_URL } from '@/lib/constants'
import { getContent } from '@/lib/content'
import { BindingField } from './components/binding-field'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf8f9' },
    { media: '(prefers-color-scheme: dark)', color: '#14112a' },
  ],
}

const content = getContent()

export const metadata: Metadata = {
  metadataBase: new URL(WEBSITE_URL),
  alternates: {
    canonical: '/',
  },
  title: {
    default: content.person.site_title,
    template: `%s | ${content.person.name}`,
  },
  description: content.person.site_description,
  openGraph: {
    title: content.person.site_title,
    description: content.person.site_description,
    url: WEBSITE_URL,
    siteName: content.person.name,
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
          <BindingField />
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
