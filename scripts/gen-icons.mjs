import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#6366f1"/>
  </linearGradient></defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <path fill="#fff" d="M136 168c0-17.7 14.3-32 32-32h144c37.6 0 68 30.4 68 68v72c0 37.6-30.4 68-68 68H168c-17.7 0-32-14.3-32-32V168zm40 8v120c0 4.4 3.6 8 8 8h128c15.5 0 28-12.5 28-28v-72c0-15.5-12.5-28-28-28H184c-4.4 0-8 3.6-8 8z"/>
  <circle cx="312" cy="248" r="26" fill="#fff"/><circle cx="312" cy="248" r="12" fill="#10b981"/>
</svg>`

const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#6366f1"/>
  </linearGradient></defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <g transform="translate(64 64) scale(0.75)">
    <path fill="#fff" d="M136 168c0-17.7 14.3-32 32-32h144c37.6 0 68 30.4 68 68v72c0 37.6-30.4 68-68 68H168c-17.7 0-32-14.3-32-32V168zm40 8v120c0 4.4 3.6 8 8 8h128c15.5 0 28-12.5 28-28v-72c0-15.5-12.5-28-28-28H184c-4.4 0-8 3.6-8 8z"/>
    <circle cx="312" cy="248" r="26" fill="#fff"/><circle cx="312" cy="248" r="12" fill="#10b981"/>
  </g>
</svg>`

mkdirSync('public/icons', { recursive: true })
const buf = Buffer.from(svg)
await sharp(buf).resize(192, 192).png().toFile('public/icons/icon-192.png')
await sharp(buf).resize(512, 512).png().toFile('public/icons/icon-512.png')
await sharp(buf).resize(180, 180).png().toFile('public/apple-touch-icon.png')
await sharp(Buffer.from(maskable))
  .resize(512, 512)
  .png()
  .toFile('public/icons/icon-maskable-512.png')
console.log('Icons generated.')
