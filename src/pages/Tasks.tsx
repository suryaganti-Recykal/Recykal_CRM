import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Task, TaskPriority } from '../lib/types'
import { TASK_PRIORITIES } from '../lib/types'
import { useAuth } from '../contexts/AuthContext'
import { format, isPast, isToday, startOfDay } from 'date-fns'
import { Plus, Check, Trash2 } from 'lucide-react'
import Modal from '../components/ui/Modal'

const inputCls =
  'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500'
const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  high: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
}

type FilterTab = 'today' | 'upcoming' | 'overdue' | 'completed' | 'all'

interface NewTask {
  title: string
  description: string
  due_date: string
  priority: TaskPriority
  owner: string
}

const emptyForm: NewTask = { title: '', description: '', due_date: '', priority: 'medium', owner: '' }

export default function Tasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>('today')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<NewTask>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('tasks').select('*').order('due_date', { ascending: true, nullsFirst: false })
    if (!error && data) setTasks(data as Task[])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    const today = startOfDay(new Date())
    return tasks.filter((t) => {
      if (tab === 'all') return true
      if (tab === 'completed') return t.status === 'completed'
      if (t.status === 'completed') return false
      if (!t.due_date) return tab === 'upcoming'
      const due = startOfDay(new Date(t.due_date))
      if (tab === 'today') return isToday(due)
      if (tab === 'overdue') return isPast(due) && !isToday(due)
      if (tab === 'upcoming') return due > today
      return true
    })
  }, [tasks, tab])

  const counts = useMemo(() => {
    const today = startOfDay(new Date())
    const pending = tasks.filter((t) => t.status === 'pending')
    return {
      today: pending.filter((t) => t.due_date && isToday(startOfDay(new Date(t.due_date)))).length,
      overdue: pending.filter((t) => t.due_date && isPast(startOfDay(new Date(t.due_date))) && !isToday(startOfDay(new Date(t.due_date)))).length,
      upcoming: pending.filter((t) => !t.due_date || startOfDay(new Date(t.due_date)) > today).length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      all: tasks.length,
    }
  }, [tasks])

  async function handleCreate() {
    if (!form.title.trim()) return
    setSaving(true)
    const { error } = await supabase.from('tasks').insert({
      title: form.title,
      description: form.description || null,
      due_date: form.due_date || null,
      priority: form.priority,
      owner: form.owner || user?.email || null,
    })
    setSaving(false)
    if (!error) {
      setModalOpen(false)
      setForm(emptyForm)
      load()
    }
  }

  async function toggleComplete(task: Task) {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed'
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus, completed_at: nextStatus === 'completed' ? new Date().toISOString() : null } : t)))
    await supabase
      .from('tasks')
      .update({ status: nextStatus, completed_at: nextStatus === 'completed' ? new Date().toISOString() : null })
      .eq('id', task.id)
  }

  async function deleteTask(id: number) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'today', label: `Today (${counts.today})` },
    { key: 'overdue', label: `Overdue (${counts.overdue})` },
    { key: 'upcoming', label: `Upcoming (${counts.upcoming})` },
    { key: 'completed', label: `Completed (${counts.completed})` },
    { key: 'all', label: `All (${counts.all})` },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Tasks</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-brand-600 text-brand-700 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-slate-400 dark:text-slate-500 py-8 text-center">Loading…</div>}
      {!loading && filtered.length === 0 && (
        <div className="text-slate-400 dark:text-slate-500 py-12 text-center">No tasks here.</div>
      )}

      <div className="space-y-2">
        {filtered.map((t) => {
          const overdue = t.status === 'pending' && t.due_date && isPast(startOfDay(new Date(t.due_date))) && !isToday(startOfDay(new Date(t.due_date)))
          return (
            <div
              key={t.id}
              className="flex items-start gap-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 group"
            >
              <button
                onClick={() => toggleComplete(t)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  t.status === 'completed'
                    ? 'bg-brand-600 border-brand-600'
                    : 'border-slate-300 dark:border-slate-600 hover:border-brand-500'
                }`}
              >
                {t.status === 'completed' && <Check size={12} className="text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${t.status === 'completed' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                  {t.title}
                </p>
                {t.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.description}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${priorityColors[t.priority]}`}>{t.priority}</span>
                  {t.due_date && (
                    <span className={`text-xs ${overdue ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                      {format(new Date(t.due_date), 'MMM d, yyyy')}
                    </span>
                  )}
                  {t.owner && <span className="text-xs text-slate-400 dark:text-slate-500">· {t.owner}</span>}
                </div>
              </div>
              <button
                onClick={() => deleteTask(t.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Task">
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Title *</label>
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={2} className={`${inputCls} resize-none`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Due Date</label>
              <input type="date" className={inputCls} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Owner</label>
            <input className={inputCls} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder={user?.email ?? ''} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !form.title.trim()}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Add Task'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
