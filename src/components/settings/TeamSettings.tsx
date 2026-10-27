import { useEffect, useState } from 'react'
import { useProfile } from '../../contexts/ProfileContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import { canManageTeams } from '../../lib/permissions'
import type { Team } from '../../lib/types'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function TeamSettings() {
  const { profile, profiles } = useProfile()
  const { addToast } = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [managerId, setManagerId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isAdmin = canManageTeams(profile)

  async function fetchTeams() {
    const { data } = await supabase.from('teams').select('*').order('name')
    setTeams(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchTeams() }, [])

  function openCreate() {
    setEditingTeam(null)
    setName('')
    setDescription('')
    setManagerId(null)
    setShowForm(true)
  }

  function openEdit(team: Team) {
    setEditingTeam(team)
    setName(team.name)
    setDescription(team.description ?? '')
    setManagerId(team.manager_id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!name.trim()) { addToast('Team name is required', 'error'); return }
    setSaving(true)
    const payload = { name: name.trim(), description: description.trim() || null, manager_id: managerId }

    if (editingTeam) {
      const { error } = await supabase.from('teams').update(payload).eq('id', editingTeam.id)
      if (error) addToast(error.message, 'error')
      else addToast('Team updated', 'success')
    } else {
      const { error } = await supabase.from('teams').insert(payload)
      if (error) addToast(error.message, 'error')
      else addToast('Team created', 'success')
    }
    setSaving(false)
    setShowForm(false)
    fetchTeams()
  }

  async function handleDelete(team: Team) {
    if (!confirm(`Delete team "${team.name}"?`)) return
    const { error } = await supabase.from('teams').delete().eq('id', team.id)
    if (error) addToast(error.message, 'error')
    else { addToast('Team deleted', 'success'); fetchTeams() }
  }

  function managerName(id: string | null) {
    if (!id) return '—'
    const p = profiles.find((pr) => pr.id === id)
    return p?.full_name ?? p?.email.split('@')[0] ?? '—'
  }

  if (loading) return <div className="text-sm text-slate-500 dark:text-slate-400">Loading teams...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Teams</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Organize your sales team into groups.</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
            <Plus size={16} /> New Team
          </button>
        )}
      </div>

      {showForm && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4 bg-white dark:bg-slate-900">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{editingTeam ? 'Edit Team' : 'New Team'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Manager</label>
              <select value={managerId ?? ''} onChange={(e) => setManagerId(e.target.value || null)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">None</option>
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name ?? p.email.split('@')[0]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : editingTeam ? 'Update' : 'Create'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {teams.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No teams created yet.</p>
      ) : (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Manager</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Description</th>
                {isAdmin && <th className="w-20 px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {teams.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{managerName(t.manager_id)}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-xs">{t.description ?? '—'}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(t)} title="Edit" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(t)} title="Delete" className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
