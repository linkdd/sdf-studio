import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { MouseEvent, PointerEvent } from 'react'

interface Options {
  value: number
  min?: number
  max?: number
  step: number
  integer: boolean
  onChange: (value: number) => void
  setDraft: (value: string) => void
}

export function useNumberScrub({
  value,
  min,
  max,
  step,
  integer,
  onChange,
  setDraft,
}: Options) {
  const input = useRef<HTMLInputElement>(null)
  const drag = useRef<{
    pointerId: number
    target: HTMLSpanElement
    start: number
    startX: number
    lastX: number
    accumulated: number
    emitted: number
    moved: boolean
  } | null>(null)
  const frame = useRef(0)
  const pending = useRef<number | null>(null)
  const change = useRef(onChange)
  const suppressClick = useRef(false)
  const [scrubbing, setScrubbing] = useState(false)

  useLayoutEffect(() => {
    change.current = onChange
  }, [onChange])
  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const publish = useCallback(
    (next: number) => {
      setDraft(String(next))

      if (drag.current && next !== drag.current.emitted) {
        drag.current.emitted = next
        change.current(next)
      }
    },
    [setDraft]
  )

  const finish = useCallback(
    (cancel = false) => {
      const current = drag.current

      if (!current) {
        return
      }

      cancelAnimationFrame(frame.current)
      frame.current = 0

      if (cancel) {
        publish(current.start)
      } else if (pending.current !== null) {
        publish(pending.current)
      }

      pending.current = null
      drag.current = null
      setScrubbing(false)

      if (current.target.hasPointerCapture(current.pointerId)) {
        current.target.releasePointerCapture(current.pointerId)
      }
    },
    [publish]
  )

  useEffect(() => {
    if (!scrubbing) {
      return
    }

    const cancel = () => finish(true)

    window.addEventListener('blur', cancel)

    return () => window.removeEventListener('blur', cancel)
  }, [scrubbing, finish])

  function begin(event: PointerEvent<HTMLSpanElement>) {
    if (
      event.button !== 0 ||
      drag.current ||
      input.current?.matches(':disabled') ||
      !Number.isFinite(value)
    ) {
      return
    }

    event.preventDefault()
    input.current?.focus({ preventScroll: true })
    suppressClick.current = false
    drag.current = {
      pointerId: event.pointerId,
      target: event.currentTarget,
      start: value,
      startX: event.clientX,
      lastX: event.clientX,
      accumulated: value,
      emitted: value,
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDraft(String(value))
    setScrubbing(true)
  }

  function move(event: PointerEvent<HTMLSpanElement>) {
    const current = drag.current

    if (!current || current.pointerId !== event.pointerId) {
      return
    }

    if (!current.moved && Math.abs(event.clientX - current.startX) < 3) {
      return
    }

    current.moved = true
    suppressClick.current = true

    // Ten pixels equal one keyboard step. Modifiers apply only to new movement.
    const sensitivity =
      (step / 10) * (event.shiftKey ? 0.1 : event.altKey ? 10 : 1)
    const delta = (event.clientX - current.lastX) * sensitivity

    current.lastX = event.clientX

    const lower = integer ? Math.ceil(min ?? -Infinity) : (min ?? -Infinity)
    const upper = integer ? Math.floor(max ?? Infinity) : (max ?? Infinity)

    current.accumulated = Math.max(
      lower,
      Math.min(upper, current.accumulated + delta)
    )

    if (!Number.isFinite(current.accumulated)) {
      return
    }

    const rounded = integer
      ? Math.round(current.accumulated)
      : Number(current.accumulated.toPrecision(12))

    pending.current = Math.max(lower, Math.min(upper, rounded))

    if (!frame.current) {
      frame.current = requestAnimationFrame(() => {
        frame.current = 0

        if (pending.current !== null) {
          publish(pending.current)
        }

        pending.current = null
      })
    }
  }

  function click(event: MouseEvent<HTMLSpanElement>) {
    if (suppressClick.current) {
      event.preventDefault()
      suppressClick.current = false
    }
  }

  return { input, drag, scrubbing, begin, move, finish, click }
}
