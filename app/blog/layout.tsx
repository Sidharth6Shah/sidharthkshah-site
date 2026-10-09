'use client'
import Link from 'next/link'
import { TextMorph } from '@/components/ui/text-morph'
import { ScrollProgress } from '@/components/ui/scroll-progress'
import { useEffect, useState } from 'react'

function CopyButton() {
  const [text, setText] = useState('Copy link')

  useEffect(() => {
    if (text === 'Copy link') return
    const t = setTimeout(() => setText('Copy link'), 2000)
    return () => clearTimeout(t)
  }, [text])

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(window.location.href)
        setText('Link copied')
      }}
      className="inline-flex min-h-11 items-center rounded-full px-3 text-[15px] text-muted transition-colors hover:bg-wash hover:text-ink"
      type="button"
    >
      <TextMorph>{text}</TextMorph>
    </button>
  )
}

export default function LayoutBlogPost({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ScrollProgress
        className="fixed top-0 z-20 h-[3px] bg-eosin"
        springOptions={{
          bounce: 0,
        }}
      />
      <div className="mx-auto w-full max-w-[72ch]">
        <div className="mt-6 flex items-center justify-between gap-4">
          <Link href="/#writing" className="text-link text-[15px] text-muted hover:text-ink">
            All writing
          </Link>
          <CopyButton />
        </div>
        <main className="prose prose-lg mt-10 max-w-none pb-20 prose-h1:text-[clamp(32px,5vw,48px)] prose-h1:leading-[1.05] prose-h1:font-bold prose-h1:tracking-tight prose-h2:mt-14 prose-h2:scroll-m-20 prose-h2:text-2xl prose-h2:font-semibold prose-h3:text-xl prose-h3:font-semibold prose-h4:font-semibold prose-a:underline-offset-4 prose-strong:font-semibold prose-img:rounded-2xl">
          {children}
        </main>
      </div>
    </>
  )
}
