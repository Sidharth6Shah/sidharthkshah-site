import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'

const NAV = [
  { label: 'Projects', href: '/#projects' },
  { label: 'Writing', href: '/#writing' },
  { label: 'Contact', href: '/#contact' },
]

export function Header() {
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <Link
        href="/"
        className="text-[17px] font-semibold tracking-tight text-ink"
      >
        Sidharth Shah
      </Link>
      <nav aria-label="Main" className="flex items-center gap-1 sm:gap-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="hidden rounded-full px-3 py-2 text-[15px] text-muted transition-colors hover:text-ink sm:inline-block"
          >
            {item.label}
          </Link>
        ))}
        <ThemeToggle />
      </nav>
    </header>
  )
}
