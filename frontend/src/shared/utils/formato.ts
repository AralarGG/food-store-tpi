const formatoPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const formatoFecha = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export const formatearPrecio = (valor: number): string => formatoPrecio.format(valor)

// El backend envía las fechas en UTC; Intl las muestra en la hora local del navegador
export const formatearFecha = (iso: string): string => formatoFecha.format(new Date(iso))
