import { useState } from 'react'
import UniversalImportWizard from '../import/UniversalImportWizard'
import ImportHistory from '../import/ImportHistory'
import ExportBuilder from '../export/ExportBuilder'

export default function ImportExportSettings() {
  const [tab, setTab] = useState<'import' | 'export' | 'history'>('import')

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-0">
        {(['import', 'export', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-brand-600 text-brand-700 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'import' && <UniversalImportWizard />}
      {tab === 'export' && <ExportBuilder />}
      {tab === 'history' && <ImportHistory />}
    </div>
  )
}
