// Shared frame for login/register: calm canvas, centered card, one brand mark.
// Replaces the gradient + blur-blob treatment each auth page used to paint
// for itself.
export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-h3 text-inverse">
            O
          </span>
          <h1 className="text-h2 text-primary">Ora</h1>
          <p className="mt-0.5 text-small text-secondary">Dental Clinic Management</p>
        </div>
        {children}
        <p className="mt-6 text-center text-label text-tertiary">
          © {new Date().getFullYear()} Ora
        </p>
      </div>
    </div>
  )
}
