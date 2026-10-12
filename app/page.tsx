import Link from 'next/link'
import { getLive } from '@/lib/content'
import { Protein } from './components/protein'
import { ProjectList } from './components/project-list'

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
      className="grid scroll-mt-8 grid-cols-1 gap-x-12 gap-y-8 border-t py-16 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] md:py-24"
    >
      <h2
        id={`${id}-title`}
        className="text-[15px] font-medium text-muted md:sticky md:top-10 md:self-start"
      >
        {title}
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

export default function Home() {
  const c = getLive()
  const { person, hero } = c

  return (
    <main className="overflow-x-clip">
      {/* Hero */}
      <section className="grid grid-cols-1 items-center gap-6 pt-8 pb-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12 md:pt-12 md:pb-24">
        <div className="relative z-10 flex flex-col gap-6">
          <h1 className="text-[clamp(40px,5.2vw,64px)] leading-[1] font-semibold tracking-[-0.03em]">
            {person.name}
          </h1>
          <p className="max-w-[26ch] text-[clamp(22px,2.4vw,28px)] leading-[1.3] tracking-tight">
            {hero.headline}
          </p>
          <p className="max-w-[52ch] text-[17px] leading-relaxed text-muted">{hero.intro}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-[16px]">
            <a href={`mailto:${person.email}`} className="text-link font-medium text-hema">
              Email
            </a>
            {c.socials.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="text-link">
                {s.label}
              </a>
            ))}
            {person.resume_url && (
              <a href={person.resume_url} className="text-link" target="_blank" rel="noopener noreferrer">
                Resume
              </a>
            )}
          </div>
        </div>

        <figure className="relative z-0 my-2 md:my-0">
          <Protein
            className="mx-auto aspect-[5/4] w-full max-w-[600px]"
            label="A rotating 3D ribbon diagram of an enzyme, with an inhibitor drug bound inside it."
          />
          <figcaption className="relative z-10 mx-auto mt-8 max-w-[46ch] text-center text-[14px] leading-snug text-muted">
            {hero.visual_caption}
          </figcaption>
        </figure>
      </section>

      {c.now.length > 0 && (
        <Section id="now" title="Now">
          <div className={`grid grid-cols-1 gap-10 ${c.now.length > 1 ? 'lg:grid-cols-2' : 'max-w-[60ch]'}`}>
            {c.now.map((item) => (
              <div key={item.title} className="flex flex-col gap-2">
                <h3 className="text-[20px] leading-snug font-semibold tracking-tight">{item.title}</h3>
                <p className="text-[15px] text-eosin">{item.context}</p>
                <p className="text-[17px] leading-relaxed text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section id="projects" title="Projects">
        <ProjectList projects={c.projects} tags={c.tags} />
      </Section>

      <Section id="experience" title="Experience">
        <ol>
          {c.experience.map((job, i) => (
            <li
              key={`${job.company}-${job.title}`}
              className={`grid grid-cols-1 gap-x-10 gap-y-3 border-b py-8 last:border-b-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] ${i === 0 ? 'pt-0' : ''}`}
            >
              <div>
                <h3 className="text-[18px] leading-snug font-semibold tracking-tight">{job.title}</h3>
                <p className="mt-1 text-[16px]">
                  {job.url ? (
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-link">
                      {job.company}
                    </a>
                  ) : (
                    job.company
                  )}
                </p>
                {job.team && <p className="mt-0.5 text-[15px] text-muted">{job.team}</p>}
                <p className={`mt-1 text-[15px] ${job.current ? 'font-medium text-eosin' : 'text-muted'}`}>
                  {job.dates}
                </p>
              </div>
              {job.points.length > 0 && (
                <ul className="flex flex-col gap-2 text-[16px] leading-relaxed">
                  {job.points.map((pt) => (
                    <li key={pt} className="flex gap-3">
                      <span aria-hidden className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-muted" />
                      {pt}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </Section>

      {c.articles.length > 0 && (
        <Section id="writing" title="Writing">
          <ul>
            {c.articles.map((post, i) => (
              <li key={post.url} className="border-b last:border-b-0">
                <Link href={post.url} className={`group flex flex-col gap-1.5 py-7 ${i === 0 ? 'pt-0' : ''}`}>
                  <span className="text-[14px] font-medium text-eosin">{post.kind}</span>
                  <span className="max-w-[48ch] text-[20px] leading-snug font-semibold tracking-tight group-hover:text-hema">
                    {post.title}
                  </span>
                  <span className="max-w-[62ch] text-[16px] leading-relaxed text-muted">{post.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <section id="contact" aria-labelledby="contact-title" className="scroll-mt-8 border-t pt-16 md:pt-24">
        <h2
          id="contact-title"
          className="max-w-[20ch] text-[clamp(30px,4.4vw,52px)] leading-[1.05] font-semibold tracking-[-0.03em]"
        >
          {c.contact.headline}
        </h2>
        <a
          href={`mailto:${person.email}`}
          className="text-link mt-6 inline-block text-[clamp(19px,2vw,24px)] font-medium text-hema"
        >
          {person.email}
        </a>
      </section>
    </main>
  )
}
