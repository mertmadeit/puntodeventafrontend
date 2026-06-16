"use client"

import * as React from "react"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined
)

/** Lee el tema guardado, usando system como valor seguro por defecto. */
function getStoredTheme() {
  if (typeof window === "undefined") return "system"
  try {
    const stored = localStorage.getItem("theme")
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored
    }
  } catch {
    // ignore storage errors
  }
  return "system"
}

/** Detecta el tema preferido por el sistema operativo. */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

/** Aplica la clase de tema al documento para que Tailwind/Radix usen el modo correcto. */
function applyThemeClass(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(resolved)
}

/** Provee tema global y sincroniza preferencia local con el DOM. */
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>(() => getStoredTheme())
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(() => getSystemTheme())
  const resolvedTheme = theme === "system" ? systemTheme : theme

  React.useEffect(() => {
    applyThemeClass(resolvedTheme)

    try {
      localStorage.setItem("theme", theme)
    } catch {
      // ignore storage errors
    }
  }, [resolvedTheme, theme])

  React.useEffect(() => {
    if (theme !== "system") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      setSystemTheme(media.matches ? "dark" : "light")
    }

    media.addEventListener("change", onChange)

    return () => {
      media.removeEventListener("change", onChange)
    }
  }, [theme])

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      <ThemeHotkey />
      {children}
    </ThemeContext.Provider>
  )
}

/** Evita que el atajo de tema se dispare mientras el usuario escribe. */
function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

/** Atajo de teclado para alternar rapidamente entre tema claro y oscuro. */
function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (typeof event.key !== "string" || event.key.toLowerCase() !== "d") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [resolvedTheme, setTheme])

  return null
}

/** Hook seguro para consumir el tema dentro de componentes cliente. */
function useTheme() {
  const context = React.useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }

  return context
}

export { ThemeProvider, useTheme }
