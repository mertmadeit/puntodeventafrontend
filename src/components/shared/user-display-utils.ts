/** Genera iniciales estables para avatares sin imagen. */
export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.trim().slice(0, 2).toUpperCase() || "U"
}

/** Convierte el rol tecnico del backend en texto para la UI. */
export function formatRole(role?: string) {
  if (!role) return "Usuario"
  if (role === "admin") return "Administrador"
  if (role === "supervisor") return "Supervisor"
  if (role === "vendedor") return "Caja"
  return role
}
