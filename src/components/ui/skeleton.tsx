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
      height={height ?? '100%'}
      width={width ?? '100%'}
      radius={radius ?? 'inherit'}
      className={cn('inline-block max-w-full', className)}
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
