const express = require('express')
const bcrypt = require('bcryptjs')
const router = express.Router()
const db = require('../db')
const { signToken } = require('../auth')
const { ok, fail } = require('../utils')

// POST /login
router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return fail(res, '用户名和密码不能为空')

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user) return fail(res, '用户不存在')

  const valid = bcrypt.compareSync(password, user.password)
  if (!valid) return fail(res, '密码错误')

  const token = signToken({ username: user.username, id: user.id })
  return ok(res, { token })
})

// DELETE /logout
router.delete('/logout', (req, res) => {
  return ok(res, null)
})

// GET /check-login
router.get('/check-login', (req, res) => {
  const token = req.headers['token'] || req.headers['authorization']?.replace('Bearer ', '')
  const username = req.headers['username']
  if (!token || !username) return ok(res, false)

  const { verifyToken } = require('../auth')
  const decoded = verifyToken(token)
  if (!decoded) return ok(res, false)

  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  return ok(res, !!user)
})

// GET /has-username
router.get('/has-username', (req, res) => {
  const { username } = req.query
  if (!username) return fail(res, '参数缺失')
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  return ok(res, !!user)
})

// POST / (register)
router.post('/', (req, res) => {
  const { username, password, realName, phone, mail } = req.body
  if (!username || !password) return fail(res, '用户名和密码不能为空')

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (exists) return fail(res, '用户名已存在')

  const hash = bcrypt.hashSync(password, 10)
  db.prepare(`
    INSERT INTO users (username, password, real_name, phone, mail)
    VALUES (?, ?, ?, ?, ?)
  `).run(username, hash, realName || '', phone || '', mail || '')

  return ok(res, null)
})

// PUT / (update)
router.put('/', (req, res) => {
  const { username, password, realName, phone, mail } = req.body
  if (!username) return fail(res, '用户名不能为空')

  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (!user) return fail(res, '用户不存在')

  if (password) {
    const hash = bcrypt.hashSync(password, 10)
    db.prepare(`
      UPDATE users SET password = ?, real_name = ?, phone = ?, mail = ?,
        updated_at = datetime('now', 'localtime')
      WHERE username = ?
    `).run(hash, realName || '', phone || '', mail || '', username)
  } else {
    db.prepare(`
      UPDATE users SET real_name = ?, phone = ?, mail = ?,
        updated_at = datetime('now', 'localtime')
      WHERE username = ?
    `).run(realName || '', phone || '', mail || '', username)
  }

  return ok(res, null)
})

// GET /:username
router.get('/:username', (req, res) => {
  const { username } = req.params
  const user = db.prepare('SELECT username, real_name, phone, mail FROM users WHERE username = ?').get(username)
  if (!user) return fail(res, '用户不存在')
  return ok(res, {
    username: user.username,
    realName: user.real_name,
    phone: user.phone,
    mail: user.mail,
  })
})

module.exports = router
