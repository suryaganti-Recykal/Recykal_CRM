import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Tag } from '../../lib/types'
import { X, Plus } from 'lucide-react'

interface TagPickerProps {
  entityType: 'contact' | 'company' | 'deal'
  entityId: number
}

export default function TagPicker({ entityType, entityId }: TagPickerProps) {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [activeTags, setActiveTags] = useState<Tag[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newTagName, setNewTagName] = useState('')

  async function fetchTags() {
    const [tagsRes, activeRes] = await Promise.all([
      supabase.from('tags').select('*').or(`entity_type.is.null,entity_type.eq.${entityType}`).order('name'),
      supabase.from('entity_tags').select('tag_id').eq('entity_type', entityType).eq('entity_id', entityId),
    ])
    const allT = tagsRes.data ?? []
    const activeIds = new Set((activeRes.data ?? []).map((r) => r.tag_id))
    setAllTags(allT)
    setActiveTags(allT.filter((t) => activeIds.has(t.id)))
  }

  useEffect(() => { fetchTags() }, [entityType, entityId])

  async function addTag(tag: Tag) {
    await supabase.from('entity_tags').upsert({ tag_id: tag.id, entity_type: entityType, entity_id: entityId })
    fetchTags()
  }

  async function removeTag(tagId: string) {
    await supabase.from('entity_tags').delete().match({ tag_id: tagId, entity_type: entityType, entity_id: entityId })
    fetchTags()
  }

  async function createAndAdd() {
    if (!newTagName.trim()) return
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6']
    const color = colors[Math.floor(Math.random() * colors.length)]
    const { data } = await supabase.from('tags').insert({ name: newTagName.trim(), color, entity_type: entityType }).select().single()
    if (data) await addTag(data)
    setNewTagName('')
    setShowAdd(false)
  }

  const unselected = allTags.filter((t) => !activeTags.some((a) => a.id === t.id))

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {activeTags.map((tag) => (
          <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: tag.color }}>
            {tag.name}
            <button onClick={() => removeTag(tag.id)} className="hover:opacity-70"><X size={12} /></button>
          </span>
        ))}
        {unselected.length > 0 && (
          <select onChange={(e) => { const t = allTags.find((x) => x.id === e.target.value); if (t) addTag(t); e.target.value = '' }} className="text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5">
            <option value="">+ Tag</option>
            {unselected.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
        <button onClick={() => setShowAdd(true)} className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
          <Plus size={12} /> New
        </button>
      </div>
      {showAdd && (
        <div className="flex gap-2 items-center">
          <input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createAndAdd()} placeholder="Tag name" className="text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-brand-500" autoFocus />
          <button onClick={createAndAdd} className="text-xs text-brand-600 dark:text-brand-400 font-medium">Add</button>
          <button onClick={() => { setShowAdd(false); setNewTagName('') }} className="text-xs text-slate-500">Cancel</button>
        </div>
      )}
    </div>
  )
}
