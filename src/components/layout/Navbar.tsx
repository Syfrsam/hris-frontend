import React from 'react'
import { Building01Icon, Logout01Icon, UserIcon } from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import type { Role } from '../../types'

export const Navbar: React.FC = () => {
  const { user, logout, demoLogin } = useAuth()

  return (
    <header className="h-20 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-6 lg:px-8 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Icon icon={Building01Icon} size={22} />
        </div>
        <div>
          <div className="text-base font-bold text-slate-900 leading-tight">HRIS Enterprise</div>
          <div className="text-xs text-slate-500 font-medium">Head Office Jakarta</div>
        </div>
      </div>

      {/* User Info & Switcher */}
      <div className="flex items-center space-x-3">
        {/* Quick Role Switcher Pill */}
        <div className="hidden md:flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <span className="text-slate-500 px-2 py-1">Ganti Demo:</span>
          {(['Employee', 'Manager', 'HR Staff', 'HR Manager'] as Role[]).map((r) => {
            const isCurrent = user?.roles?.includes(r)
            return (
              <button
                key={r}
                type="button"
                onClick={() => demoLogin(r)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {r.replace('Manager', 'Mgr')}
              </button>
            )
          })}
        </div>

        {/* Profile Card */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
            {user?.name?.charAt(0) || <Icon icon={UserIcon} size={16} />}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-900">{user?.name}</div>
            <div className="text-[10px] font-semibold uppercase text-indigo-600">
              {user?.roles?.[0] || 'Karyawan'}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Keluar / Logout"
          >
            <Icon icon={Logout01Icon} size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
