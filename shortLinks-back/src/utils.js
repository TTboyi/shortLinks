const crypto = require('crypto')

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

function generateShortId(length = 6) {
  let result = ''
  const bytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    result += BASE62[bytes[i] % 62]
  }
  return result
}

function generateGid() {
  return generateShortId(8)
}

function ok(res, data) {
  return res.json({ code: '0', message: null, data, requestId: null, success: true })
}

function fail(res, message, code = 'B000001') {
  return res.json({ code, message, data: null, requestId: null, success: false })
}

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  )
}

function parseBrowser(ua = '') {
  if (!ua) return '其他'
  if (/Edg\//i.test(ua)) return 'Edge'
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera'
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return 'Chrome'
  if (/Firefox\//i.test(ua)) return 'Firefox'
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return 'Safari'
  if (/MSIE|Trident/i.test(ua)) return 'IE'
  return '其他'
}

function parseOs(ua = '') {
  if (!ua) return '其他'
  if (/Windows NT/i.test(ua)) return 'Windows'
  if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) return 'macOS'
  if (/iPhone/i.test(ua)) return 'iOS'
  if (/iPad/i.test(ua)) return 'iOS'
  if (/Android/i.test(ua)) return 'Android'
  if (/Linux/i.test(ua)) return 'Linux'
  return '其他'
}

function parseDevice(ua = '') {
  if (!ua) return 'PC'
  if (/Mobile/i.test(ua) || /iPhone|Android.*Mobile/i.test(ua)) return '手机'
  if (/iPad|Tablet/i.test(ua)) return '平板'
  return 'PC'
}

module.exports = { generateShortId, generateGid, ok, fail, getClientIp, parseBrowser, parseOs, parseDevice }
