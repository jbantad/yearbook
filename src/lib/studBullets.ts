import { STUDS } from './studs'

// Purely presentational — this never touches what's actually stored for a
// block, only the HTML handed to dangerouslySetInnerHTML for display, so
// re-opening the entry to edit it still shows the plain "-" you typed.
//
// contentEditable puts each visual line in its own top-level <div> once
// you've pressed Enter at least once; a single-line entry has no wrapper
// div at all, so its content sits directly on the container. Both are
// treated as "one line" here.
export function renderStudBullets(html: string): string {
  if (!html.includes('-')) return html
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  let lines = Array.from(tmp.children).filter((el): el is HTMLElement => el.tagName === 'DIV')
  if (lines.length === 0) {
    // No line-wrapping <div> at all (a single-line entry, before the first
    // Enter press) — wrap everything in one so the flex-layout class added
    // below actually survives serialization. A class added straight to
    // `tmp` wouldn't: only tmp's *children* get serialized via innerHTML.
    const wrapper = document.createElement('div')
    while (tmp.firstChild) wrapper.appendChild(tmp.firstChild)
    tmp.appendChild(wrapper)
    lines = [wrapper]
  }

  let colorIndex = 0
  for (const line of lines) {
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT)
    const firstText = walker.nextNode() as Text | null
    if (!firstText?.textContent) continue
    const match = firstText.textContent.match(/^-\s?/)
    if (!match) continue

    firstText.textContent = firstText.textContent.slice(match[0].length)
    const stud = STUDS[colorIndex % STUDS.length]
    colorIndex++
    const img = document.createElement('img')
    img.src = stud.src
    img.alt = ''
    img.className = 'stud-bullet'
    line.insertBefore(img, line.firstChild)
    line.classList.add('stud-bullet-line')
  }
  return tmp.innerHTML
}
