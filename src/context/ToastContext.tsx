import React, { createContext, useContext, useState, useCallback } from 'react'
import {
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  InformationCircleIcon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '../components/common/Icon'
import type { ToastMessage } from '../types'

interface ToastContextType {
  toasts: ToastMessage[]
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
  toast: {
    success: (title: string, message?: string) => void
    error: (title: string, message?: string) => void
    warning: (title: string, message?: string) => void
    info: (title: string, message?: string) => void
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (item: Omit<ToastMessage, 'id'>) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 5)
      const newToast: ToastMessage = { ...item, id }
      setToasts((prev) => [...prev, newToast])

      setTimeout(() => {
        removeToast(id)
      }, 4000)
    },
    [removeToast]
  )

  const toast = {
    success: (title: string, message?: string) => addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) => addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) => addToast({ type: 'info', title, message }),
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <div className="fixed bottom-4 sm:bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-full max-w-sm mx-auto sm:mx-0 z-50 flex flex-col space-y-2.5 pointer-events-none">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success'
          const isError = t.type === 'error'
          const isWarning = t.type === 'warning'

          const icon = isSuccess
            ? CheckmarkCircle01Icon
            : isError
            ? AlertCircleIcon
            : isWarning
            ? AlertCircleIcon
            : InformationCircleIcon

          const statusStyles = isSuccess
            ? {
                badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                border: 'border-l-4 border-l-emerald-500',
              }
            : isError
            ? {
                badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                border: 'border-l-4 border-l-rose-500',
              }
            : isWarning
            ? {
                badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                border: 'border-l-4 border-l-amber-500',
              }
            : {
                badge: 'bg-primary/10 text-primary border-primary/20',
                border: 'border-l-4 border-l-primary',
              }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto w-full p-3.5 rounded-xl border border-border bg-card/98 text-foreground shadow-lg shadow-black/5 backdrop-blur-md flex items-start space-x-3 transition-all duration-300 ${statusStyles.border}`}
            >
              <div className={`shrink-0 p-1 rounded-lg border flex items-center justify-center ${statusStyles.badge}`}>
                <Icon icon={icon} size={16} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="text-xs font-semibold text-foreground tracking-tight">{t.title}</div>
                {t.message && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed break-words font-normal">
                    {t.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md p-1 transition-colors cursor-pointer"
                aria-label="Tutup notifikasi"
              >
                <Icon icon={Cancel01Icon} size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
