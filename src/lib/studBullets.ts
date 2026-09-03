import { STUDS } from './studs'

// Purely presentational — this never touches what's actually stored for a
// block, only the HTML handed to dangerouslySetInnerHTML for display, so
// re-opening the entry to edit it still shows the plain "-" you typed.
//
// A "line" here means: the start of a top-level <div> (contentEditable
// wraps each Enter-separated paragraph in one), OR right after a <br>
// (a Shift+Enter soft break *inside* a paragraph — "Items to bring:" then
// "-laptop" on the next line of the same paragraph is exactly this case,
// and needs its own bullet just like a line in its own <div> would).
export function renderStudBullets(html: string): string {
  if (!html.includes('-')) return html
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  let containers = Array.from(tmp.children).filter((el): el is HTMLElement => el.tagName === 'DIV')
  if (containers.length === 0) containers = [tmp]

  let colorIndex = 0

  for (const container of containers) {
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
      const text = node as Text
      if (!text.textContent) continue
      const match = text.textContent.match(/^-\s?/)
      if (!match) continue

      text.textContent = text.textContent.slice(match[0].length)
      const stud = STUDS[colorIndex % STUDS.length]
      colorIndex++
      const img = document.createElement('img')
      img.src = stud.src
      img.alt = ''
      img.className = 'stud-bullet'
      if (lineStart === 'container') {
        container.insertBefore(img, container.firstChild)
      } else {
        lineStart.parentNode?.insertBefore(img, lineStart.nextSibling)
      }
    }
  }
  return tmp.innerHTML
}
