import Link from 'next/link'
import { Molecule } from './molecule'
import {
  NOW,
  FEATURED,
  PROJECTS,
  MORE_PROJECTS,
  WORK_EXPERIENCE,
  BLOG_POSTS,
  EMAIL,
  SOCIAL_LINKS,
  type Project,
} from './data'

function isExternal(href: string) {
  return href.startsWith('http')
}

function SmartLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  if (isExternal(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="grid scroll-mt-8 grid-cols-1 gap-x-12 gap-y-6 border-t py-14 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] md:py-20"
    >
      <h2
        id={`${id}-title`}
        className="text-[22px] leading-tight font-semibold tracking-tight text-ink md:sticky md:top-8 md:self-start"
      >
        {title}
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function ProjectEntry({ project }: { project: Project }) {
  return (
    <article className="flex flex-col gap-3 border-t pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-[22px] leading-snug font-semibold tracking-tight">
          {project.name}
        </h3>
        {project.status && (
          <span className="text-[15px] font-medium text-eosin">{project.status}</span>
        )}
      </div>
      <p className="text-[15px] text-muted">{project.area}</p>
      <p className="max-w-[60ch] text-[17px] leading-relaxed">{project.description}</p>
      <div className="mt-1 flex flex-col gap-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-muted" aria-label="Built with">
          {project.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        {project.link ? (
          <SmartLink
            href={project.link}
            className="text-link text-[15px] font-medium text-hema"
          >
            {project.linkLabel}
          </SmartLink>
        ) : (
          <span className="text-[15px] text-muted">Code is private for now</span>
        )}
      </div>
    </article>
  )
}

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="grid grid-cols-1 items-center gap-8 pt-10 pb-16 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:pt-16 md:pb-24">
        <div className="flex flex-col gap-8">
          <h1
            className="text-[clamp(64px,13vw,168px)] leading-[0.86] font-bold tracking-[-0.035em] text-ink"
            style={{ fontStretch: '75%' }}
          >
            Sidharth
            <br />
            Shah
          </h1>
          <p className="max-w-[34ch] text-[clamp(21px,2.3vw,27px)] leading-[1.35] font-medium tracking-tight">
            I build machine learning for molecules and genomes, aimed at
            finding better drugs faster.
          </p>
          <p className="max-w-[56ch] text-[17px] leading-relaxed text-muted">
            Biomedical engineering, computing option, at the University of
            Waterloo. This fall I’m doing bioinformatics research at The
            Centre for Applied Genomics at SickKids.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-[16px] font-medium text-ground transition-opacity hover:opacity-85"
            >
              Email me
            </a>
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full border px-5 text-[16px] font-medium transition-colors hover:bg-wash"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <figure className="flex flex-col gap-3">
          <Molecule className="aspect-square w-full max-w-[520px] justify-self-center" />
          <figcaption className="max-w-[44ch] text-[14px] leading-snug text-muted">
            Caffeine, as a graph neural network sees it: atoms are nodes and
            bonds are edges. Drag an atom.
          </figcaption>
        </figure>
      </section>

      <Section id="now" title="Now">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {NOW.map((item) => (
            <div key={item.title} className="flex flex-col gap-2">
              <h3 className="text-[20px] leading-snug font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="text-[15px] text-eosin">{item.context}</p>
              <p className="text-[17px] leading-relaxed text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="projects" title="Projects">
        <article className="rounded-3xl bg-wash p-6 sm:p-10">
          <p className="text-[15px] font-medium text-eosin">
            The project I’m proudest of
          </p>
          <h3
            className="mt-3 text-[clamp(30px,4vw,44px)] leading-[1.05] font-bold tracking-[-0.02em]"
            style={{ fontStretch: '85%' }}
          >
            {FEATURED.name}
          </h3>
          <p className="mt-5 max-w-[58ch] text-[18px] leading-relaxed">
            {FEATURED.description}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-muted" aria-label="Built with">
              {FEATURED.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link
                href="/blog/binding-affinity-research"
                className="text-link text-[15px] font-medium text-hema"
              >
                Read the write-up
              </Link>
              <a
                href={FEATURED.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link text-[15px] font-medium text-hema"
              >
                {FEATURED.linkLabel}
              </a>
            </div>
          </div>
        </article>

        <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-12 lg:grid-cols-2">
          {PROJECTS.map((p) => (
            <ProjectEntry key={p.name} project={p} />
          ))}
        </div>

        <h3 className="mt-16 text-[17px] font-semibold">Earlier projects</h3>
        <ul className="mt-3">
          {MORE_PROJECTS.map((p) => (
            <li key={p.name} className="border-b">
              <a
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <span className="font-medium group-hover:text-hema">{p.name}</span>
                <span className="text-[15px] text-muted sm:text-right">{p.description}</span>
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="experience" title="Experience">
        <ol className="flex flex-col">
          {WORK_EXPERIENCE.map((job) => {
            const body = (
              <>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[18px] font-semibold tracking-tight group-hover:text-hema">{job.title}</span>
                  <span className="text-[16px]">{job.company}</span>
                  <span className="text-[15px] text-muted">{job.detail}</span>
                </div>
                <span
                  className={`shrink-0 text-[15px] ${job.current ? 'font-medium text-eosin' : 'text-muted'}`}
                >
                  {job.current ? 'Since fall 2026' : job.start === job.end ? job.start : `${job.start} to ${job.end}`}
                </span>
              </>
            )
            const cls =
              'flex flex-col gap-2 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8'
            return (
              <li key={job.company} className="border-b last:border-b-0 [&:first-child>*]:pt-0">
                {job.link ? (
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${cls} group`}
                  >
                    {body}
                  </a>
                ) : (
                  <div className={cls}>{body}</div>
                )}
              </li>
            )
          })}
        </ol>
      </Section>

      <Section id="writing" title="Writing">
        <ul className="flex flex-col">
          {BLOG_POSTS.map((post) => (
            <li key={post.link} className="border-b last:border-b-0 [&:first-child>a]:pt-0">
              <Link href={post.link} className="group flex flex-col gap-1.5 py-6">
                <span className="text-[14px] font-medium text-eosin">{post.kind}</span>
                <span className="max-w-[48ch] text-[20px] leading-snug font-semibold tracking-tight group-hover:text-hema">
                  {post.title}
                </span>
                <span className="max-w-[62ch] text-[16px] leading-relaxed text-muted">
                  {post.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <section
        id="contact"
        aria-labelledby="contact-title"
        className="scroll-mt-8 border-t pt-16 md:pt-24"
      >
        <h2
          id="contact-title"
          className="max-w-[18ch] text-[clamp(36px,6vw,72px)] leading-[0.98] font-bold tracking-[-0.03em]"
          style={{ fontStretch: '80%' }}
        >
          Working on ML for biology or drug discovery? Let’s talk.
        </h2>
        <a
          href={`mailto:${EMAIL}`}
          className="text-link mt-8 inline-block text-[clamp(20px,2.4vw,28px)] font-medium text-hema"
        >
          {EMAIL}
        </a>
      </section>
    </main>
  )
}
