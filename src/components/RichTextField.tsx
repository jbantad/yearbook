import { useEffect, useRef } from 'react'

// A small formatting toolbar over a contentEditable div. Deliberately
// uncontrolled during typing — resetting innerHTML from React state on every
// keystroke would reset the cursor position — so the DOM is the source of
// truth while focused, and onChange just mirrors it out as HTML.
export function RichTextField({
  html,
  onChange,
  placeholder,
  minHeight = 64,
}: {
  html: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML === '') {
      ref.current.innerHTML = html
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function exec(command: string) {
    ref.current?.focus()
    document.execCommand(command)
    onChange(ref.current?.innerHTML ?? '')
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
    onChange(ref.current?.innerHTML ?? '')
  }

  return (
    <div className="rtf">
      <div className="rtf-toolbar">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')} aria-label="Bold">
          <b>B</b>
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')} aria-label="Italic">
          <i>I</i>
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')} aria-label="Underline">
          <u>U</u>
        </button>
      </div>
      <div
        ref={ref}
        className="rtf-input"
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        style={{ minHeight }}
      />
    </div>
  )
}

// contentEditable has no native "required" validation like a textarea does,
// so callers check this before allowing submit.
export function isHtmlEmpty(html: string): boolean {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return !(tmp.textContent ?? '').trim()
}

export function AlignToggle({ align, onChange }: { align: string; onChange: (align: 'left' | 'center') => void }) {
  return (
    <div className="segmented" style={{ marginBottom: 0 }}>
      <button type="button" className={`seg${align === 'left' ? ' sel' : ''}`} onClick={() => onChange('left')}>Left</button>
      <button type="button" className={`seg${align === 'center' ? ' sel' : ''}`} onClick={() => onChange('center')}>Center</button>
    </div>
  )
}
