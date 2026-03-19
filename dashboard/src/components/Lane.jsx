import { motion, AnimatePresence } from 'framer-motion'
import { TaskCard } from './TaskCard.jsx'

const LANE_CONFIG = {
  waiting: {
    label: 'WAITING QUEUE',
    accent: 'var(--amber)',
    accentRaw: '#ff8c00',
    icon: '◫',
    tag: 'FIFO',
    emptyMsg: 'Queue is clear',
  },
  processing: {
    label: 'PROCESSING',
    accent: '#ffb347',
    accentRaw: '#ffb347',
    icon: '◉',
    tag: 'ACTIVE',
    emptyMsg: 'No active tasks',
  },
  completed: {
    label: 'COMPLETED',
    accent: '#39d353',
    accentRaw: '#39d353',
    icon: '◼',
    tag: 'DONE',
    emptyMsg: 'Nothing finished yet',
  },
}

const DELAY = { waiting: 0, processing: 0.1, completed: 0.2 }

export function Lane({ type, tasks }) {
  const cfg = LANE_CONFIG[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: DELAY[type], duration: 0.5 }}
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(10,16,26,0.75)',
        border: '1px solid var(--border-dim)',
        borderTop: `2px solid ${cfg.accentRaw}`,
        borderRadius: 2,
        overflow: 'hidden',
        maxHeight: 'calc(100vh - 130px)',
      }}
    >
      {/* Lane header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: `${cfg.accentRaw}08`,
        borderBottom: '1px solid var(--border-dim)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.span
            animate={type === 'processing' ? { opacity: [1, 0.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.1 }}
            style={{ color: cfg.accentRaw, fontSize: 12 }}
          >{cfg.icon}</motion.span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: 3,
            color: cfg.accentRaw,
            fontWeight: 600,
          }}>{cfg.label}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            letterSpacing: 2,
            color: `${cfg.accentRaw}70`,
            padding: '1px 6px',
            border: `1px solid ${cfg.accentRaw}25`,
          }}>{cfg.tag}</span>
          <motion.span
            key={tasks.length}
            initial={{ scale: 1.5, color: cfg.accentRaw }}
            animate={{ scale: 1, color: 'var(--white-dim)' }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              letterSpacing: 2,
              minWidth: 28,
              textAlign: 'right',
              color: cfg.accentRaw,
              textShadow: `0 0 10px ${cfg.accentRaw}50`,
            }}
          >{tasks.length}</motion.span>
        </div>
      </div>

      {/* Task list */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '12px 12px' }}>
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'rgba(232,237,245,0.15)',
                letterSpacing: 2,
                paddingTop: 48,
                textTransform: 'uppercase',
              }}
            >— {cfg.emptyMsg} —</motion.div>
          ) : (
            tasks.map((task, i) => (
              <TaskCard key={task.taskId} task={task} index={i} />
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
