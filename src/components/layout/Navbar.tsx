import React from 'react'
import { Building01Icon, Menu01Icon, Cancel01Icon, UserIcon } from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import type { Role } from '../../types'

interface NavbarProps {
  onToggleMobileMenu?: () => void
  isMobileMenuOpen?: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen = false,
}) => {
  const { user, demoLogin } = useAuth()

  return (
    <header className="h-16 bg-card border-b border-border sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 md:hidden transition-colors"
          aria-label={isMobileMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
        >
          <Icon icon={isMobileMenuOpen ? Cancel01Icon : Menu01Icon} size={20} />
        </button>

        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-xs shrink-0">
          <Icon icon={Building01Icon} size={18} />
        </div>
        <div>
          <div className="text-sm font-medium text-foreground leading-tight tracking-tight">HRIS Enterprise</div>
          <div className="text-[11px] text-muted-foreground font-normal">Head Office Jakarta</div>
        </div>
      </div>

      {/* User Info & Switcher */}
      <div className="flex items-center space-x-3">
        {/* Quick Role Switcher */}
        <div className="hidden md:flex items-center space-x-1 bg-muted p-1 rounded-lg text-xs">
          <span className="text-muted-foreground px-2 py-0.5 text-[11px] font-normal">Demo:</span>
          {(['Employee', 'Manager', 'HR Staff', 'HR Manager'] as Role[]).map((r) => {
            const isCurrent = user?.roles?.includes(r)
            return (
              <button
                key={r}
                type="button"
                onClick={() => demoLogin(r)}
                className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground font-normal shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card font-normal'
                }`}
              >
                {r.replace('Manager', 'Mgr')}
              </button>
            )
          })}
        </div>

        {/* Profile Card */}
        <div className="flex items-center space-x-2.5 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-normal text-xs shrink-0">
            {user?.name?.charAt(0) || <Icon icon={UserIcon} size={14} />}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-normal text-foreground leading-none">{user?.name}</div>
            <div className="text-[10px] font-normal uppercase text-primary mt-0.5">
              {user?.roles?.[0] || 'Karyawan'}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
