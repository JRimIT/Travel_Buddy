import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '../components/ui/toaster'
import { ThemeProvider } from '../components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Travel Buddy Admin',
  description: 'Admin panel for Travel Buddy application',
  generator: 'Next.js',
  icons: {
    icon: '/travelbuddy.png', 
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
