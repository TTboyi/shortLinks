export type ApiResponse<T> = {
  code: string
  message: string | null
  data: T
  requestId: string | null
  success: boolean
}

export type PageData<T> = {
  size: number
  current: number
  pages: number
  total: number
  records: T[]
}

export type UserInfo = {
  username: string
  realName: string
  phone: string
  mail: string
}

export type LoginResult = {
  token: string
}

export type Group = {
  gid: string
  name: string
  sortOrder?: number
}

export type ShortLink = {
  id: number
  domain: string
  shortUri: string
  fullShortUrl: string
  originUrl: string
  gid: string
  validDateType: 0 | 1
  validDate: string | null
  createTime: string
  describe: string
  favicon: string
  totalPv: number
  todayPv: number
  totalUv: number
  todayUv: number
  totalUip: number
  todayUip: number
}

export type RecycleBinLink = {
  id: number
  domain: string
  shortUri: string
  fullShortUrl: string
  originUrl: string
  gid: string
  validDateType: 0 | 1
  validDate: string | null
  createTime: string
  describe: string
  favicon: string
}

export type CreateLinkParams = {
  domain: string
  originUrl: string
  gid: string
  createdType: 0 | 1
  validDateType: 0 | 1
  validDate: string | null
  describe: string
}

export type UpdateLinkParams = {
  fullShortUrl: string
  domain: string
  originUrl: string
  gid: string
  createdType: 0 | 1
  validDateType: 0 | 1
  validDate: string | null
  describe: string
}

export type DailyStats = {
  date: string
  pv: number
  uv: number
  uip: number
}

export type LocaleStat = {
  cnt: number
  locale: string
  ratio: number
}

export type BrowserStat = {
  cnt: number
  browser: string
  ratio: number
}

export type OsStat = {
  cnt: number
  os: string
  ratio: number
}

export type DeviceStat = {
  cnt: number
  device: string
  ratio: number
}

export type NetworkStat = {
  cnt: number
  network: string
  ratio: number
}

export type TopIpStat = {
  cnt: number
  ip: string
}

export type GroupStats = {
  pv: number | null
  uv: number | null
  uip: number | null
  daily: DailyStats[]
  localeCnStats: LocaleStat[]
  hourStats: number[]
  topIpStats: TopIpStat[]
  weekdayStats: number[]
  browserStats: BrowserStat[]
  osStats: OsStat[]
  deviceStats: DeviceStat[]
  networkStats: NetworkStat[]
}
