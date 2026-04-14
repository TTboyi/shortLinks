const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'shortlink_jwt_secret_2024'
const JWT_EXPIRES = '7d'

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

// Middleware: attach user to req if token is valid
function authMiddleware(req, res, next) {
  const token = req.headers['token'] || req.headers['authorization']?.replace('Bearer ', '')
  const username = req.headers['username']

  if (!token) {
    return res.json({ code: 'A000401', message: '未登录或登录已过期', data: null, success: false })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.json({ code: 'A000401', message: '未登录或登录已过期', data: null, success: false })
  }

  req.user = decoded
  // Support username header as fallback
  if (!req.user.username && username) {
    req.user.username = username
  }
  next()
}

module.exports = { signToken, verifyToken, authMiddleware, JWT_SECRET }
