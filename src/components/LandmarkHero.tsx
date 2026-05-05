'use client'

import { useState, useRef, useEffect } from 'react'
import { Property } from '@/lib/supabase'

interface Props {
  properties: Property[]
}

// The pala.svg has viewBox "0 0 690 730"
const SVG_W = 690
const SVG_H = 730

function PinShape({ cx, cy }: { cx: number; cy: number }) {
  const r = 10
  const tipLen = 7
  return (
    <g style={{ cursor: 'pointer' }}>
      <ellipse cx={cx} cy={cy + r + tipLen + 2} rx={6} ry={2.5} fill="rgba(0,0,0,0.15)" />
      <circle cx={cx} cy={cy} r={r} fill="#D4735E" stroke="white" strokeWidth={2} />
      <path d={`M ${cx - 5} ${cy + r * 0.6} L ${cx} ${cy + r + tipLen} L ${cx + 5} ${cy + r * 0.6}`} fill="#D4735E" stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={3.5} fill="white" />
    </g>
  )
}

export default function LandmarkHero({ properties }: Props) {
  const [tooltip, setTooltip] = useState<Property | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTooltip(null)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: 'clamp(320px, 60vw, 520px)', overflow: 'hidden', backgroundColor: '#f2ead4' }}
    >
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="xMidYMin slice"
        style={{ width: '100%', height: '100%', display: 'block' }}
        onClick={() => setTooltip(null)}
      >
        <image
          href="/illustrations/landmarks/pala.svg"
          x={0}
          y={0}
          width={SVG_W}
          height={SVG_H}
          preserveAspectRatio="xMidYMid meet"
        />

        {properties.map((p) => (
          <g
            key={p.id}
            onClick={(e) => {
              e.stopPropagation()
              setTooltip(tooltip?.id === p.id ? null : p)
            }}
          >
            <PinShape cx={p.map_pin_x} cy={p.map_pin_y} />
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: `${(tooltip.map_pin_x / SVG_W) * 100}%`,
            top: `${(tooltip.map_pin_y / SVG_H) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 20px))',
            backgroundColor: 'white',
            borderRadius: 12,
            border: '1px solid #D6C9B8',
            padding: '10px 14px',
            zIndex: 20,
            minWidth: 170,
            boxShadow: '0 4px 16px rgba(44,26,14,0.12)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 10, height: 10, backgroundColor: 'white', border: '1px solid #D6C9B8', borderTop: 'none', borderLeft: 'none' }} />
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: '#2C1A0E', fontWeight: 600, marginBottom: 2 }}>{tooltip.name}</p>
          <p style={{ fontSize: 11, color: '#7C5C3E' }}>{tooltip.price_guide}</p>
        </div>
      )}
    </div>
  )
}
