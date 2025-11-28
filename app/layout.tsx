import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth"
import { SWRProvider } from "@/lib/providers/swr-provider"
import { WebVitalsReporter } from "@/components/performance/web-vitals-reporter"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Unigram",
  description: "Community platform for TUM Heilbronn Campus students",
  icons: {
    icon: [
      { url: '/browsericon.svg', type: 'image/svg+xml' },
      { url: '/logo.svg', type: 'image/svg+xml' }
    ],
    apple: '/browsericon.svg'
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SWRProvider>
          <AuthProvider>
            <WebVitalsReporter />
            {children}
          </AuthProvider>
        </SWRProvider>
      </body>
    </html>
  )
}
