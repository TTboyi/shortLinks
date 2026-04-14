const express = require('express')
const router = express.Router()
const db = require('../db')
const { authMiddleware } = require('../auth')
const { ok, fail } = require('../utils')

router.use(authMiddleware)

// GET /group - group stats
router.get('/group', (req, res) => {
  const { gid, startDate, endDate } = req.query
  if (!gid || !startDate || !endDate) return fail(res, '参数缺失')

  // Total PV/UV/UIP for the group in date range
  const totals = db.prepare(`
    SELECT COUNT(*) as pv,
           COUNT(DISTINCT session_id) as uv,
           COUNT(DISTINCT ip) as uip
    FROM visits
    WHERE gid = ? AND visit_date BETWEEN ? AND ?
  `).get(gid, startDate, endDate)

  // Daily stats
  const daily = db.prepare(`
    SELECT visit_date as date,
           COUNT(*) as pv,
           COUNT(DISTINCT session_id) as uv,
           COUNT(DISTINCT ip) as uip
    FROM visits
    WHERE gid = ? AND visit_date BETWEEN ? AND ?
    GROUP BY visit_date
    ORDER BY visit_date ASC
  `).all(gid, startDate, endDate)

  // Fill missing dates
  const dailyMap = {}
  for (const row of daily) dailyMap[row.date] = row
  const filledDaily = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10)
    filledDaily.push(dailyMap[dateStr] || { date: dateStr, pv: 0, uv: 0, uip: 0 })
  }

  // Locale stats
  const localeRows = db.prepare(`
    SELECT locale, COUNT(*) as cnt
    FROM visits
    WHERE gid = ? AND visit_date BETWEEN ? AND ?
    GROUP BY locale
    ORDER BY cnt DESC
  `).all(gid, startDate, endDate)
  const totalVisits = totals.pv || 1
  const localeCnStats = localeRows.map((r) => ({
    locale: r.locale,
    cnt: r.cnt,
    ratio: parseFloat((r.cnt / totalVisits).toFixed(4)),
  }))

  // Hour stats (24 buckets)
  const hourRows = db.prepare(`
    SELECT visit_hour as hour, COUNT(*) as cnt
    FROM visits
    WHERE gid = ? AND visit_date BETWEEN ? AND ?
    GROUP BY visit_hour
  `).all(gid, startDate, endDate)
  const hourStats = new Array(24).fill(0)
  for (const row of hourRows) hourStats[row.hour] = row.cnt

  // Weekday stats (0=Sun...6=Sat)
  const weekdayRows = db.prepare(`
    SELECT visit_weekday as weekday, COUNT(*) as cnt
    FROM visits
    WHERE gid = ? AND visit_date BETWEEN ? AND ?
    GROUP BY visit_weekday
  `).all(gid, startDate, endDate)
  const weekdayStats = new Array(7).fill(0)
  for (const row of weekdayRows) weekdayStats[row.weekday] = row.cnt

  // Top IP stats
  const topIpStats = db.prepare(`
    SELECT ip, COUNT(*) as cnt
    FROM visits
    WHERE gid = ? AND visit_date BETWEEN ? AND ?
    GROUP BY ip
    ORDER BY cnt DESC
    LIMIT 10
  `).all(gid, startDate, endDate)

  // Browser stats
  const browserRows = db.prepare(`
    SELECT browser, COUNT(*) as cnt
    FROM visits
    WHERE gid = ? AND visit_date BETWEEN ? AND ?
    GROUP BY browser
    ORDER BY cnt DESC
  `).all(gid, startDate, endDate)
  const browserStats = browserRows.map((r) => ({
    browser: r.browser,
    cnt: r.cnt,
    ratio: parseFloat((r.cnt / totalVisits).toFixed(4)),
  }))

  // OS stats
  const osRows = db.prepare(`
    SELECT os, COUNT(*) as cnt
    FROM visits
    WHERE gid = ? AND visit_date BETWEEN ? AND ?
    GROUP BY os
    ORDER BY cnt DESC
  `).all(gid, startDate, endDate)
  const osStats = osRows.map((r) => ({
    os: r.os,
    cnt: r.cnt,
    ratio: parseFloat((r.cnt / totalVisits).toFixed(4)),
  }))

  // Device stats
  const deviceRows = db.prepare(`
    SELECT device, COUNT(*) as cnt
    FROM visits
    WHERE gid = ? AND visit_date BETWEEN ? AND ?
    GROUP BY device
    ORDER BY cnt DESC
  `).all(gid, startDate, endDate)
  const deviceStats = deviceRows.map((r) => ({
    device: r.device,
    cnt: r.cnt,
    ratio: parseFloat((r.cnt / totalVisits).toFixed(4)),
  }))

  // Network stats
  const networkRows = db.prepare(`
    SELECT network, COUNT(*) as cnt
    FROM visits
    WHERE gid = ? AND visit_date BETWEEN ? AND ?
    GROUP BY network
    ORDER BY cnt DESC
  `).all(gid, startDate, endDate)
  const networkStats = networkRows.map((r) => ({
    network: r.network,
    cnt: r.cnt,
    ratio: parseFloat((r.cnt / totalVisits).toFixed(4)),
  }))

  return ok(res, {
    pv: totals.pv,
    uv: totals.uv,
    uip: totals.uip,
    daily: filledDaily,
    localeCnStats,
    hourStats,
    weekdayStats,
    topIpStats,
    browserStats,
    osStats,
    deviceStats,
    networkStats,
  })
})

// GET /single - per-link stats (same structure, filtered by fullShortUrl)
router.get('/single', (req, res) => {
  const { fullShortUrl, startDate, endDate } = req.query
  if (!fullShortUrl || !startDate || !endDate) return fail(res, '参数缺失')

  const totals = db.prepare(`
    SELECT COUNT(*) as pv,
           COUNT(DISTINCT session_id) as uv,
           COUNT(DISTINCT ip) as uip
    FROM visits
    WHERE full_short_url = ? AND visit_date BETWEEN ? AND ?
  `).get(fullShortUrl, startDate, endDate)

  const daily = db.prepare(`
    SELECT visit_date as date,
           COUNT(*) as pv,
           COUNT(DISTINCT session_id) as uv,
           COUNT(DISTINCT ip) as uip
    FROM visits
    WHERE full_short_url = ? AND visit_date BETWEEN ? AND ?
    GROUP BY visit_date
    ORDER BY visit_date ASC
  `).all(fullShortUrl, startDate, endDate)

  const dailyMap = {}
  for (const row of daily) dailyMap[row.date] = row
  const filledDaily = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10)
    filledDaily.push(dailyMap[dateStr] || { date: dateStr, pv: 0, uv: 0, uip: 0 })
  }

  const totalVisits = totals.pv || 1

  const build = (rows, key) => rows.map((r) => ({
    [key]: r[key],
    cnt: r.cnt,
    ratio: parseFloat((r.cnt / totalVisits).toFixed(4)),
  }))

  const browserRows = db.prepare(`SELECT browser, COUNT(*) as cnt FROM visits WHERE full_short_url = ? AND visit_date BETWEEN ? AND ? GROUP BY browser ORDER BY cnt DESC`).all(fullShortUrl, startDate, endDate)
  const osRows = db.prepare(`SELECT os, COUNT(*) as cnt FROM visits WHERE full_short_url = ? AND visit_date BETWEEN ? AND ? GROUP BY os ORDER BY cnt DESC`).all(fullShortUrl, startDate, endDate)
  const deviceRows = db.prepare(`SELECT device, COUNT(*) as cnt FROM visits WHERE full_short_url = ? AND visit_date BETWEEN ? AND ? GROUP BY device ORDER BY cnt DESC`).all(fullShortUrl, startDate, endDate)
  const networkRows = db.prepare(`SELECT network, COUNT(*) as cnt FROM visits WHERE full_short_url = ? AND visit_date BETWEEN ? AND ? GROUP BY network ORDER BY cnt DESC`).all(fullShortUrl, startDate, endDate)
  const localeRows = db.prepare(`SELECT locale, COUNT(*) as cnt FROM visits WHERE full_short_url = ? AND visit_date BETWEEN ? AND ? GROUP BY locale ORDER BY cnt DESC`).all(fullShortUrl, startDate, endDate)
  const topIpStats = db.prepare(`SELECT ip, COUNT(*) as cnt FROM visits WHERE full_short_url = ? AND visit_date BETWEEN ? AND ? GROUP BY ip ORDER BY cnt DESC LIMIT 10`).all(fullShortUrl, startDate, endDate)

  const hourRows = db.prepare(`SELECT visit_hour as hour, COUNT(*) as cnt FROM visits WHERE full_short_url = ? AND visit_date BETWEEN ? AND ? GROUP BY visit_hour`).all(fullShortUrl, startDate, endDate)
  const hourStats = new Array(24).fill(0)
  for (const row of hourRows) hourStats[row.hour] = row.cnt

  const weekdayRows = db.prepare(`SELECT visit_weekday as weekday, COUNT(*) as cnt FROM visits WHERE full_short_url = ? AND visit_date BETWEEN ? AND ? GROUP BY visit_weekday`).all(fullShortUrl, startDate, endDate)
  const weekdayStats = new Array(7).fill(0)
  for (const row of weekdayRows) weekdayStats[row.weekday] = row.cnt

  return ok(res, {
    pv: totals.pv,
    uv: totals.uv,
    uip: totals.uip,
    daily: filledDaily,
    localeCnStats: build(localeRows, 'locale'),
    hourStats,
    weekdayStats,
    topIpStats,
    browserStats: build(browserRows, 'browser'),
    osStats: build(osRows, 'os'),
    deviceStats: build(deviceRows, 'device'),
    networkStats: build(networkRows, 'network'),
  })
})

module.exports = router
