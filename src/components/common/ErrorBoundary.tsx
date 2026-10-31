import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircleIcon, RefreshIcon } from '@hugeicons/core-free-icons'
import { Icon } from './Icon'
import { Button } from '../ui/button'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-10 my-4 max-w-xl mx-auto rounded-2xl bg-card border border-border shadow-xs text-center space-y-4 font-sans animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <Icon icon={AlertCircleIcon} size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {this.props.fallbackTitle || 'Gagal Memuat Konten Halaman'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
              Terjadi kendala saat menampilkan data pada bagian ini. Navigasi menu lain tetap dapat Anda gunakan secara normal.
            </p>
          </div>

          {this.state.error?.message && (
            <div className="p-2.5 rounded-lg bg-muted text-[11px] font-mono text-muted-foreground break-all max-h-24 overflow-y-auto text-left">
              {this.state.error.message}
            </div>
          )}

          <div className="pt-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={this.handleReset}
              className="gap-2 text-xs font-semibold px-4 h-8.5 rounded-lg cursor-pointer"
            >
              <Icon icon={RefreshIcon} size={14} />
              <span>Muat Ulang Halaman</span>
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
