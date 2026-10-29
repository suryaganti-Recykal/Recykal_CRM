import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useProfile } from '../contexts/ProfileContext'
import type { DealStage, Pipeline } from '../lib/types'
import { DEAL_STAGES, DEAL_STAGE_LABELS, PIPELINES, PIPELINE_LABELS, CONTACT_STATUS_LABELS, type ContactStatus } from '../lib/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { format } from 'date-fns'
import {
  Users, Building2, Handshake, TrendingUp, Trophy, XCircle, Mail,
  Briefcase, ArrowUpRight, Target, Flame, Clock
} from 'lucide-react'

interface ChartItem { name: string; count: number }

interface DashboardStats {
  company_count: number
  contact_count: number
  deal_count: number
  open_deals: number
  open_deals_value: number
  won_deals: number
  won_value: number
  lost_deals: number
  win_rate: number | null
  new_contacts_7d: number
  application_count: number
  subscriber_count: number
  new_applications_7d: number
  new_subscribers_7d: number
  epr_contact_count: number
  drs_contact_count: number
  contacts_by_status: ChartItem[]
  contacts_by_category: ChartItem[]
  contacts_by_epr_category: ChartItem[]
  contacts_drs_by_city: ChartItem[]
  companies_by_industry: ChartItem[]
  companies_by_vertical: ChartItem[]
  deals_by_stage: ChartItem[]
  deals_by_pipeline: ChartItem[]
  applications_by_interest: ChartItem[]
}

function greeting(name: string | null): string {
  const h = new Date().getHours()
  const first = name?.split(' ')[0] ?? 'there'
  if (h < 12) return `Good morning, ${first}`
  if (h < 17) return `Good afternoon, ${first}`
  return `Good evening, ${first}`
}

// Recykal brand palette (Brand Guidelines). Stages run cool -> green as a deal
// progresses, so the funnel reads as "colder = earlier". Lost is the one
// deliberate exception: the brand palette has no warning colour, so it uses a
// neutral slate rather than inventing an off-brand red.
const stageBarColors: Record<DealStage, string> = {
  prospecting: '#567DE8',        // Blue
  qualification: '#005DFF',      // Bright Blue
  proposal: '#8460D4',           // Medium Purple
  negotiation: '#024C8A',        // Midnight Blue
  po_received: '#1DC797',        // Bright Green
  order_confirmation: '#049769', // Dark Green
  won: '#3E7D44',                // Fern Green
  lost: '#94A3B8',               // neutral — intentionally not a brand colour
}

const pipelineBarColors: Record<Pipeline, string> = {
  epr: '#049769',          // Dark Green
  itad: '#005DFF',         // Bright Blue
  rethink_plus: '#8460D4', // Medium Purple
  ddrs: '#1DC797',         // Bright Green
}

interface StatCardProps {
  label: string
  value: number | string
  sublabel?: string
  to?: string
  icon?: typeof Users
  trend?: { direction: 'up' | 'down' | 'flat'; label: string }
  accent?: 'brand' | 'blue' | 'purple' | 'amber' | 'rose'
}

const accentStyles: Record<NonNullable<StatCardProps['accent']>, { bg: string; icon: string; ring: string }> = {
  brand:  { bg: 'bg-brand-50 dark:bg-brand-500/10',    icon: 'text-brand-700 dark:text-brand-400',       ring: 'group-hover:ring-brand-500/40' },
  blue:   { bg: 'bg-blue-50 dark:bg-blue-500/10',      icon: 'text-blue-700 dark:text-blue-400',          ring: 'group-hover:ring-blue-500/40' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-500/10',  icon: 'text-purple-700 dark:text-purple-400',      ring: 'group-hover:ring-purple-500/40' },
  amber:  { bg: 'bg-amber-50 dark:bg-amber-500/10',    icon: 'text-amber-700 dark:text-amber-400',        ring: 'group-hover:ring-amber-500/40' },
  rose:   { bg: 'bg-rose-50 dark:bg-rose-500/10',      icon: 'text-rose-700 dark:text-rose-400',          ring: 'group-hover:ring-rose-500/40' },
}

function StatCard({ label, value, sublabel, to, icon: Icon, trend, accent = 'brand' }: StatCardProps) {
  const a = accentStyles[accent]
  const content = (
    <div className={`group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 h-full shadow-elevation-sm transition-all hover:shadow-elevation-md ring-0 ring-transparent ${a.ring} hover:ring-2`}>
      <div className="flex items-start justify-between mb-3">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${a.bg} ${a.icon} flex items-center justify-center`}>
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
        {to && (
          <ArrowUpRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100" />
        )}
      </div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">{value}</p>
      <div className="flex items-center gap-2 mt-2 min-h-[18px]">
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded ${
            trend.direction === 'up' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
            trend.direction === 'down' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '—'} {trend.label}
          </span>
        )}
        {sublabel && <p className="text-xs text-slate-500 dark:text-slate-400">{sublabel}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to} className="block">{content}</Link> : content
}

function formatValue(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`
  return `₹${v.toLocaleString('en-IN')}`
}

export default function Dashboard() {
  const { profile } = useProfile()
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data, error } = await supabase.rpc('dashboard_stats')
    if (!error && data) setStats(data as DashboardStats)
  }

  if (!stats) {
    return <div className="p-8 text-slate-400 dark:text-slate-500">Loading dashboard…</div>
  }

  const closedDeals = stats.won_deals + stats.lost_deals

  const contactsByStatus = stats.contacts_by_status.map((row) => ({
    ...row,
    name: CONTACT_STATUS_LABELS[row.name as ContactStatus] ?? row.name,
  }))

  const dealsByStage = DEAL_STAGES.map((stage) => ({
    name: DEAL_STAGE_LABELS[stage],
    stage,
    count: stats.deals_by_stage.find((d) => d.name === stage)?.count ?? 0,
  }))
  const dealsByPipeline = PIPELINES.map((pipeline) => ({
    name: PIPELINE_LABELS[pipeline],
    pipeline,
    count: stats.deals_by_pipeline.find((d) => d.name === pipeline)?.count ?? 0,
  }))

  const today = format(new Date(), 'EEEE, MMMM d')

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in-up">
      {/* Hero: personalized greeting with gradient wash. Sets the tone of
          "this is your workspace" rather than "here's a report". */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient-mesh shadow-elevation-md p-6 lg:p-8 mb-8 text-white">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">{today}</div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{greeting(profile?.full_name ?? null)}</h1>
            <p className="text-sm text-white/80 mt-1.5 max-w-md">
              {stats.open_deals > 0
                ? `You have ${stats.open_deals} open deals worth ${formatValue(stats.open_deals_value)} in play.`
                : "Let's get some deals moving today."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/deals" className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors btn-press">
              <Handshake size={16} /> View Pipeline
            </Link>
            <Link to="/contacts" className="hidden sm:inline-flex items-center gap-2 bg-white text-brand-700 hover:bg-white/90 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors btn-press shadow-elevation-sm">
              <Users size={16} /> Contacts
            </Link>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Target size={14} className="text-brand-600 dark:text-brand-400" />
        <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Sales Pipeline</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Companies" value={stats.company_count.toLocaleString()} to="/companies" icon={Building2} accent="blue" />
        <StatCard label="Open Deals" value={stats.open_deals} sublabel={formatValue(stats.open_deals_value)} to="/deals" icon={Flame} accent="amber" />
        <StatCard label="Won Value" value={formatValue(stats.won_value)} sublabel={`${stats.won_deals} deals won`} to="/deals" icon={Trophy} accent="brand" />
        <StatCard label="Win Rate" value={stats.win_rate == null ? '—' : `${stats.win_rate}%`} sublabel={`${closedDeals} closed`} to="/deals" icon={TrendingUp} accent="purple" />
        <StatCard label="Lost Deals" value={stats.lost_deals} to="/deals" icon={XCircle} accent="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-elevation-sm hover:shadow-elevation-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            Deals by Stage
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dealsByStage} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {dealsByStage.map((entry) => (
                  <Cell key={entry.stage} fill={stageBarColors[entry.stage]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-elevation-sm hover:shadow-elevation-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-recykal-bright-blue" />
            Deals by Pipeline
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dealsByPipeline} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {dealsByPipeline.map((entry) => (
                  <Cell key={entry.pipeline} fill={pipelineBarColors[entry.pipeline]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-elevation-sm hover:shadow-elevation-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-recykal-midnight-blue" />
            Companies by Industry
          </h2>
          {stats.companies_by_industry.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">No companies yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.companies_by_industry} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#024C8A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Clock size={14} className="text-brand-600 dark:text-brand-400" />
        <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Leads & Marketing</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Contacts" value={stats.contact_count.toLocaleString()} sublabel={`${stats.new_contacts_7d} new this week`} to="/contacts" icon={Users} accent="brand" trend={stats.new_contacts_7d > 0 ? { direction: 'up', label: `+${stats.new_contacts_7d}` } : undefined} />
        <StatCard label="EPR Inquiries" value={stats.epr_contact_count} sublabel="via EPR form" icon={Target} accent="purple" />
        <StatCard label="DRS Inquiries" value={stats.drs_contact_count} sublabel="via DRS form" icon={Target} accent="blue" />
        <StatCard label="Career Applications" value={stats.application_count} sublabel={`${stats.new_applications_7d} new this week`} to="/careers" icon={Briefcase} accent="amber" trend={stats.new_applications_7d > 0 ? { direction: 'up', label: `+${stats.new_applications_7d}` } : undefined} />
        <StatCard label="Newsletter Subscribers" value={stats.subscriber_count} sublabel={`${stats.new_subscribers_7d} new this week`} to="/newsletter" icon={Mail} accent="rose" trend={stats.new_subscribers_7d > 0 ? { direction: 'up', label: `+${stats.new_subscribers_7d}` } : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-elevation-sm hover:shadow-elevation-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-recykal-dark-green" />
            Contacts by Category
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.contacts_by_category} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#049769" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-elevation-sm hover:shadow-elevation-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-recykal-purple" />
            Applications by Interest Area
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.applications_by_interest} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#8460D4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-elevation-sm hover:shadow-elevation-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-recykal-bright-blue" />
            EPR Inquiries by Category
          </h2>
          {stats.contacts_by_epr_category.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">No EPR submissions yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.contacts_by_epr_category} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#005DFF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-elevation-sm hover:shadow-elevation-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-recykal-bright-green" />
            DRS Inquiries by City
          </h2>
          {stats.contacts_drs_by_city.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">No DRS submissions yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.contacts_drs_by_city} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1DC797" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-elevation-sm hover:shadow-elevation-md transition-shadow lg:col-span-3">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-recykal-blue" />
            Contact Pipeline Status
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={contactsByStatus}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#567DE8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
