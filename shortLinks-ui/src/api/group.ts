import { request, buildQuery } from './request'
import type { Group } from '../types/api'

export async function getGroups(): Promise<Group[]> {
  return request<Group[]>('/api/short-link/admin/v1/group')
}

export async function createGroup(name: string): Promise<void> {
  return request<void>('/api/short-link/admin/v1/group', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function updateGroup(gid: string, name: string): Promise<void> {
  return request<void>('/api/short-link/admin/v1/group', {
    method: 'PUT',
    body: JSON.stringify({ gid, name }),
  })
}

export async function deleteGroup(gid: string): Promise<void> {
  return request<void>(`/api/short-link/admin/v1/group${buildQuery({ gid })}`, {
    method: 'DELETE',
  })
}

export async function sortGroups(
  items: { gid: string; sortOrder: number }[]
): Promise<void> {
  return request<void>('/api/short-link/admin/v1/group/sort', {
    method: 'POST',
    body: JSON.stringify(items),
  })
}
