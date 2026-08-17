import { useCallback, useState } from 'react'
import type { Locale } from '../domain/types'
import { catalog, type MessageKey } from './catalog'

const STORAGE_KEY = 'forge-agent.locale'
const getInitialLocale = (): Locale => window.localStorage.getItem(STORAGE_KEY) === 'en-US' ? 'en-US' : 'zh-CN'

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)
  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next); window.localStorage.setItem(STORAGE_KEY, next); document.documentElement.lang = next
  }, [])
  const t = useCallback((key: MessageKey) => catalog[locale][key], [locale])
  return { locale, setLocale, t }
}
