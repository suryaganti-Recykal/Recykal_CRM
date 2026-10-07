import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import type { Company, Deal, DealStage, Pipeline } from '../lib/types'
import { DEAL_STAGES } from '../lib/types'
import { differenceInDays } from 'date-fns'

export interface DealFilters {
  pipeline: 'all' | Pipeline
  owner: string
  search: string
}

export interface DealSummary {
  totalValue: number
  dealCount: number
  weightedForecast: number
  avgAgeDays: number
}

const defaultFilters: DealFilters = { pipeline: 'all', owner: '', search: '' }

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<DealFilters>(defaultFilters)
  const { addToast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    const [dealsRes, companiesRes] = await Promise.all([
      supabase.from('deals').select('*').order('created_at', { ascending: false }),
      supabase.from('companies').select('*').order('name'),
    ])
    if (!dealsRes.error && dealsRes.data) setDeals(dealsRes.data as Deal[])
    if (!companiesRes.error && companiesRes.data) setCompanies(companiesRes.data as Company[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const companyById = useMemo(() => {
    const map = new Map<number, Company>()
    for (const c of companies) map.set(c.id, c)
    return map
  }, [companies])

  const visibleDeals = useMemo(() => {
    let list = deals
    if (filters.pipeline !== 'all') list = list.filter((d) => d.pipeline === filters.pipeline)
    if (filters.owner) list = list.filter((d) => d.owner === filters.owner)
    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.company_id != null && companyById.get(d.company_id)?.name.toLowerCase().includes(q))
      )
    }
    return list
  }, [deals, filters, companyById])

  const dealsByStage = useMemo(() => {
    const map = new Map<DealStage, Deal[]>()
    for (const s of DEAL_STAGES) map.set(s, [])
    for (const d of visibleDeals) map.get(d.stage)?.push(d)
    return map
  }, [visibleDeals])

  const owners = useMemo(() => {
    const set = new Set<string>()
    for (const d of deals) if (d.owner) set.add(d.owner)
    return Array.from(set).sort()
  }, [deals])

  const summary: DealSummary = useMemo(() => {
    const open = visibleDeals.filter((d) => d.stage !== 'won' && d.stage !== 'lost')
    const totalValue = open.reduce((s, d) => s + (d.value ?? 0), 0)
    const weightedForecast = open.reduce((s, d) => s + (d.value ?? 0) * ((d.probability ?? 0) / 100), 0)
    const now = new Date()
    const ages = open.map((d) => differenceInDays(now, new Date(d.created_at)))
    const avgAgeDays = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0
    return { totalValue, dealCount: open.length, weightedForecast, avgAgeDays }
  }, [visibleDeals])

  const updateStage = useCallback(
    async (dealId: number, newStage: DealStage, extra?: Partial<Deal>) => {
      const prev = deals.find((d) => d.id === dealId)
      if (!prev) return

      setDeals((ds) => ds.map((d) => (d.id === dealId ? { ...d, stage: newStage, ...extra } : d)))

      const { error } = await supabase
        .from('deals')
        .update({ stage: newStage, ...extra })
        .eq('id', dealId)

      if (error) {
        setDeals((ds) => ds.map((d) => (d.id === dealId ? prev : d)))
        addToast('Failed to move deal — reverted', 'error')
      } else {
        addToast(`Moved to ${newStage.replace(/_/g, ' ')}`, 'success')
      }
    },
    [deals, addToast]
  )

  const createDeal = useCallback(
    async (data: Partial<Deal>) => {
      const { data: created, error } = await supabase.from('deals').insert(data).select().single()
      if (error || !created) {
        addToast('Failed to create deal', 'error')
        return null
      }
      setDeals((prev) => [created as Deal, ...prev])
      addToast('Deal created', 'success')
      return created as Deal
    },
    [addToast]
  )

  const updateDeal = useCallback(
    async (dealId: number, data: Partial<Deal>) => {
      const prev = deals.find((d) => d.id === dealId)
      if (!prev) return false

      setDeals((ds) => ds.map((d) => (d.id === dealId ? { ...d, ...data } : d)))

      const { error } = await supabase.from('deals').update(data).eq('id', dealId)
      if (error) {
        setDeals((ds) => ds.map((d) => (d.id === dealId ? prev : d)))
        addToast('Failed to update deal', 'error')
        return false
      }
      addToast('Deal updated', 'success')
      return true
    },
    [deals, addToast]
  )

  return {
    deals,
    companies,
    companyById,
    loading,
    filters,
    setFilters,
    visibleDeals,
    dealsByStage,
    owners,
    summary,
    updateStage,
    createDeal,
    updateDeal,
    reload: load,
  }
}
