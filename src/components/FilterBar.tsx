'use client'

import { EventType, EVENT_TYPES, EVENT_TYPE_LABELS } from '@/lib/supabase'

export type GuestRange = 'intimate' | 'medium' | 'large' | 'grand' | ''

export const GUEST_RANGES: { value: GuestRange; label: string; min: number; max: number }[] = [
  { value: 'intimate', label: 'Up to 30', min: 0, max: 30 },
  { value: 'medium', label: '30–100', min: 30, max: 100 },
  { value: 'large', label: '100–200', min: 100, max: 200 },
  { value: 'grand', label: '200+', min: 200, max: 99999 },
]

interface Props {
  selectedEvents: EventType[]
  onToggle: (event: EventType) => void
  onReset: () => void
  selectedGuests: GuestRange
  onGuestRange: (range: GuestRange) => void
  countLabel: string
}

const pillBase: React.CSSProperties = {
  flexShrink: 0,
  padding: '9px 16px',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s',
  whiteSpace: 'nowrap',
  background: 'none',
}

export default function FilterBar({ selectedEvents, onToggle, onReset, selectedGuests, onGuestRange, countLabel }: Props) {
  return (
    <div style={{ backgroundColor: '#FAF7F2', paddingTop: 16, paddingBottom: 4 }}>

      {/* Row 1 — Occasion */}
      <p style={{ padding: '0 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7C5C3E', marginBottom: 10 }}>
        What are you celebrating?
      </p>
      <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingLeft: 24, paddingRight: 16, paddingBottom: 4 }}>
        <button onClick={onReset} style={{ ...pillBase, border: selectedEvents.length === 0 ? 'none' : '1px solid #7C5C3E', backgroundColor: selectedEvents.length === 0 ? '#D4735E' : 'transparent', color: selectedEvents.length === 0 ? 'white' : '#7C5C3E' }}>
          All
        </button>
        {EVENT_TYPES.map((event) => {
          const selected = selectedEvents.includes(event)
          return (
            <button key={event} onClick={() => onToggle(event)} style={{ ...pillBase, border: selected ? 'none' : '1px solid #7C5C3E', backgroundColor: selected ? '#D4735E' : 'transparent', color: selected ? 'white' : '#7C5C3E' }}>
              {EVENT_TYPE_LABELS[event]}
            </button>
          )
        })}
      </div>

      {/* Row 2 — Guest count — kasavu gold colour to distinguish from row 1 */}
      <p style={{ padding: '14px 16px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C9A84C' }}>
        How many guests?
      </p>
      <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingLeft: 24, paddingRight: 16, paddingBottom: 4 }}>
        <button onClick={() => onGuestRange('')} style={{ ...pillBase, border: !selectedGuests ? 'none' : '1px solid #C9A84C', backgroundColor: !selectedGuests ? '#C9A84C' : 'transparent', color: !selectedGuests ? 'white' : '#C9A84C' }}>
          Any size
        </button>
        {GUEST_RANGES.map(({ value, label }) => {
          const selected = selectedGuests === value
          return (
            <button key={value} onClick={() => onGuestRange(selected ? '' : value)} style={{ ...pillBase, border: selected ? 'none' : '1px solid #C9A84C', backgroundColor: selected ? '#C9A84C' : 'transparent', color: selected ? 'white' : '#C9A84C' }}>
              {label}
            </button>
          )
        })}
      </div>

      {/* Count */}
      <p style={{ padding: '12px 16px 0', fontSize: 11, color: '#7C5C3E' }}>{countLabel}</p>
    </div>
  )
}
