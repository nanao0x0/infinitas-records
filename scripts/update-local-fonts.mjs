import { mkdir, writeFile } from 'node:fs/promises'

// Keep this list in sync with the Material Symbols used by the UI.
const icons = [
  'add_circle', 'arrow_forward', 'bar_chart', 'check', 'check_circle', 'close',
  'compare_arrows', 'dark_mode', 'database', 'delete', 'delete_sweep', 'description',
  'donut_large', 'download', 'edit_note', 'equalizer', 'error', 'expand_less',
  'expand_more', 'folder_zip', 'grid_view', 'history', 'hourglass_bottom', 'image',
  'info', 'keyboard_arrow_down', 'leaderboard', 'library_music', 'light_mode',
  'local_fire_department', 'menu', 'monitoring', 'open_in_new', 'reset_settings',
  'search', 'share', 'show_chart', 'target', 'trending_up', 'trophy', 'tune',
  'upload_file', 'view_list', 'warning',
]

const directory = new URL('../public/fonts/', import.meta.url)
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
}

async function fetchFile(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response
}

async function fetchFont(params) {
  const url = new URL('https://fonts.googleapis.com/css2')
  url.search = new URLSearchParams(params).toString()
  const css = await (await fetchFile(url)).text()
  const source = css.match(/url\(['"]?(https:\/\/fonts\.gstatic\.com\/[^)'"]+)['"]?\)\s+format\(['"]woff2['"]\)/)?.[1]
  if (!source) throw new Error(`WOFF2 URL missing from ${url}`)
  const bytes = Buffer.from(await (await fetchFile(source)).arrayBuffer())
  if (bytes.toString('ascii', 0, 4) !== 'wOF2') throw new Error(`Invalid WOFF2 file: ${source}`)
  return bytes
}

const [symbols, anton, symbolsLicense, antonLicense] = await Promise.all([
  fetchFont({ family: 'Material Symbols Outlined', icon_names: icons.sort().join(','), display: 'block' }),
  fetchFont({ family: 'Anton', text: 'INFINITAS Records', display: 'swap' }),
  fetchFile('https://raw.githubusercontent.com/google/material-design-icons/master/LICENSE').then((response) => response.text()),
  fetchFile('https://raw.githubusercontent.com/google/fonts/main/ofl/anton/OFL.txt').then((response) => response.text()),
])

await mkdir(directory, { recursive: true })
for (const [name, contents] of [
  ['material-symbols-outlined.woff2', symbols],
  ['anton-logo.woff2', anton],
  ['material-symbols-LICENSE.txt', symbolsLicense],
  ['anton-LICENSE.txt', antonLicense],
]) {
  await writeFile(new URL(name, directory), contents)
}
console.log(`Material Symbols: ${symbols.length} bytes. Anton: ${anton.length} bytes.`)
