import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        primarySubtle:
          'border-primary/20 bg-primary/10 text-primary',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground shadow-xs',
        destructive:
          'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30',
        outline: 'border-border text-foreground',
        success:
          'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
        warning:
          'border-secondary/40 bg-secondary text-secondary-foreground',
        dark:
          'border-transparent bg-brand-dark text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
