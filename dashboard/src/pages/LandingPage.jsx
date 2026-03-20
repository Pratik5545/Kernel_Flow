import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = `${import.meta.env.VITE_API_URL}/api/tasks`

export default function LandingPage() {
  const navigate = useNavigate()
  const [priority, setPriority] = useState(1)
  const [complexity, setComplexity] = useState(3.0)
  const [logs, setLogs] = useState([{ ts: '--:--:--', msg: 'System ready. Awaiting task submission.', type: 'info' }])
  const [stats, setStats] = useState({ total: 0, ok: 0, fail: 0, lastEst: '—' })
  const [connStatus, setConnStatus] = useState({ text: '● CONNECTING', color: '#ffb347' })
  const [loading, setLoading] = useState(false)
  const [clock, setClock] = useState('')
  const nameRef = useRef()
  const typeRef = useRef()

  useEffect(() => {
    const tick = () => setClock(new Date().toUTCString().split(' ')[4] + ' UTC')
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${API}/queue-status`, { signal: AbortSignal.timeout(3000) })
        if (r.ok) setConnStatus({ text: '● SYSTEMS NOMINAL', color: '#39d353' })
        else setConnStatus({ text: '● ERROR', color: '#ff3b3b' })
      } catch { setConnStatus({ text: '● OFFLINE', color: '#ff3b3b' }) }
    }
    check(); const id = setInterval(check, 8000); return () => clearInterval(id)
  }, [])

  function addLog(msg, type) {
    const now = new Date()
    const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
    setLogs(prev => [...prev.slice(-29), { ts, msg, type }])
  }

  async function submitTask() {
    const name = nameRef.current.value.trim()
    const type = typeRef.current.value
    if (!name) { addLog('✗ Task designation is required', 'err'); return }

    setLoading(true)
    addLog(`→ Dispatching: "${name}" [${type}] P${priority} C${complexity}`, 'info')

    try {
      const res = await fetch(`${API}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Name: name, Type: type, Priority: priority, Complexity: complexity })
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`) }
      const data = await res.json()
      addLog(`✓ Accepted — ID: ${data.taskId}`, 'ok')
      if (data.estimatedTimeSeconds) {
        addLog(`⟁ AI estimate: ~${data.estimatedTimeSeconds.toFixed(1)}s`, 'warn')
        setStats(s => ({ ...s, total: s.total+1, ok: s.ok+1, lastEst: `~${data.estimatedTimeSeconds.toFixed(1)}s` }))
      } else {
        addLog('⟁ AI prediction in progress...', 'warn')
        setStats(s => ({ ...s, total: s.total+1, ok: s.ok+1 }))
      }
      nameRef.current.value = ''
    } catch(err) {
      addLog(`✗ Dispatch failed: ${err.message}`, 'err')
      setStats(s => ({ ...s, total: s.total+1, fail: s.fail+1 }))
    } finally { setLoading(false) }
  }

  const logColors = { ok: '#39d353', err: '#ff3b3b', info: 'rgba(232,237,245,0.45)', warn: '#ffb347' }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-mono)', background: 'var(--navy)' }}>

      {/* Topbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 52, background: 'rgba(8,12,24,0.97)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 5,
              color: 'var(--amber)', textShadow: '0 0 20px var(--amber-glow)' }}>KERNELFLOW</div>
            <div style={{ fontSize: 8, letterSpacing: 3, color: 'var(--white-dim)', textTransform: 'uppercase' }}>
              Async Task Orchestrator</div>
          </div>
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
          <div style={{ fontSize: 10, color: '#ffb347', letterSpacing: 2 }}>MIS-2026-03 · NODE-01</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: connStatus.color,
            padding: '4px 12px', border: `1px solid ${connStatus.color}40` }}>{connStatus.text}</div>
          <div style={{ fontSize: 11, color: 'var(--white-dim)', letterSpacing: 1 }}>{clock}</div>
        </div>
      </nav>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 220px', minHeight: 'calc(100vh - 52px)' }}>

        {/* LEFT */}
        <aside style={{ borderRight: '1px solid var(--border-dim)', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: 'var(--amber)', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 10 }}>
              TELEMETRY <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            {[
              { label: 'Total Dispatched', value: stats.total, color: 'var(--amber)' },
              { label: 'Accepted', value: stats.ok, color: '#39d353' },
            ].map(t => (
              <div key={t.label} style={{ background: 'var(--navy-2)', border: '1px solid var(--border-dim)',
                borderLeft: `2px solid ${t.color}`, padding: '12px 14px', marginBottom: 10 }}>
                <div style={{ fontSize: 8, letterSpacing: 2, color: 'var(--white-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: t.color, letterSpacing: 2 }}>{t.value}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: 'var(--amber)', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 10 }}>
              SUBSYSTEMS <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            {[
              { name: '.NET ORCH', status: connStatus.text.includes('NOMINAL') ? '● ONLINE' : '✕ OFFLINE', ok: connStatus.text.includes('NOMINAL') },
              { name: 'AI SERVICE', status: '● ONLINE', ok: true },
              { name: 'SIGNALR HUB', status: '◌ STANDBY', ok: null },
              { name: 'FIFO DSA', status: '● ACTIVE', ok: true },
            ].map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between',
                padding: '7px 10px', background: 'var(--navy-2)', border: '1px solid var(--border-dim)',
                marginBottom: 6, fontSize: 10 }}>
                <span style={{ color: 'var(--white-dim)', letterSpacing: 1 }}>{s.name}</span>
                <span style={{ color: s.ok === true ? '#39d353' : s.ok === false ? '#ff3b3b' : '#ffb347', letterSpacing: 1 }}>{s.status}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER */}
        <main style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(42px,5vw,64px)',
              letterSpacing: 8, color: 'var(--white)', lineHeight: 1 }}>
              TASK <span style={{ color: 'var(--amber)' }}>DISPATCH</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--white-dim)', letterSpacing: 3, textTransform: 'uppercase', marginTop: 6 }}>
              Asynchronous Queue Submission Interface</div>
          </div>

          {/* Boot log */}
          <div style={{ background: 'var(--navy-2)', border: '1px solid var(--border-dim)', borderTop: '2px solid var(--amber)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px',
              background: 'rgba(255,140,0,0.06)', borderBottom: '1px solid var(--border-dim)' }}>
              <span style={{ fontSize: 9, letterSpacing: 3, color: 'var(--amber)', textTransform: 'uppercase' }}>Init Sequence</span>
              <span style={{ fontSize: 9, color: 'var(--white-dim)' }}>STDOUT · RAW</span>
            </div>
            <div style={{ padding: '14px 18px', fontSize: 11, lineHeight: 1.9 }}>
              {[
                { c: '#39d353', t: '[  OK  ]', m: ' KernelFlow Orchestrator v1.0 — boot complete' },
                { c: '#39d353', t: '[  OK  ]', m: ' FIFO queue initialized — LinkedList<KernelTask>' },
                { c: '#39d353', t: '[  OK  ]', m: ' AI predictor linked — heuristic-v1.2 loaded' },
                { c: '#ffb347', t: '[ WAIT ]', m: ' SignalR handshake pending — hub /hubs/tasks' },
              ].map((l, i) => (
                <div key={i}><span style={{ color: l.c }}>{l.t}</span><span style={{ color: 'var(--white-dim)' }}>{l.m}</span></div>
              ))}
              <div><span style={{ color: '#4a90d9' }}>root@kernelflow</span><span style={{ color: 'var(--white-dim)' }}>:~$ ready for task submission</span></div>
            </div>
          </div>

          {/* Form */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: 'var(--amber)', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 10 }}>
              TASK PARAMETERS <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: 8, letterSpacing: 3, color: 'var(--amber)', marginBottom: 6, textTransform: 'uppercase' }}>Task Designation</div>
                <input ref={nameRef} placeholder="e.g. Matrix Inversion · DB Sync · Model Inference"
                  onKeyDown={e => e.key === 'Enter' && submitTask()}
                  style={{ width: '100%', background: 'var(--navy-3)', border: '1px solid var(--border-dim)',
                    borderBottom: '1px solid var(--amber)', color: 'var(--white)', fontFamily: 'var(--font-mono)',
                    fontSize: 12, padding: '10px 14px', outline: 'none' }} />
              </div>

              <div>
                <div style={{ fontSize: 8, letterSpacing: 3, color: 'var(--amber)', marginBottom: 6, textTransform: 'uppercase' }}>Task Classification</div>
                <select ref={typeRef} style={{ width: '100%', background: 'var(--navy-3)', border: '1px solid var(--border-dim)',
                  borderBottom: '1px solid var(--amber)', color: 'var(--white)', fontFamily: 'var(--font-mono)',
                  fontSize: 12, padding: '10px 14px', outline: 'none', appearance: 'none' }}>
                  {['CPU — Compute Intensive','IO — Disk / File Ops','MEMORY — RAM Pressure','NETWORK — Fetch / Stream','GPU — Parallel Compute']
                    .map((o,i) => <option key={i} value={['CPU','IO','MEMORY','NETWORK','GPU'][i]}>{o}</option>)}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 8, letterSpacing: 3, color: 'var(--amber)', marginBottom: 6, textTransform: 'uppercase' }}>Priority Level</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1,2,3,4,5].map(p => (
                    <button key={p} onClick={() => setPriority(p)}
                      style={{ flex: 1, padding: '8px 4px', border: '1px solid',
                        borderColor: priority === p ? 'var(--amber)' : 'var(--border-dim)',
                        background: priority === p ? 'var(--amber-dim)' : 'transparent',
                        color: priority === p ? 'var(--amber)' : 'var(--white-dim)',
                        fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer',
                        boxShadow: priority === p ? '0 0 10px var(--amber-glow)' : 'none' }}>
                      P{p}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: 8, letterSpacing: 3, color: 'var(--amber)', marginBottom: 6, textTransform: 'uppercase' }}>
                  Complexity Factor</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <input type="range" min="0.1" max="10" step="0.1" value={complexity}
                    onChange={e => setComplexity(parseFloat(e.target.value))}
                    style={{ flex: 1, height: 3, accentColor: 'var(--amber)', cursor: 'pointer' }} />
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--amber)',
                    letterSpacing: 2, minWidth: 48, textAlign: 'right' }}>{complexity.toFixed(1)}</div>
                </div>
              </div>
            </div>

            <button onClick={submitTask} disabled={loading}
              style={{ width: '100%', padding: '14px 24px', background: loading ? 'rgba(255,140,0,0.5)' : 'var(--amber)',
                color: 'var(--navy)', fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 6,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}>
              {loading ? 'TRANSMITTING...' : 'ENQUEUE TASK'}
            </button>

            {/* Log */}
            <div style={{ marginTop: 16, maxHeight: 120, overflowY: 'auto', background: 'var(--navy-2)',
              border: '1px solid var(--border-dim)', padding: '10px 14px' }}>
              {logs.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, fontSize: 10, lineHeight: 1.8 }}>
                  <span style={{ color: 'rgba(255,140,0,0.4)', minWidth: 60 }}>{l.ts}</span>
                  <span style={{ color: logColors[l.type] }}>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* RIGHT */}
        <aside style={{ borderLeft: '1px solid var(--border-dim)', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: 'var(--amber)', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 10 }}>
              SIGNAL <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ background: 'var(--navy-2)', border: '1px solid var(--border-dim)', padding: 18,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 8, letterSpacing: 3, color: 'var(--amber)', textTransform: 'uppercase' }}>AI Predictor</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 40 }}>
                {[30,55,80,60,95,45].map((h, i) => (
                  <div key={i} style={{ width: 12, height: `${h}%`, background: 'var(--amber)',
                    borderRadius: 1, boxShadow: '0 0 8px var(--amber-glow)',
                    animation: `pulse ${1.5 + i*0.1}s ease infinite`,
                    opacity: 0.4 + i * 0.1 }} />
                ))}
              </div>
              <div style={{ fontSize: 9, letterSpacing: 2, color: '#39d353' }}>:8000 NOMINAL</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: 'var(--amber)', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 10 }}>
              MISSION STATS <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            {[
              { label: 'Total Dispatched', value: stats.total, color: 'var(--amber)' },
              { label: 'Accepted', value: stats.ok, color: '#39d353' },
              { label: 'Rejected', value: stats.fail, color: '#ff3b3b' },
              { label: 'Last AI Estimate', value: stats.lastEst, color: '#4a90d9' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--navy-2)', border: '1px solid var(--border-dim)',
                padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ fontSize: 8, letterSpacing: 2, color: 'var(--white-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: 3, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 16px', background: 'transparent', border: '1px solid var(--amber)',
              color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2,
              cursor: 'pointer', textTransform: 'uppercase', marginTop: 'auto',
              transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--amber-dim)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            ⟶ LIVE DASHBOARD
          </button>
        </aside>
      </div>
    </div>
  )
}