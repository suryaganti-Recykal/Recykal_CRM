export type ContactStatus =
  | 'new' | 'contacted' | 'converted' | 'lost' | 'duplicate'
  | 'mql_not_contacted' | 'need_new_poc' | 'not_qualified' | 'in_follow_up' | 'not_answering'
  | 'not_interested' | 'qualified_in_process' | 'sql' | 'for_next_fy'
export type ApplicationStatus = 'new' | 'reviewed' | 'interviewed' | 'rejected' | 'hired'
export type SubscriptionStatus = 'subscribed' | 'unsubscribed' | 'bounced' | 'invalid'
export type LeadStatus = 'new' | 'contacted' | 'converted' | 'lost' | 'duplicate'
// 'others' and 'partners' come from the rebuilt recykal.market Transact modal,
// which offers a third role and also appears on /partners/.
export type LeadRole = 'buyer' | 'seller' | 'others'
export type LeadPageCategory = 'home' | 'plastic' | 'metal' | 'electronics' | 'partners'

export type LifecycleStage = 'subscriber' | 'lead' | 'marketing_qualified_lead' | 'sales_qualified_lead' | 'opportunity' | 'customer' | 'other'
export const LIFECYCLE_STAGES: LifecycleStage[] = ['subscriber', 'lead', 'marketing_qualified_lead', 'sales_qualified_lead', 'opportunity', 'customer', 'other']
export const LIFECYCLE_STAGE_LABELS: Record<LifecycleStage, string> = {
  subscriber: 'Subscriber',
  lead: 'Lead',
  marketing_qualified_lead: 'Marketing Qualified Lead',
  sales_qualified_lead: 'Sales Qualified Lead',
  opportunity: 'Opportunity',
  customer: 'Customer',
  other: 'Other',
}

export type CustomerType = 'pibo' | 'b2b' | 'corporate' | 'recycler' | 'aggregator' | 'partners' | 'government_agency' | 'ngo' | 'producer' | 'institute'
export const CUSTOMER_TYPES: CustomerType[] = ['pibo', 'b2b', 'corporate', 'recycler', 'aggregator', 'partners', 'government_agency', 'ngo', 'producer', 'institute']
export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  pibo: 'PIBO',
  b2b: 'B2B',
  corporate: 'Corporate',
  recycler: 'Recycler',
  aggregator: 'Aggregator',
  partners: 'Partners',
  government_agency: 'Government Agency',
  ngo: 'NGO',
  producer: 'Producer',
  institute: 'Institute',
}

export type CompanyCustomerType = 'recycler' | 'pibo' | 'brands' | 'b2b' | 'corporate' | 'aggregator' | 'partners' | 'government_agency' | 'producer'
export const COMPANY_CUSTOMER_TYPES: CompanyCustomerType[] = ['recycler', 'pibo', 'brands', 'b2b', 'corporate', 'aggregator', 'partners', 'government_agency', 'producer']
export const COMPANY_CUSTOMER_TYPE_LABELS: Record<CompanyCustomerType, string> = {
  recycler: 'Recycler',
  pibo: 'PIBO',
  brands: 'Brands',
  b2b: 'B2B',
  corporate: 'Corporate',
  aggregator: 'Aggregator',
  partners: 'Partners',
  government_agency: 'Government Agency',
  producer: 'Producer',
}

export type Zone = 'north' | 'south' | 'east' | 'west' | 'international'
export const ZONES: Zone[] = ['north', 'south', 'east', 'west', 'international']
export const ZONE_LABELS: Record<Zone, string> = {
  north: 'North',
  south: 'South',
  east: 'East',
  west: 'West',
  international: 'International',
}

export type LeadsSource =
  | 'marketing_outbound' | 'google_ads' | 'facebook_ads' | 'organic' | 'webinar' | 'sales_outbound'
  | 'chat' | 'email_marketing' | 'sales_inbound' | 'events' | 'linkedin_ads' | 'marketing_agency'
  | 'inbound_call' | 'rfp_rfq_tender' | 'trade_show_conference' | 'email_newsletter'
  | 'linkedin_outbound' | 'linkedin_organic' | 'support_mail'
export const LEADS_SOURCES: LeadsSource[] = [
  'marketing_outbound', 'google_ads', 'facebook_ads', 'organic', 'webinar', 'sales_outbound',
  'chat', 'email_marketing', 'sales_inbound', 'events', 'linkedin_ads', 'marketing_agency',
  'inbound_call', 'rfp_rfq_tender', 'trade_show_conference', 'email_newsletter',
  'linkedin_outbound', 'linkedin_organic', 'support_mail',
]
export const LEADS_SOURCE_LABELS: Record<LeadsSource, string> = {
  marketing_outbound: 'Marketing Outbound',
  google_ads: 'Google Ads',
  facebook_ads: 'Facebook Ads',
  organic: 'Organic',
  webinar: 'Webinar',
  sales_outbound: 'Sales Outbound',
  chat: 'Chat',
  email_marketing: 'Email Marketing',
  sales_inbound: 'Sales Inbound',
  events: 'Events',
  linkedin_ads: 'LinkedIn Ads',
  marketing_agency: 'Marketing Agency',
  inbound_call: 'Inbound Call',
  rfp_rfq_tender: 'RFP/RFQ/Tender',
  trade_show_conference: 'Trade Show/Conference',
  email_newsletter: 'Email Newsletter',
  linkedin_outbound: 'LinkedIn Outbound',
  linkedin_organic: 'LinkedIn Organic',
  support_mail: 'Support Mail',
}

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  converted: 'Converted',
  lost: 'Lost',
  duplicate: 'Duplicate',
  mql_not_contacted: 'MQL (Not Contacted)',
  need_new_poc: 'Need New POC',
  not_qualified: 'Not Qualified',
  in_follow_up: 'In Follow-up',
  not_answering: 'Not Answering',
  not_interested: 'Not Interested',
  qualified_in_process: 'Qualified In Process',
  sql: 'SQL',
  for_next_fy: 'For Next FY',
}

export interface Contact {
  id: number
  name: string | null
  company_name: string | null
  email: string | null
  phone_country: string | null
  phone: string | null
  category: string | null
  need_help_with: string | null
  epr_category: string | null
  city: string | null
  requirement_description: string | null
  // Only set on recykal.market /partners/ sign-ups (source
  // "recykal_market_partner"): which partner track they applied for, and their
  // stated service area ("Pan-India", "Maharashtra, Gujarat").
  partner_type: string | null
  service_coverage: string | null
  source: string | null
  page_url: string | null
  ip_address: string | null
  user_agent: string | null
  contact_status: ContactStatus
  form_submitted: boolean
  hubspot_id: string | null
  created_at: string
  updated_at: string
  last_contacted_at: string | null
  lifecycle_stage: LifecycleStage
  job_title: string | null
  customer_type: CustomerType | null
  zone: Zone | null
  leads_source: LeadsSource | null
  contact_owner: string | null
  reason_not_qualified: string | null
  company_id: number | null
  mobile_number: string | null
  state: string | null
  region: string | null
  tag: string | null
  inside_sales_poc_owner: string | null
  total_revenue: number | null
  description: string | null
}

export interface CareerApplication {
  id: number
  first_name: string | null
  last_name: string | null
  email: string | null
  phone_country: string | null
  phone: string | null
  interest_area: string | null
  source: string | null
  page_url: string | null
  ip_address: string | null
  user_agent: string | null
  application_status: ApplicationStatus
  form_submitted: boolean
  hubspot_id: string | null
  review_status: string | null
  reviewed_by: string | null
  interview_scheduled: boolean
  interview_date: string | null
  created_at: string
  updated_at: string
  reviewed_at: string | null
}

export interface NewsletterSubscriber {
  id: number
  email: string
  website: string | null
  company: string | null
  title: string | null
  subject: string | null
  message: string | null
  source: string | null
  subscription_status: SubscriptionStatus
  form_submitted: boolean
  hubspot_id: string | null
  subscribed_at: string
  unsubscribed_at: string | null
  updated_at: string
}

export const CONTACT_STATUSES: ContactStatus[] = [
  'mql_not_contacted', 'need_new_poc', 'not_qualified', 'in_follow_up', 'not_answering',
  'not_interested', 'qualified_in_process', 'sql', 'for_next_fy', 'duplicate',
]
export const APPLICATION_STATUSES: ApplicationStatus[] = ['new', 'reviewed', 'interviewed', 'rejected', 'hired']
export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ['subscribed', 'unsubscribed', 'bounced', 'invalid']
export const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'converted', 'lost', 'duplicate']
export const LEAD_PAGE_CATEGORIES: LeadPageCategory[] = ['home', 'plastic', 'metal', 'electronics', 'partners']
export const LEAD_ROLES: LeadRole[] = ['buyer', 'seller', 'others']

// 'market_lead' points at recykal_market_leads. It is a separate entity_type
// rather than reusing 'contact' because the two tables have independent id
// sequences, so the ids would collide.
export type ActivityEntityType = 'contact' | 'company' | 'deal' | 'market_lead'

export interface ActivityLogEntry {
  id: number
  entity_type: ActivityEntityType
  entity_id: number
  event_type: string
  description: string
  actor: string | null
  created_at: string
}

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'pending' | 'completed'
export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']

export interface Task {
  id: number
  title: string
  description: string | null
  due_date: string | null
  priority: TaskPriority
  status: TaskStatus
  owner: string | null
  related_entity_type: ActivityEntityType | null
  related_entity_id: number | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

export type NoteEntityType = 'contact' | 'company' | 'deal' | 'market_lead'

export interface Note {
  id: number
  entity_type: NoteEntityType
  entity_id: number
  body: string
  author: string | null
  created_at: string
}

export type DealStage = 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'po_received' | 'order_confirmation' | 'won' | 'lost'
export const DEAL_STAGES: DealStage[] = ['prospecting', 'qualification', 'proposal', 'negotiation', 'po_received', 'order_confirmation', 'won', 'lost']
export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  prospecting: 'Prospecting',
  qualification: 'Qualification',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  po_received: 'PO Received',
  order_confirmation: 'Order Confirmation',
  won: 'Won',
  lost: 'Lost',
}

export type Pipeline = 'epr' | 'itad' | 'rethink_plus' | 'ddrs'
export const PIPELINES: Pipeline[] = ['epr', 'itad', 'rethink_plus', 'ddrs']
export const PIPELINE_LABELS: Record<Pipeline, string> = {
  epr: 'EPR',
  itad: 'ITAD',
  rethink_plus: 'Rethink+',
  ddrs: 'dDRS',
}

export type DealType = 'new_business' | 'existing_business'
export const DEAL_TYPES: DealType[] = ['new_business', 'existing_business']
export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  new_business: 'New Business',
  existing_business: 'Existing Business',
}

export type PoType = 'epr_fulfillment_po' | 'epr_compliance_po' | 'epr_registration_po' | 'epr_po_combined' | 'itad_po' | 'others'
export const PO_TYPES: PoType[] = ['epr_fulfillment_po', 'epr_compliance_po', 'epr_registration_po', 'epr_po_combined', 'itad_po', 'others']
export const PO_TYPE_LABELS: Record<PoType, string> = {
  epr_fulfillment_po: 'EPR Fulfillment PO',
  epr_compliance_po: 'EPR Compliance PO',
  epr_registration_po: 'EPR Registration PO',
  epr_po_combined: 'EPR PO (Fulfillment + Registration/Compliance)',
  itad_po: 'ITAD PO',
  others: 'Others',
}

export const WASTE_TYPES = ['Plastics', 'E-waste', 'Battery', 'Tyre', 'IT Asset', 'Paper', 'Metal', 'Wood', 'Others']

export interface Company {
  id: number
  name: string
  website: string | null
  industry: string | null
  gst: string | null
  employees_range: string | null
  annual_turnover: string | null
  city: string | null
  state: string | null
  notes: string | null
  created_at: string
  updated_at: string
  customer_type: CompanyCustomerType | null
  tag: string | null
  domain: string | null
  hubspot_id: string | null
  account_owners: string | null
}

export interface Deal {
  id: number
  name: string
  company_id: number | null
  contact_id: number | null
  value: number | null
  stage: DealStage
  probability: number | null
  expected_close_date: string | null
  owner: string | null
  notes: string | null
  created_at: string
  updated_at: string
  pipeline: Pipeline
  deal_type: DealType | null
  leads_source: LeadsSource | null
  waste_types: string[] | null
  services: string | null
  po_type: PoType | null
  zone: Zone | null
  closed_lost_reason: string | null
  closed_won_reason: string | null
  hubspot_id: string | null
  inside_sales_poc: string | null
  inside_sales_poc_owner: string | null
  tag: string | null
  latest_approval_status: string | null
}

export interface RecykalMarketLead {
  id: number
  role: LeadRole
  page_category: LeadPageCategory
  material_category: string | null
  name: string | null
  company_name: string | null
  email: string | null
  phone_country: string | null
  phone: string | null
  gst: string | null
  city: string | null
  state: string | null
  pincode: string | null
  business_type: string | null
  lead_status: LeadStatus
  source: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  updated_at: string
  last_contacted_at: string | null
}
