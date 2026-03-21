import { useKernelQueue } from '../hooks/useKernelQueue.js'
import { Lane } from '../components/Lane.jsx'
import { StatusBar } from '../components/StatusBar.jsx'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'

async function clearCompleted() {
  await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/clear-completed`, {
    method: 'DELETE'
  })
}

function ArrowDivider({ color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, flexShrink: 0 }}>
      {[0,1,2].map(i => (
        <motion.div key={i}
          animate={{ opacity: [0.1, 0.7, 0.1], x: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.25 }}
          style={{ color, fontSize: 16 }}
        >›</motion.div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { snapshot, connectionState } = useKernelQueue()
  const navigate = useNavigate()
  const refreshRef = useRef()

  const handleClearCompleted = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/clear-completed`, {
      method: 'DELETE'
    })
    // Refetch queue status to update UI immediately
    setTimeout(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/tasks/queue-status`)
    }, 100)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <StatusBar connectionState={connectionState} snapshot={snapshot} />
      <div style={{ display: 'flex', gap: 8, padding: '8px 20px 0', flexShrink: 0 }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'transparent', border: '1px solid rgba(255,140,0,0.35)',
            color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: 2,
            padding: '5px 14px', cursor: 'pointer', textTransform: 'uppercase' }}
          onMouseEnter={e => { e.target.style.background = 'rgba(255,140,0,0.1)'; e.target.style.borderColor = 'rgba(255,140,0,0.7)' }}
          onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'rgba(255,140,0,0.35)' }}
        >← TASK DISPATCH</button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '10px 0 8px', fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: 3,
          color: 'rgba(255,140,0,0.55)', borderBottom: '1px solid var(--border-dim)', flexShrink: 0 }}
      >
        {['ENQUEUE','FIFO QUEUE','DEQUEUE','EXECUTE','COMPLETE'].map((s, i, arr) => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ letterSpacing: 3 }}>{s}</span>
            {i < arr.length - 1 && (
              <motion.span animate={{ opacity: [0.15,0.6,0.15], x: [0,3,0] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                style={{ fontSize: 16, color: 'var(--amber)' }}>→</motion.span>
            )}
          </span>
        ))}handleC
      </motion.div>

      <div style={{ display: 'flex', gap: 12, flex: 1, padding: '16px 20px', minHeight: 0, alignItems: 'stretch' }}>
        <Lane type="waiting"    tasks={snapshot.waiting    ?? []} />
        <ArrowDivider color="var(--amber)" />
        <Lane type="processing" tasks={snapshot.processing ?? []} />
        <ArrowDivider color="#ffb347" />

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
            <button onClick={clearCompleted}
              style={{ background: 'transparent', border: '1px solid rgba(255,59,59,0.35)',
                color: '#ff3b3b', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2,
                padding: '5px 14px', cursor: 'pointer', textTransform: 'uppercase' }}
              onMouseEnter={e => { e.target.style.background = 'rgba(255,59,59,0.1)' }}
              onMouseLeave={e => { e.target.style.background = 'transparent' }}
            >✕ CLEAR COMPLETED</button>
          </div>
          <Lane type="completed" tasks={snapshot.completed ?? []} />
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '8px 0 12px', fontFamily: 'var(--font-mono)',
        fontSize: 8, color: 'rgba(232,237,245,0.12)', letterSpacing: 3, flexShrink: 0,
        borderTop: '1px solid var(--border-dim)' }}>
        KERNELFLOW v1.0 · REAL-TIME QUEUE VISUALIZER · SIGNALR + .NET + PYTHON AI
      </div>
    </div>
  )
}