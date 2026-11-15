import React from 'react'

// Shared design tokens for Theeram — aligned with DESIGN_SYSTEM.md
export const C = {
  // Primary Brand Palette
  lime:       '#78E040',
  limeDark:   '#58C922',
  limePill:   '#C4F596',
  green:      '#173B13', // Olive Garden
  green2:     '#0F290C', // Deep Olive
  cream:      '#F4F5F3', // Gray Storm Light
  cream2:     '#EAECE8',
  cream3:     '#DCE0D8',
  gold:       '#FCE08B', // Orange Juice (Warm Butter)
  butter:     '#FCE08B',
  butterSoft: '#FEF3D1',
  lavender:   '#E5DDF5', // Lavender Tea
  mintTint:   '#EDFCE6',
  terra:      '#173B13', // Olive Garden accent for high-contrast links/labels
  sage:       '#F4F5F3', // Clean Gray Storm canvas for listing grids
  dark:       '#111211', // Gray Storm Dark (Ink)
  text:       '#111211',
  muted:      '#525750',
  chip:       '#EAECE8',
  wa:         '#25D366',
}

export const display: React.CSSProperties = {
  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
  letterSpacing: '-0.025em',
}
// Keep `serif` alias so existing components inherit Montserrat display typography seamlessly
export const serif: React.CSSProperties = display
export const sans: React.CSSProperties = {
  fontFamily: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif',
}

// Section label with >> tone-of-voice chevron
export function SectionLabel({ ml, style }: { ml: string; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      <span style={{ ...display, fontSize: 11, fontWeight: 900, color: C.limeDark, flexShrink: 0 }}>&gt;&gt;</span>
      <span style={{ ...sans, fontSize: 10.5, fontWeight: 700, color: C.green, letterSpacing: '.08em', textTransform: 'uppercase' }}>{ml}</span>
      <div style={{ flex: 1, height: 1, background: C.cream3 }} />
    </div>
  )
}

// Lime/Butter section label (for dark Olive Garden bg sections)
export function GoldLabel({ ml, style }: { ml: string; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      <span style={{ ...display, fontSize: 11, fontWeight: 900, color: C.lime, flexShrink: 0 }}>&gt;&gt;</span>
      <span style={{ ...sans, fontSize: 10.5, fontWeight: 700, color: C.lime, letterSpacing: '.08em', textTransform: 'uppercase' }}>{ml}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.16)' }} />
    </div>
  )
}
