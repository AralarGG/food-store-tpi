import { Card } from '../../../shared/ui/Card'

interface ResumenCardProps {
  titulo: string
  valor: string
  detalle?: string
  // Color de la franja: acompaña al color del estado en BadgeEstado
  acento: string
}

export const ResumenCard = ({ titulo, valor, detalle, acento }: ResumenCardProps) => (
  <Card className={`border-l-4 p-5 ${acento}`}>
    <p className="text-sm font-medium text-stone-500">{titulo}</p>
    <p className="mt-2 text-3xl font-bold tracking-tight text-stone-900">{valor}</p>
    {detalle && <p className="mt-1 text-xs text-stone-500">{detalle}</p>}
  </Card>
)
