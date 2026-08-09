import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'Ora — Dental Clinic Management',
  description: 'Manage your dental clinic patients, appointments, billing and more.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-[#fafafa] text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
