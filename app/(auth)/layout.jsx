import Image from 'next/image'

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/logo-full.png"
            alt="Ora — Dental Clinic Management"
            width={180}
            height={60}
            className="mb-2"
            priority
          />
          <p className="mt-0.5 text-small text-secondary">Dental Clinic Management</p>
        </div>
        {children}
        <p className="mt-6 text-center text-label text-tertiary">
          &copy; {new Date().getFullYear()} Ora
        </p>
      </div>
    </div>
  )
}
