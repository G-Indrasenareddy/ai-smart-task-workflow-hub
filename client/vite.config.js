import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

const realRoot = fs.realpathSync(process.cwd())

// https://vitejs.dev/config/
export default defineConfig({
  root: realRoot,
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: false
  }
})

