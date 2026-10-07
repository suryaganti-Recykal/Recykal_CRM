function initialsFrom(text: string): string {
  const parts = text.trim().split(/[\s@.]+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function Avatar({ label, size = 32 }: { label: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full bg-brand-600 text-white font-medium shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initialsFrom(label)}
    </div>
  )
}
