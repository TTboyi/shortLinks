const express = require('express')
const router = express.Router()
const db = require('../db')
const { authMiddleware } = require('../auth')
const { ok, fail, generateShortId } = require('../utils')
const fetch = require('node-fetch')

// All link routes require auth
router.use(authMiddleware)

const DEFAULT_DOMAIN = process.env.DOMAIN || 'localhost:3001'

// Build full short url
function buildFullShortUrl(domain, shortUri) {
  const protocol = domain.startsWith('localhost') ? 'http' : 'https'
  return `${protocol}://${domain}/${shortUri}`
}

// Attach stats to a link record
function attachStats(link) {
  const today = new Date().toISOString().slice(0, 10)

  const totalStats = db.prepare(`
    SELECT COUNT(*) as pv,
           COUNT(DISTINCT session_id) as uv,
           COUNT(DISTINCT ip) as uip
    FROM visits WHERE full_short_url = ?
  `).get(link.full_short_url)

  const todayStats = db.prepare(`
    SELECT COUNT(*) as pv,
           COUNT(DISTINCT session_id) as uv,
           COUNT(DISTINCT ip) as uip
    FROM visits WHERE full_short_url = ? AND visit_date = ?
  `).get(link.full_short_url, today)

  return {
    id: link.id,
    domain: link.domain,
    shortUri: link.short_uri,
    fullShortUrl: link.full_short_url,
    originUrl: link.origin_url,
    gid: link.gid,
    createdType: link.created_type,
    validDateType: link.valid_date_type,
    validDate: link.valid_date,
    createTime: link.created_at,
    describe: link.describe,
    favicon: link.favicon,
    totalPv: totalStats?.pv ?? 0,
    totalUv: totalStats?.uv ?? 0,
    totalUip: totalStats?.uip ?? 0,
    todayPv: todayStats?.pv ?? 0,
    todayUv: todayStats?.uv ?? 0,
    todayUip: todayStats?.uip ?? 0,
  }
}

// GET /page - paginated list of short links
router.get('/page', (req, res) => {
  const { gid, current = 1, size = 10, orderTag, keyword } = req.query
  if (!gid) return fail(res, '分组参数缺失')

  const offset = (Number(current) - 1) * Number(size)
  const limit = Number(size)

  const orderMap = {
    totalPv: 'id DESC',
    createTime: 'l.created_at DESC',
    default: 'l.created_at DESC',
  }
  const orderClause = orderMap[orderTag] || orderMap.default

  let where = `l.gid = ? AND l.del_flag = 0`
  const params = [gid]

  if (keyword) {
    where += ` AND (l.origin_url LIKE ? OR l.describe LIKE ? OR l.full_short_url LIKE ?)`
    const kw = `%${keyword}%`
    params.push(kw, kw, kw)
  }

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM links l WHERE ${where}`).get(...params)

  const links = db.prepare(`
    SELECT * FROM links l WHERE ${where}
    ORDER BY ${orderClause}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset)

  const records = links.map(attachStats)

  return ok(res, {
    records,
    total: total.cnt,
    size: limit,
    current: Number(current),
    pages: Math.ceil(total.cnt / limit),
  })
})

// POST /create - create short link
router.post('/create', (req, res) => {
  const { domain, originUrl, gid, createdType = 0, validDateType = 0, validDate, describe } = req.body
  if (!originUrl) return fail(res, '原始链接不能为空')
  if (!gid) return fail(res, '分组不能为空')

  const linkDomain = domain || DEFAULT_DOMAIN

  // Check group belongs to user
  const group = db.prepare('SELECT id FROM groups WHERE gid = ? AND username = ?').get(gid, req.user.username)
  if (!group) return fail(res, '分组不存在')

  // Generate unique short URI
  let shortUri
  let attempts = 0
  do {
    shortUri = generateShortId(6)
    attempts++
    if (attempts > 10) return fail(res, '生成短链失败，请重试')
  } while (db.prepare('SELECT id FROM links WHERE short_uri = ?').get(shortUri))

  const fullShortUrl = buildFullShortUrl(linkDomain, shortUri)

  // Fetch favicon
  let favicon = ''
  try {
    const urlObj = new URL(originUrl)
    favicon = `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
  } catch {
    favicon = ''
  }

  db.prepare(`
    INSERT INTO links (domain, short_uri, full_short_url, origin_url, gid, username, created_type, valid_date_type, valid_date, describe, favicon)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    linkDomain, shortUri, fullShortUrl, originUrl, gid,
    req.user.username, createdType, validDateType,
    validDateType === 1 ? validDate : null,
    describe || '', favicon
  )

  return ok(res, { fullShortUrl })
})

// POST /update - update short link
router.post('/update', (req, res) => {
  const { fullShortUrl, originUrl, gid, validDateType = 0, validDate, describe } = req.body
  if (!fullShortUrl) return fail(res, '短链接不能为空')

  const link = db.prepare('SELECT id, gid FROM links WHERE full_short_url = ? AND username = ?').get(fullShortUrl, req.user.username)
  if (!link) return fail(res, '短链接不存在')

  // If gid changed, validate new group
  if (gid && gid !== link.gid) {
    const group = db.prepare('SELECT id FROM groups WHERE gid = ? AND username = ?').get(gid, req.user.username)
    if (!group) return fail(res, '目标分组不存在')
  }

  db.prepare(`
    UPDATE links
    SET origin_url = COALESCE(?, origin_url),
        gid = COALESCE(?, gid),
        valid_date_type = ?,
        valid_date = ?,
        describe = COALESCE(?, describe),
        updated_at = datetime('now', 'localtime')
    WHERE full_short_url = ? AND username = ?
  `).run(
    originUrl || null,
    gid || null,
    validDateType,
    validDateType === 1 ? validDate : null,
    describe ?? null,
    fullShortUrl,
    req.user.username
  )

  return ok(res, null)
})

// GET /title - get web page title
router.get('/title', async (req, res) => {
  const { url } = req.query
  if (!url) return fail(res, 'URL不能为空')

  try {
    const response = await fetch(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ShortLinkBot/1.0)' },
    })
    const html = await response.text()
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = match ? match[1].trim() : ''
    return ok(res, title)
  } catch {
    return ok(res, '')
  }
})

module.exports = router
