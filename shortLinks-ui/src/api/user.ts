import { request } from './request'
import type { LoginResult, UserInfo } from '../types/api'

export async function loginUser(username: string, password: string): Promise<LoginResult> {
  return request<LoginResult>('/api/short-link/admin/v1/user/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function logoutUser(): Promise<void> {
  return request<void>('/api/short-link/admin/v1/user/logout', {
    method: 'DELETE',
  })
}

export async function checkLogin(): Promise<boolean> {
  try {
    const result = await request<boolean>('/api/short-link/admin/v1/user/check-login')
    return result === true
  } catch {
    return false
  }
}

export async function getUserInfo(username: string): Promise<UserInfo> {
  return request<UserInfo>(`/api/short-link/admin/v1/user/${username}`)
}

export async function registerUser(params: {
  username: string
  password: string
  realName: string
  phone: string
  mail: string
}): Promise<void> {
  return request<void>('/api/short-link/admin/v1/user', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function updateUser(params: {
  username: string
  password: string
  realName: string
  phone: string
  mail: string
}): Promise<void> {
  return request<void>('/api/short-link/admin/v1/user', {
    method: 'PUT',
    body: JSON.stringify(params),
  })
}

export async function checkUsername(username: string): Promise<boolean> {
  return request<boolean>(`/api/short-link/admin/v1/user/has-username?username=${username}`)
}
