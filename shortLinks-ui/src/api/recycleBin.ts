import { request, buildQuery } from './request'
import type { PageData, RecycleBinLink } from '../types/api'

export async function moveToRecycleBin(
  gid: string,
  fullShortUrl: string
): Promise<void> {
  return request<void>('/api/short-link/admin/v1/recycle-bin/save', {
    method: 'POST',
    body: JSON.stringify({ gid, fullShortUrl }),
  })
}

export async function getRecycleBinLinks(params: {
  current: number
  size: number
}): Promise<PageData<RecycleBinLink>> {
  return request<PageData<RecycleBinLink>>(
    `/api/short-link/admin/v1/recycle-bin/page${buildQuery(params)}`
  )
}

export async function recoverLink(
  gid: string,
  fullShortUrl: string
): Promise<void> {
  return request<void>('/api/short-link/admin/v1/recycle-bin/recover', {
    method: 'POST',
    body: JSON.stringify({ gid, fullShortUrl }),
  })
}

export async function removeLink(
  gid: string,
  fullShortUrl: string
): Promise<void> {
  return request<void>('/api/short-link/admin/v1/recycle-bin/remove', {
    method: 'POST',
    body: JSON.stringify({ gid, fullShortUrl }),
  })
}
