const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const db = require('./db')
const { parseBrowser, parseOs, parseDevice, getClientIp } = require('./utils')

const app = express()
const PORT = process.env.PORT || 3001

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: true,
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── API Routes ───────────────────────────────────────────────────────────────

const BASE = '/api/short-link/admin/v1'

app.use(`${BASE}/user`, require('./routes/user'))
app.use(`${BASE}/group`, require('./routes/group'))
app.use(`${BASE}/stats`, require('./routes/stats'))
app.use(`${BASE}/recycle-bin`, require('./routes/recycleBin'))

// Link routes (page, create, update, title)
app.use(`${BASE}`, require('./routes/link'))

// ─── Short Link Redirect ──────────────────────────────────────────────────────

app.get('/:shortUri', (req, res) => {
  const { shortUri } = req.params

  // Ignore common static paths / API paths
  if (shortUri.startsWith('api') || shortUri === 'favicon.ico') {
    return res.status(404).send('Not found')
  }

  const link = db.prepare(`
    SELECT * FROM links WHERE short_uri = ? AND del_flag = 0
  `).get(shortUri)

  if (!link) {
    return res.status(404).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2 style="color:#666">短链接不存在或已失效</h2>
        <p style="color:#999">Short link not found or expired</p>
      </body></html>
    `)
  }

  // Check expiry
  if (link.valid_date_type === 1 && link.valid_date) {
    const expiry = new Date(link.valid_date)
    if (expiry < new Date()) {
      return res.status(410).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px">
          <h2 style="color:#666">短链接已过期</h2>
          <p style="color:#999">This short link has expired</p>
        </body></html>
      `)
    }
  }

  // Record visit
  try {
    const ua = req.headers['user-agent'] || ''
    const ip = getClientIp(req)
    const now = new Date()
    const visitDate = now.toISOString().slice(0, 10)
    const visitHour = now.getHours()
    const visitWeekday = now.getDay()
    const browser = parseBrowser(ua)
    const os = parseOs(ua)
    const device = parseDevice(ua)

    // Generate a session ID based on IP + UA to approximate UV
    const sessionId = crypto.createHash('md5')
      .update(`${ip}:${ua}:${visitDate}`)
      .digest('hex')

    db.prepare(`
      INSERT INTO visits (full_short_url, gid, visit_date, visit_hour, visit_weekday, ip, browser, os, device, session_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(link.full_short_url, link.gid, visitDate, visitHour, visitWeekday, ip, browser, os, device, sessionId)
  } catch (err) {
    console.error('[Visit tracking error]', err.message)
  }

  return res.redirect(302, link.origin_url)
})

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[Server] Running at http://localhost:${PORT}`)
  console.log(`[Server] API base: http://localhost:${PORT}${BASE}`)
})
