export function PhotoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8a2 2 0 0 1 2-2h1.2l1-1.6h7.6l1 1.6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  )
}
export function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4.5 19 9l-9.5 9.5-5 1 1-5Z" />
    </svg>
  )
}
export function PlaceIcon({ color }: { color?: string } = {}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={color ? { color } : undefined}>
      <path d="M12 21s-6.5-6.1-6.5-11A6.5 6.5 0 0 1 18.5 10c0 4.9-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  )
}
export function MealIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3v7a2 2 0 0 0 2 2v9M7 3v6M9 3v6M11 3v7M17 3c-1.7 0-3 2-3 5s1.3 5 3 5v8" />
    </svg>
  )
}
export function MovieIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5 5 4h3l-1.6 4.5M9 8.5 10.6 4h3l-1.6 4.5M15.6 8.5 17.2 4H20l-2 4.5M3 8.5h18v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  )
}
export function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10.5" cy="8.5" r="3.75" />
      <path d="M3.5 20c1.2-3.8 3.8-5.6 7-5.6M18 8v6M15 11h6" />
    </svg>
  )
}
export function ChevronIcon() {
  return (
    <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}
export function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l5 5L20 6" />
    </svg>
  )
}
export function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5 8 12l7 7" />
    </svg>
  )
}
export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
export function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4.5 1.5L5 15Z" />
      <path d="M14.5 5.5l3 3" />
    </svg>
  )
}
export function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </svg>
  )
}
export function UnlockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 7.5-1.9" />
    </svg>
  )
}
export function StarIcon({ filled = true }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M12 2.5 15 9l7 1-5.2 5 1.3 7-6.1-3.4L5.9 22l1.3-7L2 10l7-1Z" />
    </svg>
  )
}
export function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.3" />
    </svg>
  )
}
export function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    </svg>
  )
}
export function HeadlineTypeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 5v14M19 5v14M5 12h14" />
    </svg>
  )
}
export function LabelTypeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 11.5 3H19a2 2 0 0 1 2 2v7.5l-8.5 8.5a1.5 1.5 0 0 1-2 0L3 13.5a1.5 1.5 0 0 1 0-2Z" />
      <circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}
export function StickerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h9a2 2 0 0 1 2 2v9l-6 6H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M17 15h-3a2 2 0 0 0-2 2v4" />
    </svg>
  )
}
export function JournalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 1 5 19.5Z" />
      <path d="M9 8h7M9 12h7M9 16h4" />
    </svg>
  )
}
export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </svg>
  )
}

export const BLOCK_ICONS: Record<string, () => React.ReactElement> = {
  photo: PhotoIcon,
  note: NoteIcon,
  place: PlaceIcon,
  meal: MealIcon,
  movie: MovieIcon,
  person: PersonIcon,
  sticker: StickerIcon,
  journal: JournalIcon,
  headline: HeadlineTypeIcon,
  label: LabelTypeIcon,
}

export const BLOCK_COLORS: Record<string, { fg: string; soft: string }> = {
  photo: { fg: 'var(--block-photo)', soft: 'var(--block-photo-soft)' },
  note: { fg: 'var(--block-note)', soft: 'var(--block-note-soft)' },
  place: { fg: 'var(--block-place)', soft: 'var(--block-place-soft)' },
  meal: { fg: 'var(--block-meal)', soft: 'var(--block-meal-soft)' },
  movie: { fg: 'var(--block-movie)', soft: 'var(--block-movie-soft)' },
  person: { fg: 'var(--block-person)', soft: 'var(--block-person-soft)' },
  sticker: { fg: 'var(--block-sticker)', soft: 'var(--block-sticker-soft)' },
  journal: { fg: 'var(--block-journal)', soft: 'var(--block-journal-soft)' },
  headline: { fg: 'var(--ink)', soft: 'var(--kraft-light)' },
  label: { fg: 'var(--ink)', soft: 'var(--kraft-light)' },
}

export const BLOCK_LABELS: Record<string, string> = {
  photo: 'Photo',
  note: 'Note',
  place: 'Place',
  meal: 'Meal',
  movie: 'Movie',
  person: 'Person',
  sticker: 'Sticker',
  journal: 'Journal',
  headline: 'Headline',
  label: 'Label',
}
