import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'


export default async function HomePage() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen">

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-12">
        <div className="flex flex-col items-center text-center gap-4">
          <Badge variant="secondary" className="font-mono uppercase">AI readiness, distilled</Badge>
          <h1 className="text-[44px] sm:text-[56px] md:text-[102px] leading-[1.05] tracking-tight pt-6">
            Assess, plan, and share<br />your AI readiness
          </h1>
          <p className="max-w-2xl text-balance text-base sm:text-lg text-muted-foreground pt-0">
            A focused survey that measures literacy, adoption, and organizational enablers.
            Generate a beautiful, shareable report for your company.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
            <Link href="/sign-up"><Button >Start free</Button></Link>
            <Link href="/sign-in"><Button variant="secondary">Sign in</Button></Link>
          </div>
        </div>

        <div className="mt-12 gap-6 rounded-8 overflow-hidden rounded-[52px]">
          <Image src="/images/top.jpg" alt="App screenshot" width={1200} height={675} className="h-full w-full object-cover" />
        </div>
      </section>

      {/* Centered statement + metrics */}
      <section className="mx-auto max-w-6xl px-4 py-14 text-center">
        <Badge variant="secondary" className="font-mono uppercase">AI readiness, distilled</Badge>

        <h2 className="text-[64px] font-serif tracking-tight">Alignment for a new generation</h2>
        <p className="mt-2 text-base text-muted-foreground max-w-2xl mx-auto">Simple survey → trustworthy signal. Modern UX, secure data, and a shareable report that leadership will actually read.</p>
        <div className="mt-5 flex flex-wrap font-mono tracking-widest uppercase items-center justify-center gap-6 text-sm text-muted-foreground">
          <span>RLS‑secured</span>
          <span>Domain‑restricted sign‑in</span>
          <span>GPT‑4.1 follow‑ups</span>
        </div>
      </section>

      {/* Features */}
      {/* <section id="features" className="mx-auto max-w-6xl px-4 py-12">
        <FeaturesGrid />
      </section> */}

      {/* Alternating feature slices */}
      <section className="mx-auto max-w-6xl px-4 py-8 space-y-16">
        {featureSlices.map((f, i) => (
          <div key={f.title} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className={i % 2 === 1 ? 'md:order-2 h-full flex' : 'h-full flex'}>
              <div className="flex flex-col gap-2 h-full">
                <div className="mb-2">
                  <span className="text-2xl pl-0 pr-3">{f.emoji}</span>
                  <span className="mb-3 font-mono uppercase tracking-widest text-sm pt-8">{f.kicker}</span>
                </div>
                <h3 className="text-[44px] font-serif font-normal leading-[1.05]">{f.title}</h3>
                <p className="mt-2 text-base text-muted-foreground">{f.description}</p>
                <div className="mt-4 flex items-center gap-3 flex-1">
                  <Link href="/sign-up"><Button>{f.cta}</Button></Link>
                  <Link href="/sign-in"><Button variant="secondary">Learn more</Button></Link>
                </div>
              </div>
            </div>
            <div className={i % 2 === 1 ? 'md:order-1' : ''}>
              <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl">
                <Image src={f.image} alt={f.title} width={1000} height={750} className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Callout */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-4xl bg-muted/40 p-10 text-center bg-rose-200">
          <h2 className="text-3xl sm:text-4xl leading-tight">One simple assessment to align your teams on AI</h2>
          <p className="mt-3 text-muted-foreground">Domain‑restricted sign‑in. RLS‑secured data. Minimal by design.</p>
          <div className="mt-6"><Link href="/sign-up"><Button>Create your company</Button></Link></div>
        </div>
      </section>

      {/* Footer (dark green) */}
      <footer className="bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 grid grid-cols-1 sm:grid-cols-4 gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white" aria-hidden />
              <span className="text-base font-mono font-medium">AIR</span>
            </div>
            <p className="text-xs opacity-70 max-w-xs">AI-Readiness Assessment. Minimal, secure, and shareable.</p>
          </div>
          <FooterCol title="Product" links={[["Features", "#features"], ["How it works", "#how-it-works"], ["Pricing", "/sign-up"]]} />
          <FooterCol title="Company" links={[["Roadmap", "/"], ["Docs", "/"], ["Status", "/"]]} />
          <FooterCol title="Legal" links={[["Terms", "/"], ["Privacy", "/"], ["Security", "/"]]} />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-10 text-xs opacity-70">© {new Date().getFullYear()} AIR. All rights reserved.</div>
      </footer>
    </main>
  )
}

const featureSlices = [
  {
    emoji: '🎯',
    kicker: 'Plan',
    title: 'Keep your AI program visible',
    description: 'Track literacy, adoption, and organizational enablers with a single assessment everyone understands.',
    cta: 'Start assessment',
    image: '/images/features1.jpg',
    bullets: ['20 core questions', 'No edits after submit', 'Shareable public report', 'CSV export'],
  },
  {
    emoji: '🚀',
    kicker: 'Act',
    title: 'Focus on the biggest opportunities',
    description: 'See strengths and gaps across teams. Use follow‑ups to dig where signal is weak.',
    cta: 'See a sample report',
    image: '/images/features2.jpg',
    bullets: ['Module & dimension scores', 'Narrative insights', 'Heat‑map matrix', 'Manager controls'],
  },
  {
    emoji: '🏆',
    kicker: 'Deliver',
    title: 'A report you can share with leadership',
    description: 'One-click generate produces a clean HTML page hosted via signed URL.',
    cta: 'Generate report',
    image: '/images/features3.jpg',
    bullets: ['Public slug toggle', 'Regenerate anytime', 'Overwrite previous versions', 'Edge‑ready routes'],
  },
]



function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-mono font-medium uppercase tracking-widest">{title}</div>
      <ul className="space-y-2 text-xs opacity-80">
        {links.map(([label, href]) => (
          <li key={label}><Link href={href} className="hover:opacity-100">{label}</Link></li>
        ))}
      </ul>
    </div>
  )
}
