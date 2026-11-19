import { useCallback, useEffect, useState } from 'react'
import { ApiError } from './api'

export interface ApiState<T> {
  data: T | undefined
  error: ApiError | undefined
  loading: boolean
  reload: () => void
}

const toApiError = (e: unknown) => (e instanceof ApiError ? e : new ApiError(0, 'Une erreur est survenue. Réessayez.'))

/**
 * Runs `fetcher` whenever one of `deps` changes (or on reload) and exposes data / error / loading.
 * State is only written from the promise callbacks, so a stale response never overwrites a newer one.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: readonly unknown[]): ApiState<T> {
  const [nonce, setNonce] = useState(0)
  const key = JSON.stringify([...deps, nonce])
  const [result, setResult] = useState<{ key: string; data?: T; error?: ApiError } | null>(null)

  useEffect(() => {
    let active = true
    fetcher().then(
      (data) => active && setResult({ key, data }),
      (error: unknown) => active && setResult({ key, error: toApiError(error) }),
    )
    return () => {
      active = false
    }
    // `key` already encodes every dependency of the fetcher
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  const current = result?.key === key ? result : undefined
  return { data: current?.data, error: current?.error, loading: !current, reload }
}

/** Value that only updates after `delay` ms without changes (search inputs). */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}
