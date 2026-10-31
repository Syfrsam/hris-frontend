import React, { useState } from 'react'
import { UserIcon } from '@hugeicons/core-free-icons'
import { Icon } from './Icon'

export interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  alt?: string
  border?: boolean
}

const SIZE_CLASSES: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', { box: string; text: string; icon: number }> = {
  xs: { box: 'w-6 h-6 rounded-md', text: 'text-[10px]', icon: 12 },
  sm: { box: 'w-8 h-8 rounded-lg', text: 'text-xs', icon: 14 },
  md: { box: 'w-9 h-9 rounded-xl', text: 'text-xs', icon: 16 },
  lg: { box: 'w-11 h-11 rounded-xl', text: 'text-sm', icon: 18 },
  xl: { box: 'w-16 h-16 rounded-2xl', text: 'text-lg', icon: 24 },
}

/**
 * Extracts 1-2 uppercase initials from a full name (e.g. "Budi Pratama" -> "BP")
 */
function getInitials(name?: string): string {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Stabilises image URL by ensuring CDN format & quality params if hosted on Cloudinary
 */
function optimizeImageUrl(url?: string | null): string | null {
  if (!url) return null
  // If hosted on Cloudinary and does not already contain transformation parameters, apply f_auto,q_auto
  if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('/upload/f_auto')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_200,c_fill,g_face/')
  }
  return url
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  alt,
  border = true,
}) => {
  const [hasError, setHasError] = useState<boolean>(false)
  const sizeConfig = SIZE_CLASSES[size]
  const initials = getInitials(name)
  const optimizedSrc = optimizeImageUrl(src)

  return (
    <div
      className={`relative aspect-square overflow-hidden shrink-0 flex items-center justify-center font-bold select-none ${
        sizeConfig.box
      } ${
        border ? 'border border-border' : ''
      } ${
        hasError || !optimizedSrc
          ? 'bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary border-primary/20'
          : 'bg-muted text-foreground'
      } ${className}`}
    >
      {optimizedSrc && !hasError ? (
        <img
          src={optimizedSrc}
          alt={alt || name || 'Avatar'}
          onError={() => setHasError(true)}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-opacity duration-200"
        />
      ) : initials ? (
        <span className={`${sizeConfig.text} tracking-tight font-semibold`}>{initials}</span>
      ) : (
        <Icon icon={UserIcon} size={sizeConfig.icon} className="text-muted-foreground" />
      )}
    </div>
  )
}
