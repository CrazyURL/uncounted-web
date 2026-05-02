import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { Marked } from 'marked'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SOURCE_DIR = resolve(ROOT, 'legal/source')
const OUTPUT_DIR = resolve(ROOT, 'legal')
const TEMPLATE_PATH = resolve(OUTPUT_DIR, '_template.html')

const PAGES = [
  {
    sourceFile: 'Uncounted_TermsOfService_v1.0.md',
    outputFile: 'terms.html',
    title: '이용약관',
    versionLine: 'v1.0 · 시행일 2026년 6월 1일',
  },
  {
    sourceFile: 'Uncounted_PrivacyPolicy_v1.1.md',
    outputFile: 'privacy.html',
    title: '개인정보처리방침',
    versionLine: 'v1.1 · 시행일 2026년 6월 1일',
  },
]

const marked = new Marked({
  gfm: true,
  breaks: false,
  pedantic: false,
})

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function applyTemplate(template, { title, versionLine, content }) {
  return template
    .replaceAll('{{TITLE}}', escapeHtml(title))
    .replaceAll('{{VERSION_LINE}}', escapeHtml(versionLine))
    .replace('{{CONTENT}}', content)
}

async function buildPage(template, page) {
  const mdPath = resolve(SOURCE_DIR, page.sourceFile)
  const md = await readFile(mdPath, 'utf8')
  const html = await marked.parse(md)
  const out = applyTemplate(template, {
    title: page.title,
    versionLine: page.versionLine,
    content: html,
  })
  const outPath = resolve(OUTPUT_DIR, page.outputFile)
  await writeFile(outPath, out, 'utf8')
  console.log(`[build:legal] ${page.sourceFile} -> legal/${page.outputFile}`)
}

async function main() {
  const template = await readFile(TEMPLATE_PATH, 'utf8')
  for (const page of PAGES) {
    await buildPage(template, page)
  }
  console.log(`[build:legal] done — ${PAGES.length} pages`)
}

main().catch((err) => {
  console.error('[build:legal] FAILED:', err)
  process.exit(1)
})
