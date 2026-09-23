import { registerHooks } from 'node:module'

const sourceRoot = new URL('../src/', import.meta.url)

// Native Node tests need the same source alias as TypeScript and Vite.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      specifier = new URL(specifier.slice(2), sourceRoot).href
    }

    return nextResolve(specifier, context)
  },
})
