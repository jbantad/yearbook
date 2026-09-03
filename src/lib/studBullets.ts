import { STUDS } from './studs'

// Purely presentational — this never touches what's actually stored for a
// block, only the HTML handed to dangerouslySetInnerHTML for display, so
// re-opening the entry to edit it still shows the plain "-" you typed.
//
// A "line" here means: a top-level <div> (contentEditable wraps each
// Enter-separated paragraph in one) — including a soft break *inside* one
// via <br> ("Items to bring:" then "-laptop" on the next line of the same
// paragraph needs its own bullet just like a line in its own <div> would) —
// OR a bare text node sitting directly at the top level, a sibling of those
// <div>s rather than inside one. contentEditable does produce that: pasting
// or certain edit sequences can leave "-laptop" as a raw text node between
// two <div>s instead of wrapped in its own, and it still renders as its own
// line (browsers put a block-level <div> on its own line either way), so it
// needs the same treatment even though it isn't a <div> at all.
export function renderStudBullets(html: string): string {
  if (!html.includes('-')) return html
  const tmp = document.createElement('div')
  tmp.innerHTML = html

  let colorIndex = 0

  function tryBullet(text: Text, insertPoint: { parent: Node; before: Node | null }) {
    if (!text.textContent) return
    const match = text.textContent.match(/^-\s?/)
    if (!match) return
    text.textContent = text.textContent.slice(match[0].length)
    const stud = STUDS[colorIndex % STUDS.length]
    colorIndex++
    const img = document.createElement('img')
    img.src = stud.src
    img.alt = ''
    img.className = 'stud-bullet'
    insertPoint.parent.insertBefore(img, insertPoint.before)
  }

  function processDiv(container: Element) {
    let lineStart: 'container' | Element = 'container'
    let atLineStart = true
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
    let node: Node | null
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if ((node as Element).tagName === 'BR') {
          atLineStart = true
          lineStart = node as Element
        }
        continue
      }
      if (!atLineStart) continue
      atLineStart = false
      const insertPoint = lineStart === 'container'
        ? { parent: container, before: container.firstChild }
        : { parent: lineStart.parentNode as Node, before: lineStart.nextSibling }
      tryBullet(node as Text, insertPoint)
    }
  }

  // Bare top-level text runs only count as a fresh line right after another
  // line boundary (the very start, a <div>, or a <br> that ended up as a
  // direct child of tmp rather than inside a div) — not after some other
  // inline element that isn't itself a line break.
  let bareLineStart = true
  for (const node of Array.from(tmp.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      if (el.tagName === 'DIV') {
        processDiv(el)
        bareLineStart = true
      } else if (el.tagName === 'BR') {
        bareLineStart = true
      } else {
        bareLineStart = false
      }
      continue
    }
    if (bareLineStart) {
      bareLineStart = false
      tryBullet(node as Text, { parent: tmp, before: node })
    }
  }

  return tmp.innerHTML
}
