import { useEffect, useState, type ComponentType } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { useTheme } from './components/layout/useTheme'
import { navigation } from './navigation'

const pages = {
  '/': () => import('./pages/dashboard/DashboardPage').then(({ DashboardPage }) => DashboardPage),
  '/search': () => import('./pages/search/SearchPage').then(({ SearchPage }) => SearchPage),
  '/data': () => import('./pages/data/DataPage').then(({ DataPage }) => DataPage),
}

const pathname = window.location.pathname.replace(/\/$/, '') || '/'
const page = navigation.find(({ path }) => path === pathname) ?? navigation[0]
const pageModule = pages[page.path]().catch(() => undefined)

export default function App() {
  const { isDark, toggleTheme } = useTheme()
  const [Page, setPage] = useState<ComponentType<{ isDark: boolean }>>()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    document.title = page.seoTitle
    let active = true
    void pageModule.then((component) => {
      if (!active) return
      if (component) setPage(() => component)
      else setFailed(true)
    })
    return () => { active = false }
  }, [])

  return (
    <AppLayout currentPath={page.path} isDark={isDark} toggleTheme={toggleTheme}>
      {Page ? <Page isDark={isDark} /> : failed
        ? <p role="alert" className="text-sm text-red-700 dark:text-red-400">ページを読み込めませんでした。再読み込みしてください。</p>
        : <p role="status" className="text-sm text-zinc-500 dark:text-zinc-400">読み込み中…</p>}
    </AppLayout>
  )
}
