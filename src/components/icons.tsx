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
export function PlaceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
export function GratitudeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20.5S3.5 15.4 3.5 9.4A4.9 4.9 0 0 1 12 6a4.9 4.9 0 0 1 8.5 3.4c0 6-8.5 11.1-8.5 11.1Z" />
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
export function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a9 8.5 0 1 0 0 17c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H16a5 4.5 0 0 0 5-4.5C21 5.8 17 3 12 3Z" />
      <circle cx="7.5" cy="11" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="7" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="7" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="11" r="1.15" fill="currentColor" stroke="none" />
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
  gratitude: GratitudeIcon,
}

export const BLOCK_COLORS: Record<string, { fg: string; soft: string }> = {
  photo: { fg: 'var(--block-photo)', soft: 'var(--block-photo-soft)' },
  note: { fg: 'var(--block-note)', soft: 'var(--block-note-soft)' },
  place: { fg: 'var(--block-place)', soft: 'var(--block-place-soft)' },
  meal: { fg: 'var(--block-meal)', soft: 'var(--block-meal-soft)' },
  movie: { fg: 'var(--block-movie)', soft: 'var(--block-movie-soft)' },
  person: { fg: 'var(--block-person)', soft: 'var(--block-person-soft)' },
  gratitude: { fg: 'var(--block-gratitude)', soft: 'var(--block-gratitude-soft)' },
}

export const BLOCK_LABELS: Record<string, string> = {
  photo: 'Photo',
  note: 'Note',
  place: 'Place',
  meal: 'Meal',
  movie: 'Movie',
  person: 'Person',
  gratitude: 'Gratitude',
}
