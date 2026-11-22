import type { HTMLAttributes } from 'react'

export const Card = ({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-lg border border-stone-200 bg-white ${className}`} {...props} />
)
