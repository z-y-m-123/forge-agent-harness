const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') ?? ''

export const isApiConfigured = configuredBaseUrl.length > 0

export function apiUrl(path: string): string {
  return `${configuredBaseUrl}${path}`
}
