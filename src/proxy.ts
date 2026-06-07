import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const DASHBOARD_PREFIX = "/dashboard"
const DASHBOARD_CAJA_PATH = "/dashboard/caja"
const CAJA_PREFIX = "/caja"
const LOGIN_PATH = "/login"
const DASHBOARD_ROLES = new Set(["admin", "supervisor"])
const CAJA_ROLES = new Set(["admin", "supervisor", "vendedor"])

function clearSessionCookies(response: NextResponse) {
  response.cookies.set("auth_token", "", { path: "/", maxAge: 0 })
  response.cookies.set("auth_role", "", { path: "/", maxAge: 0 })
  response.cookies.set("pos_cashier_name", "", { path: "/", maxAge: 0 })
  return response
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = LOGIN_PATH
  return clearSessionCookies(NextResponse.redirect(url))
}

function redirectToHome(request: NextRequest, role: string) {
  const url = request.nextUrl.clone()
  url.pathname = DASHBOARD_ROLES.has(role) ? DASHBOARD_PREFIX : CAJA_PREFIX
  return NextResponse.redirect(url)
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const role = (request.cookies.get("auth_role")?.value ?? "").trim().toLowerCase()
  const token = request.cookies.get("auth_token")?.value ?? ""
  const isAuthenticated = token.length > 0
  const hasValidRole = CAJA_ROLES.has(role)

  if (pathname === "/") {
    if (!isAuthenticated || !hasValidRole) {
      return redirectToLogin(request)
    }

    return redirectToHome(request, role)
  }

  if (pathname === LOGIN_PATH && isAuthenticated) {
    if (!hasValidRole) {
      return clearSessionCookies(NextResponse.next())
    }

    return redirectToHome(request, role)
  }

  if (pathname.startsWith(DASHBOARD_CAJA_PATH)) {
    if (!isAuthenticated || !CAJA_ROLES.has(role)) {
      return redirectToLogin(request)
    }

    const url = request.nextUrl.clone()
    url.pathname = CAJA_PREFIX
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith(DASHBOARD_PREFIX)) {
    if (!isAuthenticated || !DASHBOARD_ROLES.has(role)) {
      return redirectToLogin(request)
    }
  }

  if (pathname.startsWith(CAJA_PREFIX)) {
    if (!isAuthenticated || !CAJA_ROLES.has(role)) {
      return redirectToLogin(request)
    }
  }

  if (pathname !== LOGIN_PATH && !pathname.startsWith(DASHBOARD_PREFIX) && !pathname.startsWith(CAJA_PREFIX)) {
    if (!isAuthenticated || !hasValidRole) {
      return redirectToLogin(request)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
