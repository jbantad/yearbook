import { Link } from 'react-router-dom'

type TabKey = 'today' | 'calendar' | 'quests' | 'shelves' | 'profile'

const TABS: { key: TabKey; to: string; label: string; icon: React.ReactNode }[] = [
  {
    key: 'today',
    to: '/',
    label: 'Today',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8.5 5.5 4h13L21 8.5" />
        <path d="M3 8.5V18a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18V8.5" />
        <path d="M3 8.5h5.2a.5.5 0 0 1 .48.36l.7 2.28a.5.5 0 0 0 .48.36h4.28a.5.5 0 0 0 .48-.36l.7-2.28a.5.5 0 0 1 .48-.36H21" />
      </svg>
    ),
  },
  {
    key: 'calendar',
    to: '/calendar',
    label: 'Calendar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
        <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    key: 'quests',
    to: '/quests',
    label: 'Quests',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8.25" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    key: 'shelves',
    to: '/shelves',
    label: 'Shelves',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
        <path d="M3.5 10.5h17M8 3.5v7M13.5 3.5v7" />
      </svg>
    ),
  },
  {
    key: 'profile',
    to: '/people',
    label: 'You',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8.5" r="3.75" />
        <path d="M4.5 20c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6" />
      </svg>
    ),
  },
]

export function TabBar({ active }: { active: TabKey }) {
  return (
    <div className="tabbar-wrap">
      <div className="tabbar">
        {TABS.map((tab) => (
          <Link key={tab.key} to={tab.to} className={`tab ${active === tab.key ? 'on' : 'off'}`}>
            {tab.icon}
            <span>{tab.label}</span>
            <div className="dot" />
          </Link>
        ))}
      </div>
    </div>
  )
}
