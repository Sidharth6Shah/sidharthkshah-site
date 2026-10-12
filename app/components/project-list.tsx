'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Project, Link as LinkT } from '@/lib/content'

function SmartLink({ link, className }: { link: LinkT; className?: string }) {
  if (link.url.startsWith('http')) {
    return (
      <a href={link.url} className={className} target="_blank" rel="noopener noreferrer">
        {link.label}
      </a>
    )
  }
  return (
    <Link href={link.url} className={className}>
      {link.label}
    </Link>
  )
}

function Links({ links }: { links: LinkT[] }) {
  if (!links.length) {
    return <span className="text-[15px] text-muted">Code is private for now</span>
  }
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1">
      {links.map((l) => (
        <SmartLink key={l.url} link={l} className="text-link text-[15px] font-medium text-hema" />
      ))}
    </div>
  )
}

export function ProjectList({ projects, tags }: { projects: Project[]; tags: string[] }) {
  const [active, setActive] = useState<string | null>(null)

  // Only offer tags that at least one live project uses
  const usedTags = useMemo(
    () => tags.filter((t) => projects.some((p) => p.tags.includes(t))),
    [tags, projects]
  )
  const showFilter = usedTags.length > 1 && projects.length >= 5

  const shown = active ? projects.filter((p) => p.tags.includes(active)) : projects
  const featured = shown.find((p) => p.featured)
  const rest = shown.filter((p) => !p.featured)

  return (
    <div>
      {showFilter && (
        <div className="mb-10 flex flex-wrap items-center gap-x-1 gap-y-2" role="group" aria-label="Filter projects by topic">
          {[null, ...usedTags].map((t) => {
            const on = active === t
            return (
              <button
                key={t ?? 'all'}
                type="button"
                aria-pressed={on}
                onClick={() => setActive(t)}
                className={`min-h-9 rounded-full px-3.5 text-[15px] transition-colors ${
                  on ? 'bg-ink text-ground' : 'text-muted hover:bg-wash hover:text-ink'
                }`}
              >
                {t ?? 'All'}
              </button>
            )
          })}
          <span className="sr-only" aria-live="polite">
            {shown.length} {shown.length === 1 ? 'project' : 'projects'} shown
          </span>
        </div>
      )}

      {featured && (
        <article className="mb-4 border-b pb-12">
          <h3 className="text-[clamp(26px,3.2vw,34px)] leading-[1.1] font-semibold tracking-[-0.02em]">
            {featured.name}
          </h3>
          <p className="mt-2 text-[15px] text-muted">{featured.area}</p>
          <p className="mt-5 max-w-[60ch] text-[18px] leading-relaxed">{featured.summary}</p>
          {featured.highlights && featured.highlights.length > 0 && (
            <ul className="mt-5 flex flex-col gap-1.5 text-[16px]">
              {featured.highlights.map((h) => (
                <li key={h} className="flex gap-3">
                  <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-eosin" />
                  {h}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-5 text-[15px] text-muted">{featured.stack.join(', ')}</p>
          <div className="mt-4">
            <Links links={featured.links} />
          </div>
        </article>
      )}

      <ul>
        {rest.map((p) => (
          <li key={p.slug} className="grid grid-cols-1 gap-x-10 gap-y-2 border-b py-8 last:border-b-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div>
              <h3 className="text-[20px] leading-snug font-semibold tracking-tight">{p.name}</h3>
              <p className="mt-1 text-[15px] text-muted">{p.area}</p>
              {p.progress && <p className="mt-1 text-[15px] font-medium text-eosin">{p.progress}</p>}
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-[17px] leading-relaxed">{p.summary}</p>
              {p.stack.length > 0 && <p className="text-[15px] text-muted">{p.stack.join(', ')}</p>}
              <Links links={p.links} />
            </div>
          </li>
        ))}
      </ul>

      {shown.length === 0 && (
        <p className="py-8 text-muted">Nothing here yet. Pick another topic.</p>
      )}
    </div>
  )
}
