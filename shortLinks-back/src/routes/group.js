const express = require('express')
const router = express.Router()
const db = require('../db')
const { authMiddleware } = require('../auth')
const { ok, fail, generateGid } = require('../utils')

// All group routes require auth
router.use(authMiddleware)

// GET / - list groups
router.get('/', (req, res) => {
  const groups = db.prepare(`
    SELECT g.gid, g.name, g.sort_order as sortOrder,
           COUNT(CASE WHEN l.del_flag = 0 THEN 1 END) as linkCount
    FROM groups g
    LEFT JOIN links l ON l.gid = g.gid
    WHERE g.username = ?
    GROUP BY g.gid
    ORDER BY g.sort_order ASC, g.created_at ASC
  `).all(req.user.username)

  return ok(res, groups)
})

// POST / - create group
router.post('/', (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return fail(res, '分组名称不能为空')

  const gid = generateGid()
  db.prepare(`
    INSERT INTO groups (gid, username, name, sort_order)
    VALUES (?, ?, ?, ?)
  `).run(gid, req.user.username, name.trim(), 0)

  return ok(res, null)
})

// PUT / - update group
router.put('/', (req, res) => {
  const { gid, name } = req.body
  if (!gid || !name?.trim()) return fail(res, '参数缺失')

  const group = db.prepare('SELECT id FROM groups WHERE gid = ? AND username = ?').get(gid, req.user.username)
  if (!group) return fail(res, '分组不存在')

  db.prepare(`
    UPDATE groups SET name = ?, updated_at = datetime('now', 'localtime')
    WHERE gid = ? AND username = ?
  `).run(name.trim(), gid, req.user.username)

  return ok(res, null)
})

// DELETE / - delete group
router.delete('/', (req, res) => {
  const { gid } = req.query
  if (!gid) return fail(res, '参数缺失')

  const group = db.prepare('SELECT id FROM groups WHERE gid = ? AND username = ?').get(gid, req.user.username)
  if (!group) return fail(res, '分组不存在')

  // Move all links in this group to recycle bin
  db.prepare(`
    UPDATE links SET del_flag = 1, updated_at = datetime('now', 'localtime')
    WHERE gid = ? AND del_flag = 0
  `).run(gid)

  db.prepare('DELETE FROM groups WHERE gid = ? AND username = ?').run(gid, req.user.username)

  return ok(res, null)
})

// POST /sort - sort groups
router.post('/sort', (req, res) => {
  const items = req.body
  if (!Array.isArray(items)) return fail(res, '参数格式错误')

  const updateStmt = db.prepare(`
    UPDATE groups SET sort_order = ?, updated_at = datetime('now', 'localtime')
    WHERE gid = ? AND username = ?
  `)

  const updateMany = db.transaction((list) => {
    for (const item of list) {
      updateStmt.run(item.sortOrder ?? 0, item.gid, req.user.username)
    }
  })

  updateMany(items)
  return ok(res, null)
})

module.exports = router
