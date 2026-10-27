import { useEffect, useState } from 'react'
import { useProfile } from '../../contexts/ProfileContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import { canManageUsers } from '../../lib/permissions'
import type { Profile, UserRole, Team } from '../../lib/types'
import { USER_ROLES, USER_ROLE_LABELS } from '../../lib/types'
import { Shield, UserX, UserCheck } from 'lucide-react'

export default function UserManagement() {
  const { profile, refreshProfiles } = useProfile()
  const { addToast } = useToast()
  const [users, setUsers] = useState<Profile[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = canManageUsers(profile)

  async function fetchAll() {
    const [usersRes, teamsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('teams').select('*').order('name'),
    ])
    setUsers(usersRes.data ?? [])
    setTeams(teamsRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  async function updateRole(userId: string, role: UserRole) {
    if (userId === profile?.id) { addToast("You can't change your own role", 'error'); return }
    const { error } = await supabase.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', userId)
    if (error) addToast(error.message, 'error')
    else { addToast('Role updated', 'success'); fetchAll(); refreshProfiles() }
  }

  async function updateTeam(userId: string, teamId: string | null) {
    const { error } = await supabase.from('profiles').update({ team_id: teamId, updated_at: new Date().toISOString() }).eq('id', userId)
    if (error) addToast(error.message, 'error')
    else { addToast('Team updated', 'success'); fetchAll(); refreshProfiles() }
  }

  async function toggleActive(user: Profile) {
    if (user.id === profile?.id) { addToast("You can't deactivate yourself", 'error'); return }
    const newActive = !user.is_active
    const { error } = await supabase.from('profiles').update({ is_active: newActive, updated_at: new Date().toISOString() }).eq('id', user.id)
    if (error) addToast(error.message, 'error')
    else { addToast(newActive ? 'User activated' : 'User deactivated', 'success'); fetchAll(); refreshProfiles() }
  }

  function displayName(p: Profile) {
    return p.full_name ?? p.email.split('@')[0]
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Users</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Only admins can manage users.</p>
      </div>
    )
  }

  if (loading) return <div className="text-sm text-slate-500 dark:text-slate-400">Loading users...</div>

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Users</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage team member roles and access. New users are created when they sign up via Supabase Auth.</p>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">User</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Role</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Team</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Status</th>
              <th className="w-16 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {users.map((u) => (
              <tr key={u.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 ${!u.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {displayName(u)}
                    {u.id === profile?.id && <span className="text-xs text-brand-600 dark:text-brand-400">(you)</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                    disabled={u.id === profile?.id}
                    className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                  >
                    {USER_ROLES.map((r) => <option key={r} value={r}>{USER_ROLE_LABELS[r]}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.team_id ?? ''}
                    onChange={(e) => updateTeam(u.id, e.target.value || null)}
                    className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">No team</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.is_active ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    <Shield size={12} />
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.id !== profile?.id && (
                    <button
                      onClick={() => toggleActive(u)}
                      title={u.is_active ? 'Deactivate' : 'Activate'}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                    >
                      {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
