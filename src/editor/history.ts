export function createHistory<T>(
  initial: T,
  equal: (left: T, right: T) => boolean,
  limit = 100
) {
  let present = initial
  let start: T | null = null
  const past: T[] = []
  const future: T[] = []
  const listeners = new Set<() => void>()

  function notify() {
    listeners.forEach((listener) => listener())
  }

  function record(previous: T) {
    past.push(previous)

    if (past.length > limit) {
      past.shift()
    }

    future.length = 0
  }

  function end() {
    if (start !== null) {
      if (!equal(start, present)) {
        record(start)
      }

      start = null
    }
  }

  return {
    getSnapshot: () => present,
    subscribe(listener: () => void) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    update(change: (value: T) => T, undoable = true) {
      const next = change(present)

      if (next === present) {
        return
      }

      if (undoable && start === null && !equal(present, next)) {
        record(present)
      }

      present = next
      notify()
    },
    begin() {
      if (start === null) {
        start = present
      }
    },
    end,
    undo() {
      end()

      if (past.length) {
        future.push(present)
        present = past.pop()!
        notify()
      }
    },
    redo() {
      end()

      if (future.length) {
        past.push(present)
        present = future.pop()!
        notify()
      }
    },
  }
}
