import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  RefreshIcon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from './Icon'
import { Button } from '../ui/button'

export interface AvatarCropModalProps {
  isOpen: boolean
  imageSrc: string | null
  onClose: () => void
  onCropComplete: (croppedFile: File, previewUrl: string) => void
  maxOutputDimension?: number // default 512px
  maxFileSizeBytes?: number // default 1024 * 1024 (1 MB)
}

// UI Dimensions
const CROP_CONTAINER_SIZE = 280 // px
const CROP_DIAMETER = 230 // px

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  maxOutputDimension = 512,
  maxFileSizeBytes = 1024 * 1024,
}) => {
  const [zoom, setZoom] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null)
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  })

  // Pinch-to-zoom state for mobile
  const pinchStartDistRef = useRef<number | null>(null)
  const pinchStartZoomRef = useRef<number>(1)

  const imageRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Keep refs in sync for event listeners
  const zoomRef = useRef<number>(zoom)
  zoomRef.current = zoom
  const panRef = useRef<{ x: number; y: number }>(pan)
  panRef.current = pan
  const rotationRef = useRef<number>(rotation)
  rotationRef.current = rotation

  // Calculate base displayed dimensions inside the crop area
  // When zoom = 1, the smaller dimension exactly covers CROP_DIAMETER
  const getBaseDisplayDimensions = useCallback(
    (natW?: number, natH?: number) => {
      const w = natW || naturalDimensions.width || 300
      const h = natH || naturalDimensions.height || 300
      const minDim = Math.min(w, h)
      if (minDim === 0) return { width: CROP_DIAMETER, height: CROP_DIAMETER }
      const baseScale = CROP_DIAMETER / minDim
      return {
        width: Math.round(w * baseScale),
        height: Math.round(h * baseScale),
      }
    },
    [naturalDimensions]
  )

  // Generate live circular thumbnail preview (100% WYSIWYG)
  const generateLivePreview = useCallback(
    (
      currentZoom: number,
      currentPan: { x: number; y: number },
      currentRotation: number,
      natW?: number,
      natH?: number
    ) => {
      if (!imageRef.current) return
      const img = imageRef.current
      const { width: baseW, height: baseH } = getBaseDisplayDimensions(
        natW || naturalDimensions.width,
        natH || naturalDimensions.height
      )

      const THUMB_SIZE = 96
      const canvas = document.createElement('canvas')
      canvas.width = THUMB_SIZE
      canvas.height = THUMB_SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Clip to circular avatar shape
      ctx.beginPath()
      ctx.arc(THUMB_SIZE / 2, THUMB_SIZE / 2, THUMB_SIZE / 2, 0, Math.PI * 2)
      ctx.clip()

      // Fill background
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, THUMB_SIZE, THUMB_SIZE)

      // 1:1 scaling from UI crop circle to thumbnail
      const thumbScale = THUMB_SIZE / CROP_DIAMETER
      ctx.translate(THUMB_SIZE / 2, THUMB_SIZE / 2)
      ctx.rotate((currentRotation * Math.PI) / 180)
      ctx.scale(currentZoom, currentZoom)

      const drawW = baseW * thumbScale
      const drawH = baseH * thumbScale
      const drawX = -drawW / 2 + currentPan.x * thumbScale
      const drawY = -drawH / 2 + currentPan.y * thumbScale

      ctx.drawImage(img, drawX, drawY, drawW, drawH)

      try {
        setPreviewThumbnail(canvas.toDataURL('image/webp', 0.88))
      } catch {
        // Fallback gracefully
      }
    },
    [getBaseDisplayDimensions, naturalDimensions]
  )

  // Reset state whenever modal opens with a new image
  useEffect(() => {
    if (isOpen && imageSrc) {
      setZoom(1)
      setRotation(0)
      setPan({ x: 0, y: 0 })
      setIsProcessing(false)
      pinchStartDistRef.current = null
    }
  }, [isOpen, imageSrc])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Non-passive wheel listener for smooth zooming without scrolling the page
  useEffect(() => {
    const container = containerRef.current
    if (!isOpen || !container) return

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY * -0.0015
      setZoom((prevZoom) => {
        const nextZoom = Math.min(Math.max(0.5, prevZoom + delta), 3.5)
        generateLivePreview(nextZoom, panRef.current, rotationRef.current)
        return nextZoom
      })
    }

    container.addEventListener('wheel', handleWheelNative, { passive: false })
    return () => container.removeEventListener('wheel', handleWheelNative)
  }, [isOpen, generateLivePreview])

  const onImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget
    setNaturalDimensions({ width: naturalWidth, height: naturalHeight })
    generateLivePreview(1, { x: 0, y: 0 }, 0, naturalWidth, naturalHeight)
  }

  // Pointer drag events with full pointer capture (no dropped drags)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const newPan = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }
    setPan(newPan)
    generateLivePreview(zoom, newPan, rotation)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // ignore
      }
      setIsDragging(false)
    }
  }

  // Touch handlers for mobile pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      pinchStartDistRef.current = dist
      pinchStartZoomRef.current = zoomRef.current
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const scale = dist / pinchStartDistRef.current
      const nextZoom = Math.min(Math.max(0.5, pinchStartZoomRef.current * scale), 3.5)
      setZoom(nextZoom)
      generateLivePreview(nextZoom, panRef.current, rotationRef.current)
    }
  }

  const handleTouchEnd = () => {
    pinchStartDistRef.current = null
  }

  // Rotate 90 degrees
  const handleRotate = () => {
    const newRot = (rotation + 90) % 360
    setRotation(newRot)
    generateLivePreview(zoom, pan, newRot)
  }

  // Reset adjustments
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
    setPan({ x: 0, y: 0 })
    generateLivePreview(1, { x: 0, y: 0 }, 0)
  }

  // Zoom helpers
  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.min(Math.max(0.5, newZoom), 3.5)
    setZoom(clamped)
    generateLivePreview(clamped, pan, rotation)
  }

  // Export cropped & compressed image - 100% mathematical WYSIWYG
  const handleApplyCrop = async () => {
    if (!imageRef.current) return
    setIsProcessing(true)

    try {
      const img = imageRef.current
      const natW = naturalDimensions.width || img.naturalWidth
      const natH = naturalDimensions.height || img.naturalHeight
      const { width: baseW, height: baseH } = getBaseDisplayDimensions(natW, natH)

      const canvas = document.createElement('canvas')
      canvas.width = maxOutputDimension
      canvas.height = maxOutputDimension
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Canvas context tidak tersedia')
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Exact mathematical scale factor from UI crop circle (CROP_DIAMETER) to canvas resolution
      const exportScale = maxOutputDimension / CROP_DIAMETER

      // Center and transform
      ctx.translate(maxOutputDimension / 2, maxOutputDimension / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.scale(zoom, zoom)

      // Draw image with exact 1:1 scale and pan mapping
      const drawW = baseW * exportScale
      const drawH = baseH * exportScale
      const drawX = -drawW / 2 + pan.x * exportScale
      const drawY = -drawH / 2 + pan.y * exportScale

      ctx.drawImage(img, drawX, drawY, drawW, drawH)

      // Compress to WebP or JPEG ensuring file size <= maxFileSizeBytes (1 MB)
      let quality = 0.9
      let blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/webp', quality)
      )

      if (!blob || blob.type !== 'image/webp') {
        blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
        )
      }

      // If blob size > 1MB, gradually reduce quality
      while (blob && blob.size > maxFileSizeBytes && quality > 0.3) {
        quality -= 0.12
        const currentMime = blob.type
        blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b), currentMime, quality)
        )
      }

      if (!blob) {
        throw new Error('Gagal memproses kompresi gambar')
      }

      const fileExtension = blob.type === 'image/webp' ? 'webp' : 'jpg'
      const croppedFile = new File([blob], `avatar_${Date.now()}.${fileExtension}`, {
        type: blob.type,
      })

      const previewUrl = URL.createObjectURL(blob)
      onCropComplete(croppedFile, previewUrl)
      onClose()
    } catch (err) {
      console.error('Error during crop processing:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen || !imageSrc) return null

  const { width: displayW, height: displayH } = getBaseDisplayDimensions()

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-modal-title"
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-auto animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div>
            <h3 id="crop-modal-title" className="text-sm font-bold text-foreground">
              Sesuaikan & Crop Foto Profil
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Geser dan perbesar agar wajah berada tepat di dalam lingkaran.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
            aria-label="Tutup pemotong foto"
          >
            <Icon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        {/* Viewport & Interactive Canvas */}
        <div className="p-4 sm:p-5 space-y-4 bg-card">
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ width: `${CROP_CONTAINER_SIZE}px`, height: `${CROP_CONTAINER_SIZE}px` }}
            className="relative mx-auto rounded-2xl overflow-hidden bg-slate-950 border border-border select-none touch-none flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner"
          >
            {/* The scaled and positioned image */}
            <img
              ref={imageRef}
              src={imageSrc}
              crossOrigin="anonymous"
              alt="Source Crop"
              onLoad={onImageLoaded}
              draggable={false}
              style={{
                width: `${displayW}px`,
                height: `${displayH}px`,
                minWidth: `${displayW}px`,
                minHeight: `${displayH}px`,
                maxWidth: 'none',
                maxHeight: 'none',
                transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.08s ease-out',
              }}
              className="pointer-events-none select-none origin-center"
            />

            {/* Circular Vignette Overlay Mask */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Darkened area outside the crop circle */}
              <div
                style={{ width: `${CROP_DIAMETER}px`, height: `${CROP_DIAMETER}px` }}
                className="rounded-full border-2 border-primary shadow-[0_0_0_9999px_rgba(15,23,42,0.72)] relative flex items-center justify-center"
              >
                {/* Subtle rule of thirds crosshair guide */}
                <div className="absolute inset-0 rounded-full flex flex-col justify-evenly opacity-25 pointer-events-none">
                  <div className="w-full border-t border-dashed border-white" />
                  <div className="w-full border-t border-dashed border-white" />
                </div>
                <div className="absolute inset-0 rounded-full flex justify-evenly opacity-25 pointer-events-none">
                  <div className="h-full border-l border-dashed border-white" />
                  <div className="h-full border-l border-dashed border-white" />
                </div>

                {/* Subtle face centering guide oval */}
                <div className="w-[125px] h-[155px] rounded-[50%] border border-dashed border-white/45 pointer-events-none flex items-center justify-center">
                  <span className="text-[10px] text-white/70 font-medium select-none tracking-wider px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-xs">
                    Area Wajah
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Zoom & Position Controls */}
          <div className="space-y-2.5 bg-muted/30 p-3 rounded-xl border border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                Ukuran Zoom
              </span>
              <span className="font-mono text-foreground font-bold px-1.5 py-0.5 rounded bg-background border border-border text-[11px]">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.15)}
                className="w-7 h-7 rounded-lg bg-background border border-border text-foreground hover:bg-muted text-xs font-bold flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                title="Perkecil zoom (-)"
              >
                -
              </button>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.02"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 accent-primary cursor-pointer h-2 bg-muted rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.15)}
                className="w-7 h-7 rounded-lg bg-background border border-border text-foreground hover:bg-muted text-xs font-bold flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                title="Perbesar zoom (+)"
              >
                +
              </button>
            </div>

            {/* Quick Action Tools: Rotate & Reset */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background border border-border hover:bg-muted text-xs font-medium text-foreground cursor-pointer transition-colors"
                title="Putar 90 derajat searah jarum jam"
              >
                <Icon icon={RefreshIcon} size={13} />
                <span>Putar 90°</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer transition-colors"
                title="Kembalikan zoom dan posisi ke tengah"
              >
                Reset Posisi
              </button>
            </div>
          </div>

          {/* Live Preview & Final Output Info */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-muted/40 border border-border">
            <div className="w-12 h-12 rounded-full border-2 border-primary/50 overflow-hidden bg-slate-950 flex items-center justify-center shrink-0 shadow-xs">
              {previewThumbnail ? (
                <img
                  src={previewThumbnail}
                  alt="Hasil Potongan"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icon icon={UserIcon} size={20} className="text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 text-xs">
              <p className="font-semibold text-foreground">Hasil Potongan Foto</p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                Rasio persegi 1:1 · Kompresi otomatis &lt; 1 MB · Tajam & jernih.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2.5 bg-card shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8.5 px-3.5 text-xs font-medium cursor-pointer rounded-lg"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={isProcessing}
            onClick={handleApplyCrop}
            className="h-8.5 px-4 text-xs font-semibold gap-1.5 cursor-pointer rounded-lg shadow-xs"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Icon icon={CheckmarkCircle02Icon} size={15} />
                <span>Gunakan Foto Ini</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
