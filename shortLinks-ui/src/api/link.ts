import { request, buildQuery } from './request'
import type { PageData, ShortLink, CreateLinkParams, UpdateLinkParams } from '../types/api'

export async function getLinks(params: {
  gid: string
  current: number
  size: number
  orderTag?: string
}): Promise<PageData<ShortLink>> {
  return request<PageData<ShortLink>>(
    `/api/short-link/admin/v1/page${buildQuery(params)}`
  )
}

export async function createLink(params: CreateLinkParams): Promise<void> {
  return request<void>('/api/short-link/admin/v1/create', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function updateLink(params: UpdateLinkParams): Promise<void> {
  return request<void>('/api/short-link/admin/v1/update', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function getWebTitle(url: string): Promise<string> {
  return request<string>(`/api/short-link/admin/v1/title${buildQuery({ url })}`)
}
