import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useProfile } from '../contexts/ProfileContext'
import type { Contact, CareerApplication, NewsletterSubscriber, Company, Deal, DealStage, Pipeline } from '../lib/types'
import { DEAL_STAGES, DEAL_STAGE_LABELS, PIPELINES, PIPELINE_LABELS, CONTACT_STATUS_LABELS, type ContactStatus } from '../lib/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { subDays, format } from 'date-fns'
import {
  Users, Building2, Handshake, TrendingUp, Trophy, XCircle, Mail,
  Briefcase, ArrowUpRight, Target, Flame, Clock
} from 'lucide-react'

interface Stats {
  contacts: Contact[]
  applications: CareerApplication[]
  subscribers: NewsletterSubscriber[]
  companies: Company[]
  deals: Deal[]
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

function countBy<T>(items: T[], key: (item: T) => string | null): { name: string; count: number }[] {
  const map = new Map<string, number>()
  for (const item of items) {
    const k = key(item) || 'Unspecified'
    map.set(k, (map.get(k) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

function formatValue(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`
  return `₹${v.toLocaleString('en-IN')}`
}

export default function Dashboard() {
  const { profile } = useProfile()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [contactsRes, applicationsRes, subscribersRes, companiesRes, dealsRes] = await Promise.all([
      supabase.from('contacts').select('*'),
      supabase.from('career_applications').select('*'),
      supabase.from('newsletter_subscribers').select('*'),
      supabase.from('companies').select('*'),
      supabase.from('deals').select('*'),
    ])
    setStats({
      contacts: (contactsRes.data as Contact[]) ?? [],
      applications: (applicationsRes.data as CareerApplication[]) ?? [],
      subscribers: (subscribersRes.data as NewsletterSubscriber[]) ?? [],
      companies: (companiesRes.data as Company[]) ?? [],
      deals: (dealsRes.data as Deal[]) ?? [],
    })
  }

  if (!stats) {
    return <div className="p-8 text-slate-400 dark:text-slate-500">Loading dashboard…</div>
  }

  const weekAgo = subDays(new Date(), 7)
  const newContactsThisWeek = stats.contacts.filter((c) => new Date(c.created_at) >= weekAgo).length
  const newApplicationsThisWeek = stats.applications.filter((a) => new Date(a.created_at) >= weekAgo).length
  const newSubscribersThisWeek = stats.subscribers.filter((s) => new Date(s.subscribed_at) >= weekAgo).length

  const contactsByCategory = countBy(stats.contacts, (c) => c.category)
  const applicationsByInterest = countBy(stats.applications, (a) => a.interest_area)
  const contactsByStatus = countBy(stats.contacts, (c) => c.contact_status).map((row) => ({
    ...row,
    name: CONTACT_STATUS_LABELS[row.name as ContactStatus] ?? row.name,
  }))
  const eprContacts = stats.contacts.filter((c) => c.epr_category)
  const contactsByEprCategory = countBy(eprContacts, (c) => c.epr_category)
  const drsContacts = stats.contacts.filter((c) => c.source === 'website_form_drs')
  const drsContactsByCity = countBy(drsContacts, (c) => c.city)

  const openDeals = stats.deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost')
  const wonDeals = stats.deals.filter((d) => d.stage === 'won')
  const lostDeals = stats.deals.filter((d) => d.stage === 'lost')
  const closedDeals = wonDeals.length + lostDeals.length
  const winRate = closedDeals > 0 ? Math.round((wonDeals.length / closedDeals) * 100) : null
  const openPipelineValue = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0)
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.value ?? 0), 0)

  const dealsByStage = DEAL_STAGES.map((stage) => ({
    name: DEAL_STAGE_LABELS[stage],
    stage,
    count: stats.deals.filter((d) => d.stage === stage).length,
  }))
  const dealsByPipeline = PIPELINES.map((pipeline) => ({
    name: PIPELINE_LABELS[pipeline],
    pipeline,
    count: stats.deals.filter((d) => d.pipeline === pipeline).length,
  }))
  const companiesByIndustry = countBy(stats.companies, (c) => c.industry)

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
              {openDeals.length > 0
                ? `You have ${openDeals.length} open deals worth ${formatValue(openPipelineValue)} in play.`
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
        <StatCard label="Companies" value={stats.companies.length} to="/companies" icon={Building2} accent="blue" />
        <StatCard label="Open Deals" value={openDeals.length} sublabel={formatValue(openPipelineValue)} to="/deals" icon={Flame} accent="amber" />
        <StatCard label="Won Value" value={formatValue(wonValue)} sublabel={`${wonDeals.length} deals won`} to="/deals" icon={Trophy} accent="brand" />
        <StatCard label="Win Rate" value={winRate == null ? '—' : `${winRate}%`} sublabel={`${closedDeals} closed`} to="/deals" icon={TrendingUp} accent="purple" />
        <StatCard label="Lost Deals" value={lostDeals.length} to="/deals" icon={XCircle} accent="rose" />
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
          {companiesByIndustry.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">No companies yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={companiesByIndustry} layout="vertical" margin={{ left: 20 }}>
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
        <StatCard label="Total Contacts" value={stats.contacts.length} sublabel={`${newContactsThisWeek} new this week`} to="/contacts" icon={Users} accent="brand" trend={newContactsThisWeek > 0 ? { direction: 'up', label: `+${newContactsThisWeek}` } : undefined} />
        <StatCard label="EPR Inquiries" value={eprContacts.length} sublabel="via EPR form" icon={Target} accent="purple" />
        <StatCard label="DRS Inquiries" value={drsContacts.length} sublabel="via DRS form" icon={Target} accent="blue" />
        <StatCard label="Career Applications" value={stats.applications.length} sublabel={`${newApplicationsThisWeek} new this week`} to="/careers" icon={Briefcase} accent="amber" trend={newApplicationsThisWeek > 0 ? { direction: 'up', label: `+${newApplicationsThisWeek}` } : undefined} />
        <StatCard label="Newsletter Subscribers" value={stats.subscribers.length} sublabel={`${newSubscribersThisWeek} new this week`} to="/newsletter" icon={Mail} accent="rose" trend={newSubscribersThisWeek > 0 ? { direction: 'up', label: `+${newSubscribersThisWeek}` } : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-elevation-sm hover:shadow-elevation-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-recykal-dark-green" />
            Contacts by Category
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={contactsByCategory} layout="vertical" margin={{ left: 20 }}>
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
            <BarChart data={applicationsByInterest} layout="vertical" margin={{ left: 20 }}>
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
          {contactsByEprCategory.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">No EPR submissions yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={contactsByEprCategory} layout="vertical" margin={{ left: 20 }}>
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
          {drsContactsByCity.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">No DRS submissions yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={drsContactsByCity} layout="vertical" margin={{ left: 20 }}>
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
