import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const STATE_COLOR = {
  Connected:    '#39d353',
  Connecting:   '#ffb347',
  Reconnecting: '#ffb347',
  Disconnected: '#ff3b3b',
}

export function StatusBar({ connectionState, snapshot }) {
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toUTCString().split(' ')[4] + ' UTC')
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const color = STATE_COLOR[connectionState] ?? '#ffb347'
  const total     = (snapshot.waiting?.length    ?? 0)
                  + (snapshot.processing?.length ?? 0)
                  + (snapshot.completed?.length  ?? 0)

  const stats = [
    { label: 'TOTAL',   value: total,                             color: 'var(--amber)' },
    { label: 'WAITING', value: snapshot.waiting?.length    ?? 0, color: 'var(--white)' },
    { label: 'ACTIVE',  value: snapshot.processing?.length ?? 0, color: '#ffb347' },
    { label: 'DONE',    value: snapshot.completed?.length  ?? 0, color: '#39d353' },
  ]

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      height: 52,
      background: 'rgba(8,12,24,0.97)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexShrink: 0,
    }}>
      {/* Left — brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            letterSpacing: 5,
            color: 'var(--amber)',
            textShadow: '0 0 20px var(--amber-glow)',
            lineHeight: 1,
          }}>KERNELFLOW</div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            letterSpacing: 3,
            color: 'var(--white-dim)',
            textTransform: 'uppercase',
          }}>Live Queue Visualizer</div>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <motion.div
                key={s.value}
                initial={{ y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 38,
                  color: s.color,
                  letterSpacing: 2,
                  lineHeight: 1,
                  textShadow: s.color === 'var(--amber)' ? '0 0 12px var(--amber-glow)' : 'none',
                }}
              >{s.value}</motion.div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 7,
                letterSpacing: 2,
                color: 'var(--white-dim)',
                marginTop: 2,
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — connection + clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Connection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.div
            animate={connectionState === 'Connected'
              ? { scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }
              : { opacity: [1, 0.2, 1] }
            }
            transition={{ repeat: Infinity, duration: connectionState === 'Connected' ? 2.5 : 0.7 }}
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: color,
              boxShadow: `0 0 10px ${color}`,
            }}
          />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color,
            letterSpacing: 1.5,
          }}>{connectionState.toUpperCase()}</span>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

        {/* Clock */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--white-dim)',
          letterSpacing: 1,
        }}>{clock}</div>
      </div>
    </header>
  )
}
