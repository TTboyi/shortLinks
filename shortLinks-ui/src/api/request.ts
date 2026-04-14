const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

type RawResponse<T> = {
  code: string
  message: string | null
  data: T
  success: boolean
}

function getAuthHeaders(): Record<string, string> {
  return {
    token: localStorage.getItem('token') ?? '',
    username: localStorage.getItem('username') ?? '',
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> | undefined ?? {}),
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const json = (await res.json()) as RawResponse<T>
  if (!json.success) {
    throw new Error(json.message ?? '请求失败')
  }
  return json.data
}

export function buildQuery(
  params: Record<string, string | number | undefined | null>
): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      q.append(k, String(v))
    }
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}
