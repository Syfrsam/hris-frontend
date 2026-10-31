import React, { useState, useRef } from 'react'
import { Building01Icon, Menu01Icon, Cancel01Icon, Camera01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '../common/Icon'
import { Avatar } from '../common/Avatar'
import { AvatarCropModal } from '../common/AvatarCropModal'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/api'
import { Button } from '../ui/button'

interface NavbarProps {
  onToggleMobileMenu?: () => void
  isMobileMenuOpen?: boolean
  onNavigateSettings?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen = false,
  onNavigateSettings,
}) => {
  const { user, refreshUser } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [cropSourceImage, setCropSourceImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const roleLabel = user?.roles?.[0] || 'Employee'
  const subLabel =
    user?.employee?.department?.name ||
    (roleLabel === 'Superadmin' ? 'Administrator Sistem' : 'Head Office Jakarta')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('File harus berupa gambar (JPG, PNG, atau WEBP).')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Ukuran file maksimal 10 MB.')
        return
      }
      setErrorMsg(null)
      const reader = new FileReader()
      reader.onload = () => {
        setCropSourceImage(reader.result as string)
        setIsCropModalOpen(true)
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    }
  }

  const handleUploadAvatar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return
    setIsUploading(true)
    setErrorMsg(null)
    try {
      const formData = new FormData()
      formData.append('avatar', selectedFile)
      await authService.updateAvatar(formData)
      await refreshUser()
      setIsModalOpen(false)
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal mengunggah foto profil.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
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
            <button
              type="button"
              onClick={onNavigateSettings || (() => setIsModalOpen(true))}
              title="Buka Pengaturan Akun"
              className="relative group w-8 h-8 rounded-lg overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            >
              <Avatar src={user?.avatar_url} name={user?.name} size="sm" className="w-full h-full" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity z-10">
                <Icon icon={Camera01Icon} size={13} />
              </div>
            </button>
            <button
              type="button"
              onClick={onNavigateSettings}
              className="hidden sm:block text-left cursor-pointer hover:opacity-85 transition-opacity"
              title="Buka Pengaturan Akun"
            >
              <div className="text-xs font-medium text-foreground leading-none">{user?.name}</div>
              <div className="text-[10px] font-medium uppercase text-primary mt-0.5">
                {roleLabel}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Avatar Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-semibold text-foreground">Ubah Foto Profil</h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedFile(null)
                  setPreviewUrl(null)
                  setErrorMsg(null)
                }}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Icon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            <form onSubmit={handleUploadAvatar} className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/40 relative">
                  <Avatar
                    src={previewUrl || user?.avatar_url}
                    name={user?.name}
                    size="xl"
                    className="w-full h-full rounded-full"
                  />
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <Icon icon={Camera01Icon} size={14} />
                    <span>{previewUrl ? 'Ganti Foto' : 'Pilih Foto'}</span>
                  </Button>
                  {previewUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (cropSourceImage) setIsCropModalOpen(true)
                      }}
                      className="text-xs font-medium cursor-pointer"
                    >
                      Sesuaikan Posisi
                    </Button>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">Format JPG, PNG, WEBP (maks. 1 MB, kompres otomatis).</span>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsModalOpen(false)
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!selectedFile || isUploading}
                  className="text-xs font-medium"
                >
                  {isUploading ? 'Mengunggah...' : 'Simpan Foto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Avatar Crop & Compress Modal */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropSourceImage}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={(croppedFile, preview) => {
          setSelectedFile(croppedFile)
          setPreviewUrl(preview)
        }}
        maxOutputDimension={512}
        maxFileSizeBytes={1024 * 1024}
      />
    </>
  )
}
