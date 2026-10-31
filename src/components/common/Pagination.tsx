import React, { useMemo } from 'react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowLeftDoubleIcon,
  ArrowRightDoubleIcon,
} from '@hugeicons/core-free-icons'
import { Icon } from './Icon'

export interface PaginationProps {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems)

  // Smart page numbers calculation
  const pageNumbers = useMemo(() => {
    const delta = 1 // adjacent pages around current
    const range: (number | string)[] = []

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= safeCurrentPage - delta && i <= safeCurrentPage + delta)
      ) {
        range.push(i)
      } else if (range[range.length - 1] !== '...') {
        range.push('...')
      }
    }
    return range
  }, [safeCurrentPage, totalPages])

  if (totalItems <= 0) return null

  return (
    <div
      className={`px-4 py-3 border-t border-border bg-card/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs select-none ${className}`}
    >
      {/* Kiri: Info Jumlah Data & Pilihan Baris Per Halaman */}
      <div className="flex flex-wrap items-center gap-2 text-muted-foreground font-normal">
        <span>
          Menampilkan <strong className="text-foreground font-medium">{startItem}</strong>-
          <strong className="text-foreground font-medium">{endItem}</strong> dari{' '}
          <strong className="text-foreground font-medium">{totalItems}</strong> data
        </span>

        {onPageSizeChange && (
          <div className="flex items-center space-x-1 ml-2">
            <span className="text-[11px] text-muted-foreground/80">Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value))
                onPageChange(1)
              }}
              className="bg-muted border border-border rounded-md px-2 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-normal cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / hal
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Kanan: Navigasi Halaman */}
      {totalPages > 1 && (
        <div className="flex items-center space-x-1 self-center sm:self-auto">
          {/* First Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={safeCurrentPage <= 1}
            title="Halaman Pertama"
            className="p-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center justify-center"
          >
            <Icon icon={ArrowLeftDoubleIcon} size={13} />
          </button>

          {/* Previous Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage <= 1}
            title="Halaman Sebelumnya"
            className="p-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center justify-center"
          >
            <Icon icon={ArrowLeft01Icon} size={13} />
          </button>

          {/* Numeric Page Buttons */}
          <div className="flex items-center space-x-1">
            {pageNumbers.map((item, idx) => {
              if (item === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-7 text-center text-muted-foreground font-normal tracking-widest text-[11px]"
                  >
                    ...
                  </span>
                )
              }

              const pageNum = Number(item)
              const isActive = pageNum === safeCurrentPage

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`min-w-7 h-7 px-1.5 rounded-lg font-medium text-xs transition-all flex items-center justify-center cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'border border-border bg-muted/30 hover:bg-muted text-foreground'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          {/* Next Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage >= totalPages}
            title="Halaman Berikutnya"
            className="p-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center justify-center"
          >
            <Icon icon={ArrowRight01Icon} size={13} />
          </button>

          {/* Last Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={safeCurrentPage >= totalPages}
            title="Halaman Terakhir"
            className="p-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center justify-center"
          >
            <Icon icon={ArrowRightDoubleIcon} size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
