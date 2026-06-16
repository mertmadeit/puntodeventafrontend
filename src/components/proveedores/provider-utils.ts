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

/** Convierte el formulario en el payload limpio que espera proveedores. */
export function buildProviderPayload(form: ProveedorFormValues) {
  return {
    nombre: form.nombre.trim(),
    contacto: form.contacto.trim(),
    telefono: form.telefono.trim(),
    rfc: form.rfc.trim(),
  }
}
