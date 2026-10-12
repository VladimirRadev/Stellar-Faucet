import { type MouseEvent, type ReactNode, useEffect, useState, useSyncExternalStore } from 'react'
import { ExternalIcon, GithubIcon, StarGlyph } from '../shell/icons'
import { getSite } from '../shell/sites'
import {
  type ContactKind,
  certifications,
  education,
  experience,
  languages,
  pdf,
  pdfUrl,
  profile,
  projects,
  projectsIntro,
  skills,
  summary,
} from './cvData'
import { DownloadIcon, FileIcon, LinkedinIcon, MailIcon, PhoneIcon, PinIcon } from './icons'

/** Sections in page order. The ids are the URL anchors (for example #projects). */
const SECTIONS = [
  { id: 'summary', label: 'Summary' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'education', label: 'Education' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'languages', label: 'Languages' },
  { id: 'pdf', label: 'PDF preview' },
] as const
type SectionId = (typeof SECTIONS)[number]['id']
const SECTION_IDS: readonly string[] = SECTIONS.map((s) => s.id)

const CONTACT_ICONS: Record<ContactKind, ReactNode> = {
  email: <MailIcon />,
  phone: <PhoneIcon />,
  linkedin: <LinkedinIcon size={14} />,
  github: <GithubIcon size={15} />,
}

export function CvApp() {
  const active = useActiveSection()
  useScrollToHashOnLoad()

  return (
    <div className="space-y-12 sm:space-y-16">
      <Hero />

      <div className="grid gap-8 lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-12">
        <JumpNav active={active} />

        <div className="min-w-0 space-y-14 sm:space-y-20">
          <Section id="summary" index={1} title="Professional Summary">
            <div className="card p-5 sm:p-7">
              <p className="text-[0.975rem] leading-relaxed text-text/90 sm:text-base">
                <Text>{summary}</Text>
              </p>
            </div>
          </Section>

          <Section id="skills" index={2} title="Skills">
            <SkillsGrid />
          </Section>

          <Section id="experience" index={3} title="Work Experience">
            <Timeline
              items={experience.map((job) => ({
                key: job.role,
                title: job.role,
                subtitle: job.org,
                dates: job.dates,
                bullets: job.bullets,
              }))}
            />
          </Section>

          <Section id="projects" index={4} title="Projects">
            <ProjectsBlock />
          </Section>

          <Section id="education" index={5} title="Education">
            <Timeline
              items={education.map((e) => ({ key: e.degree, title: e.degree, subtitle: e.school, dates: e.dates }))}
            />
          </Section>

          <div className="grid gap-14 sm:grid-cols-2 sm:gap-4">
            <Section id="certifications" index={6} title="Certifications">
              <ul className="card space-y-2 p-5 sm:p-6">
                {certifications.map((c) => (
                  <li key={c} className="flex items-start gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent-2" aria-hidden />
                    <span className="font-medium">{c}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="languages" index={7} title="Languages">
              <ul className="card divide-y divide-border p-0">
                {languages.map((l) => (
                  <li key={l.name} className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
                    <span className="font-medium">{l.name}</span>
                    <span className="font-mono text-xs uppercase tracking-wider text-accent-2">{l.level}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <Section id="pdf" index={8} title="PDF preview">
            <PdfPreview />
          </Section>

          <p className="text-balance border-t border-border/70 pt-6 text-center text-xs text-muted">
            Last updated {pdf.updated} · also linked from every Stellar app
          </p>
        </div>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="min-w-0">
      <div className="min-w-0 pt-2">
        <p className="eyebrow inline-flex items-center gap-2">
          <StarGlyph size={12} /> Stellar suite · Curriculum vitae
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
          Vladimir{' '}
          <span className="bg-gradient-to-r from-lime via-accent-2 to-accent bg-clip-text text-transparent">Radev</span>
        </h1>
        <p className="mt-3 font-display text-lg text-text/90 sm:text-xl">{profile.title}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="chip">
            <PinIcon className="text-accent-2" /> {profile.location}
          </span>
          <span className="chip">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-50" />
              <span className="relative inline-flex size-2 rounded-full bg-lime" />
            </span>
            {profile.availability}
          </span>
        </div>

        <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
          <a className="btn btn-primary h-12 px-6 text-base" href={pdfUrl} download={pdf.fileName}>
            <DownloadIcon /> Download PDF
          </a>
          <a className="btn btn-ghost h-12 px-5" href={pdfUrl} target="_blank" rel="noopener">
            Open in new tab <ExternalIcon />
          </a>
        </div>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted">
          <FileIcon size={14} /> PDF · {pdf.pages} pages · A4 · updated {pdf.updated}
        </p>

        <ul className="mt-7 flex flex-wrap gap-2" aria-label="Contact">
          {profile.contacts.map((c) => {
            const external = c.href.startsWith('http')
            return (
              <li key={c.kind} className="min-w-0 max-w-full">
                <a
                  href={c.href}
                  className="chip max-w-full text-muted transition hover:border-accent-2/45 hover:text-text"
                  {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                >
                  <span className="shrink-0 text-accent-2">{CONTACT_ICONS[c.kind]}</span>
                  <span className="truncate">{c.label}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/** Desktop: sticky list beside the content. Phones and tablets: a wrapped row of links above it. */
function JumpNav({ active }: { active: readonly SectionId[] }) {
  return (
    <nav aria-label="Jump to section" className="min-w-0">
      <div className="lg:sticky lg:top-28">
        <p className="eyebrow">Jump to section</p>

        <ul className="mt-3 flex flex-wrap gap-1.5 lg:hidden">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={jumpTo(s.id)}
                className="inline-flex h-8 items-center rounded-full border border-border bg-surface/70 px-3 text-[0.8125rem] text-muted transition hover:border-accent-2/45 hover:text-text"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>

        <ul className="mt-3 hidden border-l border-border lg:block">
          {SECTIONS.map((s, i) => {
            const isActive = active.includes(s.id)
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={jumpTo(s.id)}
                  aria-current={isActive ? 'location' : undefined}
                  className={`-ml-px flex items-center gap-3 border-l-2 py-1.5 pl-4 text-sm transition ${
                    isActive ? 'border-accent-2 text-text' : 'border-transparent text-muted hover:text-text'
                  }`}
                >
                  <span className="font-mono text-[0.7rem] text-muted/70">{String(i + 1).padStart(2, '0')}</span>
                  {s.label}
                </a>
              </li>
            )
          })}
        </ul>

        <a
          className="link mt-6 hidden items-center gap-1.5 text-sm font-medium lg:inline-flex"
          href={pdfUrl}
          download={pdf.fileName}
        >
          <DownloadIcon size={16} /> Download PDF
        </a>
      </div>
    </nav>
  )
}

function Section({ id, index, title, children }: { id: SectionId; index: number; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="min-w-0 scroll-mt-6 md:scroll-mt-32">
      <p className="font-mono text-xs text-accent-2">{String(index).padStart(2, '0')}</p>
      <h2 id={`${id}-title`} className="mt-1.5 text-2xl font-semibold sm:text-3xl">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function SkillsGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
      {skills.map((g, i) => {
        // The first group (smart contracts) is the longest: give it the full width and two columns of lines.
        const wide = i === 0
        return (
          <div key={g.group} className={`card min-w-0 p-5 sm:p-6 ${wide ? 'sm:col-span-2' : ''}`}>
            <h3 className="font-display text-base font-semibold text-accent-2">{g.group}</h3>
            <ul className={`mt-3 grid gap-2 ${wide ? 'md:grid-cols-2 md:gap-x-8' : ''}`}>
              {g.lines.map((line) => (
                <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-text/85">
                  <span className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-muted" aria-hidden />
                  <span className="min-w-0">
                    <Text>{line}</Text>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

type TimelineItem = { key: string; title: string; subtitle: string; dates: string; bullets?: readonly string[] }

function Timeline({ items }: { items: readonly TimelineItem[] }) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-5 sm:pl-7">
      {items.map((item) => (
        <li key={item.key} className="relative">
          <span
            aria-hidden
            className="absolute -left-[calc(1.25rem+5px)] top-6 size-2.5 rounded-full border-2 border-bg bg-accent-2 shadow-[0_0_0_3px_rgb(52_211_153/0.18)] sm:-left-[calc(1.75rem+5px)]"
          />
          <div className="card min-w-0 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <h3 className="font-display text-lg font-semibold leading-snug">{item.title}</h3>
                <p className="mt-0.5 text-sm text-muted">{item.subtitle}</p>
              </div>
              <span className="shrink-0 rounded-full border border-border bg-surface/70 px-2.5 py-1 font-mono text-xs text-text/90">
                {item.dates}
              </span>
            </div>
            {item.bullets && item.bullets.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {item.bullets.map((b) => (
                  <li key={b} className="flex gap-2.5 text-sm leading-relaxed text-text/85">
                    <span className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-accent-2" aria-hidden />
                    <span className="min-w-0">
                      <Text>{b}</Text>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}

function ProjectsBlock() {
  return (
    <div className="space-y-5">
      <div className="card p-5 sm:p-6">
        <h3 className="font-display text-lg font-semibold">{projectsIntro.title}</h3>
        <p className="mt-1 text-xs italic text-muted">{projectsIntro.note}</p>
        <p className="mt-3 flex gap-2.5 text-sm leading-relaxed text-text/85">
          <span className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-accent-2" aria-hidden />
          <span className="min-w-0">
            <Text>{projectsIntro.summary}</Text>
          </span>
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        {projects.map((p, i) => {
          const site = getSite(p.site)
          return (
            <article key={p.site} className="card flex min-w-0 flex-col p-5 sm:p-6">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-accent-2">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="min-w-0 font-display text-lg font-semibold leading-snug">
                  <a href={site.url} className="transition hover:text-accent-2">
                    {p.name}
                  </a>
                </h3>
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-text/80">
                <Text>{p.description}</Text>
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
                <a className="link inline-flex items-center gap-1.5" href={site.url} title={site.url}>
                  Live site <ExternalIcon />
                </a>
                <a
                  className="link inline-flex items-center gap-1.5"
                  href={site.repo}
                  title={site.repo}
                  target="_blank"
                  rel="noreferrer"
                >
                  <GithubIcon size={15} /> Repository
                </a>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function PdfPreview() {
  // Phone browsers (Android Chrome in particular) cannot show a PDF inside an iframe, so phones get a
  // file card instead. The iframe is mounted only from 640 px up, so phones never fetch the PDF early.
  const wide = useMediaQuery('(min-width: 640px)')
  return (
    <div className="space-y-3">
      <p className="max-w-2xl text-sm text-muted">
        The same CV as a {pdf.pages}-page A4 PDF: single column, plain text, ready for applicant tracking systems.
      </p>
      {wide ? (
        <>
          <div className="card overflow-hidden p-3">
            <iframe
              src={`${pdfUrl}#view=FitH`}
              title="CV of Vladimir Radev (PDF)"
              loading="lazy"
              className="block h-[80vh] min-h-[36rem] w-full rounded-xl border border-border bg-surface-2"
            />
          </div>
          <p className="text-sm text-muted">
            Preview not showing?{' '}
            <a className="link font-medium" href={pdfUrl} target="_blank" rel="noopener">
              Open the PDF
            </a>{' '}
            or{' '}
            <a className="link font-medium" href={pdfUrl} download={pdf.fileName}>
              download it
            </a>
            .
          </p>
        </>
      ) : (
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-accent-2">
              <FileIcon size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium [overflow-wrap:anywhere]">
                {/* Break after underscores rather than inside a word. */}
                {pdf.fileName.split('_').map((part, i, all) => (
                  <span key={i}>
                    {part}
                    {i < all.length - 1 ? (
                      <>
                        _<wbr />
                      </>
                    ) : null}
                  </span>
                ))}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {pdf.pages} pages · A4 · updated {pdf.updated}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a className="btn btn-ghost px-3" href={pdfUrl} target="_blank" rel="noopener">
              Open <ExternalIcon />
            </a>
            <a className="btn btn-primary px-3" href={pdfUrl} download={pdf.fileName}>
              <DownloadIcon size={16} /> Download
            </a>
          </div>
          <p className="mt-3 text-xs text-muted">Phone browsers show the PDF in their own viewer, not inside this page.</p>
        </div>
      )}
    </div>
  )
}

/** Keeps hyphenated terms (ERC-1155, commit-reveal) on one line, as the PDF does. */
function Text({ children }: { children: string }) {
  const parts = children.split(/([A-Za-z0-9]+(?:-[A-Za-z0-9]+)+)/)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="whitespace-nowrap">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  )
}

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}

/** Click handler for in-page links: scroll to the section, smoothly unless the visitor prefers reduced motion. */
function jumpTo(id: SectionId) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    history.replaceState(null, '', `#${id}`)
  }
}

/** The page renders after load, so the browser cannot honour a #section in the URL by itself. */
function useScrollToHashOnLoad() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (SECTION_IDS.includes(id)) document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }, [])
}

/**
 * The sections highlighted in the desktop jump list: the last section whose top has passed a line at 35%
 * of the viewport height. Sections placed side by side (certifications and languages) share a top and are
 * highlighted together. Above the first section nothing is highlighted.
 */
function useActiveSection(): readonly SectionId[] {
  const [active, setActive] = useState<readonly SectionId[]>([])
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * 0.35
      const tops = SECTIONS.map((s) => ({
        id: s.id,
        top: Math.round(document.getElementById(s.id)?.getBoundingClientRect().top ?? Infinity),
      }))
      const passed = tops.filter((t) => t.top <= line)
      let next: SectionId[] = []
      if (passed.length > 0) {
        const top = Math.max(...passed.map((t) => t.top))
        next = passed.filter((t) => Math.abs(t.top - top) <= 2).map((t) => t.id)
      }
      setActive((prev) => (prev.length === next.length && prev.every((id, i) => id === next[i]) ? prev : next))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])
  return active
}
