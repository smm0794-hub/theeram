// Shared design tokens for Theeram
export const C = {
  green:   '#1C3A2B',
  green2:  '#163023',
  cream:   '#F5F0E8',
  cream2:  '#EDE8DC',
  cream3:  '#E5DFD0',
  gold:    '#C9A84C',
  terra:   '#9B3D1E',
  sage:    '#D9E4DB',
  dark:    '#0F0F0D',
  text:    '#1C1C1A',
  muted:   '#6B5E4E',
  chip:    '#F0EBE0',
  wa:      '#25D366',
}

export const serif = { fontFamily: 'Georgia, serif' } as React.CSSProperties
export const sans  = { fontFamily: 'system-ui, sans-serif' } as React.CSSProperties

// Section label with Malayalam — terracotta dashes
export function SectionLabel({ ml, style }: { ml: string; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, ...style }}>
      <div style={{ width: 14, height: 1, background: C.terra, flexShrink: 0 }}/>
      <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>{ml}</span>
      <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
    </div>
  )
}

// Gold section label (for dark bg sections)
export function GoldLabel({ ml, style }: { ml: string; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, ...style }}>
      <div style={{ width: 15, height: 1, background: C.gold, flexShrink: 0 }}/>
      <span style={{ ...sans, fontSize: 10, color: C.gold, letterSpacing: '.08em' }}>{ml}</span>
      <div style={{ width: 15, height: 1, background: C.gold, flexShrink: 0 }}/>
    </div>
  )
}
