import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Contact, CareerApplication, NewsletterSubscriber, Company, Deal, DealStage, Pipeline } from '../lib/types'
import { DEAL_STAGES, DEAL_STAGE_LABELS, PIPELINES, PIPELINE_LABELS, CONTACT_STATUS_LABELS, type ContactStatus } from '../lib/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { subDays } from 'date-fns'

interface Stats {
  contacts: Contact[]
  applications: CareerApplication[]
  subscribers: NewsletterSubscriber[]
  companies: Company[]
  deals: Deal[]
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

function StatCard({ label, value, sublabel, to }: { label: string; value: number | string; sublabel?: string; to?: string }) {
  const content = (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 h-full">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
      {sublabel && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sublabel}</p>}
    </div>
  )
  return to ? (
    <Link to={to} className="block hover:ring-2 hover:ring-brand-500/50 rounded-xl transition-shadow">
      {content}
    </Link>
  ) : (
    content
  )
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
  return `₹${v.toLocaleString('en-IN')}`
}

export default function Dashboard() {
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Dashboard</h1>

      <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">Sales Pipeline</h2>
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard label="Companies" value={stats.companies.length} to="/companies" />
        <StatCard label="Open Deals" value={openDeals.length} sublabel={formatValue(openPipelineValue)} to="/deals" />
        <StatCard label="Won Value" value={formatValue(wonValue)} sublabel={`${wonDeals.length} deals won`} to="/deals" />
        <StatCard label="Win Rate" value={winRate == null ? '—' : `${winRate}%`} sublabel={`${closedDeals} closed`} to="/deals" />
        <StatCard label="Lost Deals" value={lostDeals.length} to="/deals" />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Deals by Stage</h2>
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

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Deals by Pipeline</h2>
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

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Companies by Industry</h2>
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

      <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">Leads & Marketing</h2>
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Contacts" value={stats.contacts.length} sublabel={`${newContactsThisWeek} new this week`} to="/contacts" />
        <StatCard label="EPR Inquiries" value={eprContacts.length} sublabel="via EPR form" />
        <StatCard label="DRS Inquiries" value={drsContacts.length} sublabel="via DRS form" />
        <StatCard label="Career Applications" value={stats.applications.length} sublabel={`${newApplicationsThisWeek} new this week`} to="/careers" />
        <StatCard label="Newsletter Subscribers" value={stats.subscribers.length} sublabel={`${newSubscribersThisWeek} new this week`} to="/newsletter" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Contacts by Category</h2>
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

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Applications by Interest Area</h2>
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

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">EPR Inquiries by Category</h2>
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

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">DRS Inquiries by City</h2>
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

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 col-span-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Contact Pipeline Status</h2>
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
