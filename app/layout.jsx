import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata = {
  title: 'Ora — Dental Clinic Management',
  description: 'Manage your dental clinic patients, appointments, billing and more.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans bg-slate-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  )
}
