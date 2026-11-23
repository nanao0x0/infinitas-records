import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { siteMetadata } from './siteMetadata.ts'
import { snapshotCacheVersion } from './snapshotCacheVersion.ts'

export default defineConfig(({ mode }) => {
  const { VITE_SITE_URL } = loadEnv(mode, process.cwd(), 'VITE_SITE_URL')
  const siteUrl = VITE_SITE_URL ? new URL('/', VITE_SITE_URL) : undefined
  if (siteUrl && siteUrl.protocol !== 'https:' && siteUrl.protocol !== 'http:') {
    throw new Error('VITE_SITE_URL must be an HTTP or HTTPS URL.')
  }

  return {
    define: { __DASHBOARD_CACHE_VERSION__: JSON.stringify(snapshotCacheVersion(process.cwd())) },
    plugins: [react(), tailwindcss(), siteMetadata(siteUrl)],
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [{
              name: 'react-runtime',
              test: /[\\/]node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
              includeDependenciesRecursively: false,
            }],
          },
        },
      },
    },
  }
})
