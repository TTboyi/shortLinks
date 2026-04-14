import { request, buildQuery } from './request'
import type { GroupStats } from '../types/api'

export async function getGroupStats(params: {
  gid: string
  startDate: string
  endDate: string
}): Promise<GroupStats> {
  return request<GroupStats>(
    `/api/short-link/admin/v1/stats/group${buildQuery(params)}`
  )
}
