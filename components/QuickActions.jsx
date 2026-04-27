import { UserPlus, CalendarDays, FileText, Wallet } from 'lucide-react'

const actions = [
  {
    label: 'Add Patient',
    icon: UserPlus,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    href: '/patients/new',
  },
  {
    label: 'Add Schedule',
    icon: CalendarDays,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    href: '/appointments/new',
  },
  {
    label: 'Create Invoice',
    icon: FileText,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    href: '/invoices/new',
  },
  {
    label: 'Add Expenses',
    icon: Wallet,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-500',
    href: '/expenses/new',
  },
]

export default function QuickActions() {
  return (
    <section>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
        Quick action
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map(({ label, icon: Icon, iconBg, iconColor, href }) => (
          
            key={label}
            href={href}
            className="flex flex-col items-center justify-center gap-2.5 py-5 px-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${iconBg}`}>
              <Icon size={20} className={iconColor} strokeWidth={1.8} />
            </div>
            <span className="text-sm font-medium text-gray-700 text-center leading-tight">
              {label}
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
