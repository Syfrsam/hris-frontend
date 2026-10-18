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
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success'
          const isError = t.type === 'error'
          const isWarning = t.type === 'warning'

          const bgColor = 'bg-brand-dark/95 border-border text-white'

          const icon = isSuccess
            ? CheckmarkCircle01Icon
            : isError
            ? AlertCircleIcon
            : isWarning
            ? AlertCircleIcon
            : InformationCircleIcon

          const iconColor = isSuccess
            ? 'text-primary'
            : isError
            ? 'text-secondary'
            : isWarning
            ? 'text-secondary'
            : 'text-primary'

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-2xl border shadow-xl backdrop-blur-md flex items-start space-x-3 transition-all duration-300 ${bgColor}`}
            >
              <div className="shrink-0 mt-0.5">
                <Icon icon={icon} size={22} className={iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium tracking-tight">{t.title}</div>
                {t.message && (
                  <p className="text-xs mt-0.5 opacity-90 leading-relaxed break-words">
                    {t.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-slate-400 hover:text-white transition-colors p-1"
              >
                <Icon icon={Cancel01Icon} size={16} />
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
