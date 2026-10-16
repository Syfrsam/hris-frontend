import React from 'react'
import { HugeiconsIcon } from '@hugeicons/react'

export interface IconProps {
  icon: any
  size?: number | string
  className?: string
  color?: string
  strokeWidth?: number
}

export const Icon: React.FC<IconProps> = ({
  icon,
  size = 20,
  className = '',
  color = 'currentColor',
  strokeWidth = 1.5,
}) => {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      className={className}
      color={color}
      strokeWidth={strokeWidth}
    />
  )
}
