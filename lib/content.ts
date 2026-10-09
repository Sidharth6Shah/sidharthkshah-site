import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'

/*
  Loads content/site.yaml, the single source of truth for site copy.
  Read at build time on the server only. Items with status "offline"
  are filtered out by the helpers below.
*/

export type Status = 'live' | 'offline'

export type Link = { label: string; url: string }

export type Project = {
  name: string
  slug: string
  status: Status
  featured?: boolean
  year?: number | string
  area: string
  progress?: string
  tags: string[]
  summary: string
  highlights?: string[]
  stack: string[]
  links: Link[]
}

export type Job = {
  title: string
  company: string
  team?: string
  url?: string
  dates: string
  current?: boolean
  status: Status
  points: string[]
}

export type Article = {
  title: string
  kind: string
  date?: string
  status: Status
  url: string
  file: string
  summary: string
}

export type NowItem = {
  title: string
  context: string
  status: Status
  text: string
}

export type SiteContent = {
  tags: string[]
  person: {
    name: string
    email: string
    location: string
    resume_url?: string
    site_title: string
    site_description: string
  }
  socials: Link[]
  hero: { headline: string; intro: string; visual_caption: string }
  now: NowItem[]
  projects: Project[]
  experience: Job[]
  articles: Article[]
  contact: { headline: string }
}

const FILE = path.join(process.cwd(), 'content', 'site.yaml')

let cache: SiteContent | null = null

export function getContent(): SiteContent {
  if (cache) return cache
  const raw = parse(fs.readFileSync(FILE, 'utf8')) as SiteContent
  validate(raw)
  cache = raw
  return raw
}

const isLive = <T extends { status: Status }>(x: T) => x.status === 'live'

export function getLive() {
  const c = getContent()
  return {
    ...c,
    now: c.now.filter(isLive),
    projects: c.projects.filter(isLive),
    experience: c.experience.filter(isLive),
    articles: c.articles.filter(isLive),
  }
}

// Fail the build with a clear message if the content file has a typo,
// rather than shipping a half-broken page.
function validate(c: SiteContent) {
  const problems: string[] = []
  const tagSet = new Set(c.tags)
  const check = (list: { status: Status }[], where: string) =>
    list.forEach((x, i) => {
      if (x.status !== 'live' && x.status !== 'offline') {
        problems.push(`${where} #${i + 1}: status must be "live" or "offline"`)
      }
    })
  check(c.now, 'now')
  check(c.projects, 'projects')
  check(c.experience, 'experience')
  check(c.articles, 'articles')
  c.projects.forEach((p) => {
    p.tags.forEach((t) => {
      if (!tagSet.has(t)) problems.push(`project "${p.name}": tag "${t}" is not in the tags list`)
    })
    p.links ??= []
    p.stack ??= []
  })
  c.experience.forEach((j) => (j.points ??= []))
  if (problems.length) {
    throw new Error(`content/site.yaml has problems:\n- ${problems.join('\n- ')}`)
  }
}
