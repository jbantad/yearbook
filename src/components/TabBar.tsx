import { Link } from 'react-router-dom'
import { todayISO } from '../lib/pages'

type TabKey = 'today' | 'toc' | 'shelves'

function buildTabs(): { key: TabKey; to: string; label: string; icon: React.ReactNode }[] { return [
  {
    key: 'today',
    to: `/day/${todayISO()}`,
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
    key: 'toc',
    to: '/toc',
    label: 'Table of Contents',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
        <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
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
] }

export function TabBar({ active }: { active: TabKey }) {
  const tabs = buildTabs()
  return (
    <div className="tabbar-wrap">
      <div className="tabbar">
        {tabs.map((tab) => (
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
