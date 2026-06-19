export type ProveedorRow = {
  id: number
  nombre: string
  contacto: string
  telefono: string
  rfc: string
  activo: boolean
}

export type ProveedorFormValues = {
  nombre: string
  contacto: string
  telefono: string
  rfc: string
}

export const EMPTY_FORM: ProveedorFormValues = {
  nombre: "",
  contacto: "",
  telefono: "",
  rfc: "",
}

export const TELEFONO_MAX_LENGTH = 10
export const RFC_MAX_LENGTH = 13

const TELEFONO_PATTERN = /^\d{10}$/
const RFC_PATTERN = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/

/** Conserva solamente los 10 digitos permitidos para un telefono mexicano. */
export function sanitizeTelefono(value: string) {
  return value.replace(/\D/g, "").slice(0, TELEFONO_MAX_LENGTH)
}

/** Normaliza el RFC a mayusculas y elimina caracteres que no forman parte de el. */
export function sanitizeRfc(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-ZÑ&0-9]/g, "")
    .slice(0, RFC_MAX_LENGTH)
}

/** Devuelve el primer error de formato antes de enviar el proveedor. */
export function getProviderValidationError(form: ProveedorFormValues) {
  if (form.telefono && !TELEFONO_PATTERN.test(form.telefono)) {
    return "El teléfono debe tener exactamente 10 dígitos."
  }

  if (form.rfc && !RFC_PATTERN.test(form.rfc)) {
    return "El RFC debe tener 12 o 13 caracteres con un formato válido."
  }

  return null
}

/** Convierte el formulario en el payload limpio que espera proveedores. */
export function buildProviderPayload(form: ProveedorFormValues) {
  return {
    nombre: form.nombre.trim(),
    contacto: form.contacto.trim(),
    telefono: sanitizeTelefono(form.telefono),
    rfc: sanitizeRfc(form.rfc),
  }
}
