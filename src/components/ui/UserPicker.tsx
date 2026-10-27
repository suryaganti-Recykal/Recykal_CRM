import { useProfile } from '../../contexts/ProfileContext'
import type { Profile } from '../../lib/types'

interface UserPickerProps {
  value: string | null
  onChange: (userId: string | null) => void
  label?: string
  placeholder?: string
  allowClear?: boolean
  disabled?: boolean
  className?: string
}

export default function UserPicker({
  value,
  onChange,
  label,
  placeholder = 'Select user...',
  allowClear = true,
  disabled = false,
  className = '',
}: UserPickerProps) {
  const { profiles } = useProfile()

  function displayName(p: Profile) {
    if (p.full_name) return p.full_name
    return p.email.split('@')[0]
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
          {label}
        </label>
      )}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
      >
        <option value="">{allowClear ? placeholder : '— Select —'}</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {displayName(p)} ({p.role})
          </option>
        ))}
      </select>
    </div>
  )
}
