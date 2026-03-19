import { motion } from 'framer-motion'

const TYPE_CONFIG = {
  CPU:     { color: '#ff8c00', label: 'CPU',  icon: '▣' },
  IO:      { color: '#4a90d9', label: 'I/O',  icon: '◈' },
  MEMORY:  { color: '#a55eea', label: 'MEM',  icon: '▦' },
  NETWORK: { color: '#39d353', label: 'NET',  icon: '◎' },
  GPU:     { color: '#ff3b3b', label: 'GPU',  icon: '◉' },
}

const STATUS_BORDER = {
  Waiting:    'rgba(255,140,0,0.2)',
  Processing: 'rgba(255,179,71,0.5)',
  Completed:  'rgba(57,211,83,0.35)',
  Failed:     'rgba(255,59,59,0.45)',
}

function formatTime(s) {
  if (!s || s <= 0) return '—'
  return s >= 60 ? `${(s/60).toFixed(1)}m` : `${s.toFixed(1)}s`
}

export function TaskCard({ task, index }) {
  const type   = TYPE_CONFIG[task.type]   ?? TYPE_CONFIG.CPU
  const border = STATUS_BORDER[task.status] ?? STATUS_BORDER.Waiting
  const isProcessing = task.status === 'Processing'

  return (
    <motion.div
      layout
      layoutId={task.taskId}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26, delay: index * 0.03 }}
      style={{
        background: 'rgba(13,20,37,0.95)',
        border: `1px solid ${border}`,
        borderLeft: `3px solid ${type.color}`,
        borderRadius: 2,
        padding: '11px 14px',
        marginBottom: 8,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
      whileHover={{
        background: 'rgba(17,28,48,0.98)',
        boxShadow: `0 2px 20px rgba(0,0,0,0.5), 0 0 8px ${type.color}22`,
      }}
    >
      {/* Processing sweep */}
      {isProcessing && (
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '45%', height: '100%',
            background: `linear-gradient(90deg, transparent, ${type.color}14, transparent)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Top row — type badge + ID */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: type.color, fontSize: 12 }}>{type.icon}</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: type.color,
            background: `${type.color}16`,
            border: `1px solid ${type.color}30`,
            padding: '2px 7px',
            letterSpacing: 2,
          }}>{type.label}</span>
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--white-dim)',
          letterSpacing: 1,
        }}>#{task.taskId}</span>
      </div>

      {/* Task name */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        fontSize: 12,
        color: 'var(--white)',
        marginBottom: 9,
        letterSpacing: 0.5,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>{task.name || 'Unnamed Task'}</div>

      {/* Bottom row — priority + estimate */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

        {/* Priority bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 12 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{
              width: 4,
              height: `${40 + i * 12}%`,
              background: i <= task.priority ? 'var(--amber)' : 'var(--border-dim)',
              boxShadow: i <= task.priority ? '0 0 4px var(--amber-glow)' : 'none',
              borderRadius: 1,
            }} />
          ))}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            color: 'var(--amber)',
            letterSpacing: 1,
            marginLeft: 4,
          }}>P{task.priority}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {task.complexityLabel && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              color: 'var(--white-dim)',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}>{task.complexityLabel}</span>
          )}
          {task.estimatedTimeSeconds && task.estimatedTimeSeconds > 0 && (
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              color: 'var(--amber)',
              letterSpacing: 2,
              textShadow: '0 0 8px var(--amber-glow)',
            }}>~{formatTime(task.estimatedTimeSeconds)}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
