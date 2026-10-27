import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../contexts/ProfileContext'
import { useToast } from '../../contexts/ToastContext'
import { MEETING_TYPES, MEETING_TYPE_LABELS } from '../../lib/types'
import type { MeetingType } from '../../lib/types'

interface MeetingFormProps {
  contactId?: number
  dealId?: number
  companyId?: number
  onSaved: () => void
  onCancel: () => void
}

export default function MeetingForm({ contactId, dealId, companyId, onSaved, onCancel }: MeetingFormProps) {
  const { profile } = useProfile()
  const { addToast } = useToast()
  const [title, setTitle] = useState('')
  const [meetingType, setMeetingType] = useState<MeetingType>('video')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) { addToast('Title is required', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('meetings').insert({
      title: title.trim(),
      description: description.trim() || null,
      meeting_type: meetingType,
      start_time: startTime || null,
      end_time: endTime || null,
      location: location.trim() || null,
      organizer_id: profile?.id ?? null,
      contact_id: contactId ?? null,
      deal_id: dealId ?? null,
      company_id: companyId ?? null,
    })
    setSaving(false)
    if (error) addToast(error.message, 'error')
    else { addToast('Meeting scheduled', 'success'); onSaved() }
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4 bg-white dark:bg-slate-900">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Schedule Meeting</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Discovery call with..." className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Type</label>
          <select value={meetingType} onChange={(e) => setMeetingType(e.target.value as MeetingType)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
            {MEETING_TYPES.map((t) => <option key={t} value={t}>{MEETING_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Google Meet / Office" className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Start Time</label>
          <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">End Time</label>
          <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Schedule'}</button>
        <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">Cancel</button>
      </div>
    </div>
  )
}
