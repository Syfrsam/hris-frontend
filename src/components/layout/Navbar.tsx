import React from 'react'
import { Building01Icon, Menu01Icon, Cancel01Icon, UserIcon } from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'

interface NavbarProps {
  onToggleMobileMenu?: () => void
  isMobileMenuOpen?: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen = false,
}) => {
  const { user } = useAuth()

  const roleLabel = user?.roles?.[0] || 'Employee'
  const subLabel =
    user?.employee?.department?.name ||
    (roleLabel === 'Superadmin' ? 'Administrator Sistem' : 'Head Office Jakarta')

  return (
    <header className="h-16 bg-card border-b border-border sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 md:hidden transition-colors cursor-pointer"
          aria-label={isMobileMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
        >
          <Icon icon={isMobileMenuOpen ? Cancel01Icon : Menu01Icon} size={20} />
        </button>

        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-xs shrink-0">
          <Icon icon={Building01Icon} size={18} />
        </div>
        <div>
          <div className="text-sm font-medium text-foreground leading-tight tracking-tight">
            HRIS Enterprise
          </div>
          <div className="text-[11px] text-muted-foreground font-normal">{subLabel}</div>
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center space-x-3">
        {user?.employee?.employee_code && (
          <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-[11px] font-medium border border-border">
            NIK: {user.employee.employee_code}
          </span>
        )}

        <div className="flex items-center space-x-2.5 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
            {user?.name?.charAt(0).toUpperCase() || <Icon icon={UserIcon} size={14} />}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-medium text-foreground leading-none">{user?.name}</div>
            <div className="text-[10px] font-medium uppercase text-primary mt-0.5">
              {roleLabel}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
