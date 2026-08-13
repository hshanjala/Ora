import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Anek_Bangla } from 'next/font/google'
import './styles/tokens.css'
import './globals.css'

// Bangla fallback — patient names and any Bangla copy must never render in a
// system fallback font. Wired into --font-sans in tokens.css.
const anekBangla = Anek_Bangla({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-anek-bangla',
  display: 'swap',
})

export const metadata = {
  title: 'Ora — Dental Clinic Management',
  description: 'Manage your dental clinic patients, appointments, billing and more.',
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${anekBangla.variable}`}
    >
      <body className="font-sans bg-canvas text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
