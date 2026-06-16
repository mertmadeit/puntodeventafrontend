type QueryParams = Record<string, string | number | boolean | null | undefined>

type ApiRequestOptions = {
  method?: string
  headers?: Record<string, string>
  body?: unknown
  auth?: boolean
  query?: QueryParams
  signal?: AbortSignal
}

/**
 * Cliente HTTP central del frontend.
 * Resuelve la URL base, agrega autenticacion, serializa el cuerpo,
 * parsea respuestas y normaliza errores para que el resto de `src/lib/api`
 * solo tenga que declarar endpoints y payloads.
 */
export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(status: number, message: string, payload: unknown) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

/** Error especifico cuando la app no logra conectar con la API. */
export class ApiConnectionError extends Error {
  url: string

  constructor(url: string, message: string) {
    super(message)
    this.url = url
  }
}

/** Detecta si estamos en produccion para decidir de donde leer la URL base. */
function isProduction() {
  return process.env.NODE_ENV === "production"
}

/** Permite validar que la URL guardada sea local antes de usarla como override. */
function isLocalhostUrl(value: string) {
  try {
    const url = new URL(value)
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1"
  } catch {
    return false
  }
}

/**
 * Obtiene la URL base de la API.
 * Prioriza la variable de entorno y, en local, permite override desde storage.
 */
function getBaseUrl() {
  let baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("pos.apiBaseUrl")
      if (saved && (!isProduction() || !baseUrl)) {
        if (!isProduction() || !isLocalhostUrl(saved)) baseUrl = saved
      }
    } catch {
      // ignore
    }
  }

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL")
  }

  const normalizedBaseUrl = baseUrl.replace(/\/$/, "")
  try {
    const url = new URL(normalizedBaseUrl)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Invalid protocol")
    }
  } catch {
    throw new Error("Invalid NEXT_PUBLIC_API_BASE_URL. Use a full URL like https://example.com")
  }

  return normalizedBaseUrl
}

/** Construye la URL final combinando base, ruta y query params. */
function buildUrl(path: string, query?: QueryParams) {
  const baseUrl = getBaseUrl()
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const url = new URL(`${baseUrl}${normalizedPath}`)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

/** Lee el token guardado por el login para enviarlo en Authorization. */
function getAuthToken() {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem("auth.token")
  } catch {
    return null
  }
}

/** Limpia la sesion local y las cookies de autenticacion cuando el backend rechaza acceso. */
function clearAuthSession() {
  try {
    localStorage.removeItem("auth.token")
    localStorage.removeItem("auth.role")
    localStorage.removeItem("pos.cashierName")
  } catch {
    // ignore
  }
  if (typeof document !== "undefined") {
    document.cookie = "auth_token=; Path=/; Max-Age=0; SameSite=Lax"
    document.cookie = "auth_role=; Path=/; Max-Age=0; SameSite=Lax"
    document.cookie = "pos_cashier_name=; Path=/; Max-Age=0; SameSite=Lax"
  }
}

/** Convierte la respuesta HTTP en JSON o texto segun el content-type. */
async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    return response.json().catch(() => null)
  }

  return response.text().catch(() => null)
}

/** Extrae un mensaje humano desde distintas formas de error de backend. */
function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload
  }

  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>
    const message = data.message ?? data.error ?? data.detail
    if (typeof message === "string" && message.trim().length > 0) {
      return message
    }
  }

  return fallback
}

/**
 * Envia requests al backend.
 * - agrega token si corresponde
 * - serializa JSON
 * - maneja 401 limpiando sesion
 * - lanza errores tipados con mensaje util para UI
 */
export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}) {
  const { method = "GET", body, headers, auth = true, query, signal } = options
  const url = buildUrl(path, query)

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  }

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json"
  }

  if (auth) {
    const token = getAuthToken()
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`
    }
  }

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body === undefined || body instanceof FormData ? body : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo conectar con la API"
    throw new ApiConnectionError(url, message)
  }

  if (response.status === 401 && auth) {
    clearAuthSession()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }

  if (response.status === 204) {
    return undefined as T
  }

  const payload = await parseResponse(response)

  if (!response.ok) {
    const message = getErrorMessage(payload, response.statusText)
    throw new ApiError(response.status, message || "Request failed", payload)
  }

  return payload as T
}

export type { ApiRequestOptions, QueryParams }
