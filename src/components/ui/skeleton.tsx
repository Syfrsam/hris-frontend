import React from 'react'
import { SkeletonBox } from 'skullet/react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: string | number
  width?: string | number
  radius?: string | number
}

/**
 * Smart Skeleton Component powered by Skullet
 * Renders unified, theme-aware shimmer bars that stay in sync across the page.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  style,
  height,
  width,
  radius,
  ...props
}) => {
  return (
    <SkeletonBox
      height={height}
      width={width}
      radius={radius}
      className={cn('rounded-lg bg-muted/70', className)}
      style={style}
      {...props}
    />
  )
}

export {
  SkeletonBox,
  Skeleton as SkulletSkeleton,
  SkulletProvider,
  SkeletonSuspense,
  useSkullet,
} from 'skullet/react'
