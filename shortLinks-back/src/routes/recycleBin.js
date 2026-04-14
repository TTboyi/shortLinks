const express = require('express')
const router = express.Router()
const db = require('../db')
const { authMiddleware } = require('../auth')
const { ok, fail } = require('../utils')

router.use(authMiddleware)

// POST /save - move to recycle bin
router.post('/save', (req, res) => {
  const { gid, fullShortUrl } = req.body
  if (!gid || !fullShortUrl) return fail(res, '参数缺失')

  const link = db.prepare(
    'SELECT id FROM links WHERE full_short_url = ? AND gid = ? AND del_flag = 0'
  ).get(fullShortUrl, gid)
  if (!link) return fail(res, '短链接不存在')

  db.prepare(`
    UPDATE links SET del_flag = 1, updated_at = datetime('now', 'localtime')
    WHERE full_short_url = ? AND gid = ?
  `).run(fullShortUrl, gid)

  return ok(res, null)
})

// GET /page - list recycle bin
router.get('/page', (req, res) => {
  const { current = 1, size = 10 } = req.query
  const offset = (Number(current) - 1) * Number(size)
  const limit = Number(size)

  const username = req.user.username

  const total = db.prepare(
    'SELECT COUNT(*) as cnt FROM links WHERE username = ? AND del_flag = 1'
  ).get(username)

  const links = db.prepare(`
    SELECT id, domain, short_uri, full_short_url, origin_url, gid,
           valid_date_type, valid_date, created_at, describe, favicon
    FROM links
    WHERE username = ? AND del_flag = 1
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `).all(username, limit, offset)

  const records = links.map((l) => ({
    id: l.id,
    domain: l.domain,
    shortUri: l.short_uri,
    fullShortUrl: l.full_short_url,
    originUrl: l.origin_url,
    gid: l.gid,
    validDateType: l.valid_date_type,
    validDate: l.valid_date,
    createTime: l.created_at,
    describe: l.describe,
    favicon: l.favicon,
  }))

  return ok(res, {
    records,
    total: total.cnt,
    size: limit,
    current: Number(current),
    pages: Math.ceil(total.cnt / limit),
  })
})

// POST /recover - recover from recycle bin
router.post('/recover', (req, res) => {
  const { gid, fullShortUrl } = req.body
  if (!gid || !fullShortUrl) return fail(res, '参数缺失')

  const link = db.prepare(
    'SELECT id FROM links WHERE full_short_url = ? AND gid = ? AND del_flag = 1'
  ).get(fullShortUrl, gid)
  if (!link) return fail(res, '短链接不存在或已恢复')

  // Restore group if it was deleted - check if gid still exists
  const group = db.prepare('SELECT id FROM groups WHERE gid = ?').get(gid)
  if (!group) {
    // Auto-create the group
    const { generateGid } = require('../utils')
    db.prepare(`
      INSERT INTO groups (gid, username, name, sort_order)
      VALUES (?, ?, ?, 0)
    `).run(gid, req.user.username, '已恢复分组')
  }

  db.prepare(`
    UPDATE links SET del_flag = 0, updated_at = datetime('now', 'localtime')
    WHERE full_short_url = ? AND gid = ?
  `).run(fullShortUrl, gid)

  return ok(res, null)
})

// POST /remove - permanently delete
router.post('/remove', (req, res) => {
  const { gid, fullShortUrl } = req.body
  if (!gid || !fullShortUrl) return fail(res, '参数缺失')

  db.prepare(
    'DELETE FROM links WHERE full_short_url = ? AND gid = ? AND del_flag = 1'
  ).run(fullShortUrl, gid)

  return ok(res, null)
})

module.exports = router
