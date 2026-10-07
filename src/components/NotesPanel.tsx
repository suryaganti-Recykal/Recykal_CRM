import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Note, NoteEntityType } from '../lib/types'
import { useAuth } from '../contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { Trash2 } from 'lucide-react'

export default function NotesPanel({ entityType, entityId }: { entityType: NoteEntityType; entityId: number }) {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [entityType, entityId])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
    if (!error && data) setNotes(data as Note[])
    setLoading(false)
  }

  async function addNote() {
    if (!draft.trim()) return
    setSaving(true)
    const { error } = await supabase.from('notes').insert({
      entity_type: entityType,
      entity_id: entityId,
      body: draft.trim(),
      author: user?.email ?? null,
    })
    setSaving(false)
    if (!error) {
      setDraft('')
      load()
    }
  }

  async function deleteNote(id: number) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    await supabase.from('notes').delete().eq('id', id)
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note…"
          rows={2}
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
        <button
          onClick={addNote}
          disabled={saving || !draft.trim()}
          className="px-4 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60 self-end py-2"
        >
          Add
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400 dark:text-slate-500">Loading notes…</p>}
      {!loading && notes.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">No notes yet.</p>}

      <div className="space-y-3">
        {notes.map((n) => (
          <div key={n.id} className="group rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-800/40">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{n.body}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {n.author ?? 'Unknown'} · {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </p>
              <button
                onClick={() => deleteNote(n.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
