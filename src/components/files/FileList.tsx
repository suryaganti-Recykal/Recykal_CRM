import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../contexts/ProfileContext'
import { useToast } from '../../contexts/ToastContext'
import type { FileAttachment } from '../../lib/types'
import { Upload, Download, Trash2, File, Image, FileText } from 'lucide-react'

interface FileListProps {
  entityType: 'contact' | 'company' | 'deal'
  entityId: number
}

function fileIcon(mime: string | null) {
  if (mime?.startsWith('image/')) return Image
  if (mime?.includes('pdf')) return FileText
  return File
}

function formatSize(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function FileList({ entityType, entityId }: FileListProps) {
  const { profile } = useProfile()
  const { addToast } = useToast()
  const [files, setFiles] = useState<FileAttachment[]>([])
  const [uploading, setUploading] = useState(false)

  async function fetchFiles() {
    const { data } = await supabase.from('files').select('*').eq('entity_type', entityType).eq('entity_id', entityId).order('created_at', { ascending: false })
    setFiles(data ?? [])
  }

  useEffect(() => { fetchFiles() }, [entityType, entityId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `${entityType}/${entityId}/${Date.now()}_${file.name}`
    const { error: uploadErr } = await supabase.storage.from('crm-files').upload(path, file)
    if (uploadErr) { addToast(uploadErr.message, 'error'); setUploading(false); return }
    const { error: dbErr } = await supabase.from('files').insert({
      entity_type: entityType,
      entity_id: entityId,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: path,
      uploaded_by: profile?.id ?? null,
    })
    setUploading(false)
    if (dbErr) addToast(dbErr.message, 'error')
    else { addToast('File uploaded', 'success'); fetchFiles() }
    e.target.value = ''
  }

  async function handleDownload(f: FileAttachment) {
    const { data } = await supabase.storage.from('crm-files').createSignedUrl(f.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function handleDelete(f: FileAttachment) {
    if (!confirm(`Delete "${f.file_name}"?`)) return
    await supabase.storage.from('crm-files').remove([f.storage_path])
    await supabase.from('files').delete().eq('id', f.id)
    fetchFiles()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Files</h4>
        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 cursor-pointer transition-colors">
          <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No files attached.</p>
      ) : (
        <div className="space-y-2">
          {files.map((f) => {
            const Icon = fileIcon(f.mime_type)
            return (
              <div key={f.id} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                <Icon size={18} className="text-slate-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{f.file_name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{formatSize(f.file_size)}</div>
                </div>
                <button onClick={() => handleDownload(f)} title="Download" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"><Download size={14} /></button>
                <button onClick={() => handleDelete(f)} title="Delete" className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
