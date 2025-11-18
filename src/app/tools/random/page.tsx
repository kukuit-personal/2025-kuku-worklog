'use client'

import { useEffect, useRef, useState } from 'react'

const BG_COLORS = [
  'bg-slate-900',
  'bg-indigo-900',
  'bg-emerald-900',
  'bg-rose-900',
  'bg-amber-800',
  'bg-teal-900',
  'bg-purple-900',
  'bg-cyan-900',
]

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function RandomPage() {
  const [num, setNum] = useState(5)
  const [time, setTime] = useState(1)
  const [current, setCurrent] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [bgClass, setBgClass] = useState<string>('bg-slate-900')

  const randomIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const pickRandomBg = (prev: string) => {
    const otherColors = BG_COLORS.filter((c) => c !== prev)
    return otherColors[Math.floor(Math.random() * otherColors.length)] ?? prev
  }

  const doRandom = () => {
    const safeNum = Math.min(10, Math.max(1, num))
    const value = Math.floor(Math.random() * safeNum) + 1
    setCurrent(value)
    setBgClass((prev) => pickRandomBg(prev))
  }

  const clearAll = () => {
    if (randomIntervalRef.current) clearInterval(randomIntervalRef.current)
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    randomIntervalRef.current = null
    timerIntervalRef.current = null
  }

  const start = () => {
    if (running) return

    clearAll()
    setElapsed(0)
    setRunning(true)
    doRandom()

    timerIntervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)

    randomIntervalRef.current = setInterval(
      () => {
        doRandom()
      },
      Math.min(10, Math.max(1, time)) * 1000
    )
  }

  const stop = () => {
    setRunning(false)
    clearAll()
  }

  useEffect(() => {
    return () => clearAll()
  }, [])

  return (
    <div className={`min-h-screen flex flex-col ${bgClass} text-white`}>
      {/* Header */}
      <div className="w-full px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-black/40 backdrop-blur">
        <h1 className="text-xl font-semibold">Random Number</h1>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex flex-col text-xs">
            <span className="uppercase tracking-wide text-gray-300">Elapsed</span>
            <span className="text-lg font-semibold">{formatElapsed(elapsed)}</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs uppercase text-gray-300">Num</label>
            <input
              type="number"
              min={1}
              max={10}
              value={num}
              onChange={(e) => setNum(Number(e.target.value))}
              disabled={running}
              className="w-16 rounded-md border border-white/30 bg-black/40 px-2 py-1 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs uppercase text-gray-300">Time (s)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={time}
              onChange={(e) => setTime(Number(e.target.value))}
              disabled={running}
              className="w-20 rounded-md border border-white/30 bg-black/40 px-2 py-1 text-sm"
            />
          </div>

          {!running ? (
            <button
              onClick={start}
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold hover:bg-emerald-600"
            >
              Start
            </button>
          ) : (
            <button
              onClick={stop}
              className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold hover:bg-red-600"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* FULLSCREEN BIG NUMBER */}
      <div className="flex-1 flex items-center justify-center px-4">
        <span className="text-white font-black select-none text-[120vw] leading-none">
          {current ?? '0'}
        </span>
      </div>
    </div>
  )
}
