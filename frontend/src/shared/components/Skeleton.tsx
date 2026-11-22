export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-stone-200 ${className}`} />
)

// Grilla de tarjetas vacías con la forma de una tarjeta de producto
export const SkeletonTarjetas = ({ cantidad = 8 }: { cantidad?: number }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Cargando" aria-busy="true">
    {Array.from({ length: cantidad }, (_, i) => (
      <div key={i} className="rounded-lg border border-stone-200 bg-white p-4">
        <Skeleton className="aspect-[4/3] w-full" />
        <Skeleton className="mt-4 h-4 w-3/4" />
        <Skeleton className="mt-2 h-3 w-1/2" />
        <Skeleton className="mt-6 h-9 w-full" />
      </div>
    ))}
  </div>
)

export const SkeletonFilas = ({ cantidad = 5 }: { cantidad?: number }) => (
  <div className="flex flex-col gap-3" aria-label="Cargando" aria-busy="true">
    {Array.from({ length: cantidad }, (_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
)
