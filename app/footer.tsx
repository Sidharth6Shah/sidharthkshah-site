import { getContent } from '@/lib/content'

export function Footer() {
  const { person } = getContent()
  return (
    <footer className="mt-24 flex flex-wrap items-center justify-between gap-3 border-t py-8 text-[14px] text-muted">
      <span>© 2026 {person.name}</span>
      <span>{person.location}</span>
    </footer>
  )
}
