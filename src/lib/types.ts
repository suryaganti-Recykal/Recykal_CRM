export type UserRole = 'admin' | 'manager' | 'member' | 'viewer'
export const USER_ROLES: UserRole[] = ['admin', 'manager', 'member', 'viewer']
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
  viewer: 'Viewer',
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: UserRole
  team_id: string | null
  is_active: boolean
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  description: string | null
  manager_id: string | null
  created_at: string
  manager?: Profile | null
}

export interface UserSettings {
  user_id: string
  default_pipeline: string | null
  notifications_enabled: boolean
  email_signature: string | null
  settings_json: Record<string, unknown>
}

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

export type CompanyCustomerType = 'recycler' | 'pibo' | 'brands' | 'b2b' | 'corporate' | 'aggregator' | 'partners' | 'government_agency' | 'producer' | 'prospect' | 'customer' | 'lead'
export const COMPANY_CUSTOMER_TYPES: CompanyCustomerType[] = ['recycler', 'pibo', 'brands', 'b2b', 'corporate', 'aggregator', 'partners', 'government_agency', 'producer', 'prospect', 'customer', 'lead']
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
  prospect: 'Prospect',
  customer: 'Customer',
  lead: 'Lead',
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
  parent_company_id: number | null
  phone: string | null
  email: string | null
  address: string | null
  country: string | null
  pincode: string | null
  owner_id: string | null
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
  contact_role: string | null
  currency: string | null
  weighted_value: number | null
  owner_id: string | null
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

// Phase 2 types

export type ContactCompanyRole = 'decision_maker' | 'influencer' | 'champion' | 'end_user' | 'billing' | 'technical' | 'other'
export const CONTACT_COMPANY_ROLES: ContactCompanyRole[] = ['decision_maker', 'influencer', 'champion', 'end_user', 'billing', 'technical', 'other']
export const CONTACT_COMPANY_ROLE_LABELS: Record<ContactCompanyRole, string> = {
  decision_maker: 'Decision Maker',
  influencer: 'Influencer',
  champion: 'Champion',
  end_user: 'End User',
  billing: 'Billing',
  technical: 'Technical',
  other: 'Other',
}

export interface ContactCompanyRoleEntry {
  id: string
  contact_id: number
  company_id: number
  role: ContactCompanyRole | null
  is_primary: boolean
  created_at: string
}

export type ProductCategory = 'epr' | 'itad' | 'rethink_plus' | 'ddrs' | 'other'
export const PRODUCT_CATEGORIES: ProductCategory[] = ['epr', 'itad', 'rethink_plus', 'ddrs', 'other']
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  epr: 'EPR',
  itad: 'ITAD',
  rethink_plus: 'Rethink+',
  ddrs: 'dDRS',
  other: 'Other',
}

export type ProductUnit = 'per_ton' | 'per_unit' | 'lump_sum' | 'monthly' | 'per_kg' | 'per_piece'
export const PRODUCT_UNITS: ProductUnit[] = ['per_ton', 'per_unit', 'lump_sum', 'monthly', 'per_kg', 'per_piece']
export const PRODUCT_UNIT_LABELS: Record<ProductUnit, string> = {
  per_ton: 'Per Ton',
  per_unit: 'Per Unit',
  lump_sum: 'Lump Sum',
  monthly: 'Monthly',
  per_kg: 'Per Kg',
  per_piece: 'Per Piece',
}

export interface Product {
  id: string
  name: string
  code: string | null
  description: string | null
  unit_price: number | null
  unit: ProductUnit | null
  category: ProductCategory | null
  is_active: boolean
  created_at: string
}

export interface DealLineItem {
  id: string
  deal_id: number
  product_id: string | null
  description: string | null
  quantity: number
  unit_price: number | null
  discount_percent: number
  total: number | null
  created_at: string
  product?: Product | null
}

export interface Tag {
  id: string
  name: string
  color: string
  entity_type: 'contact' | 'company' | 'deal' | null
  created_at: string
}

export interface EntityTag {
  tag_id: string
  entity_type: 'contact' | 'company' | 'deal'
  entity_id: number
}

export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'url' | 'email'
export const CUSTOM_FIELD_TYPES: CustomFieldType[] = ['text', 'number', 'date', 'select', 'multiselect', 'boolean', 'url', 'email']

export interface CustomField {
  id: string
  entity_type: 'contact' | 'company' | 'deal'
  field_name: string
  label: string
  field_type: CustomFieldType
  options: string[] | null
  is_required: boolean
  sort_order: number
  created_at: string
}

export interface CustomFieldValue {
  id: string
  custom_field_id: string
  entity_type: string
  entity_id: number
  value_text: string | null
  value_number: number | null
  value_date: string | null
  value_json: unknown | null
}

// Phase 5 types

export type EmailDirection = 'inbound' | 'outbound'
export type EmailStatus = 'draft' | 'sent' | 'delivered' | 'opened' | 'bounced' | 'failed'
export type EmailTemplateCategory = 'follow_up' | 'intro' | 'proposal' | 'closing' | 'general'

export interface EmailTemplate {
  id: string
  name: string
  subject: string | null
  body_html: string | null
  category: EmailTemplateCategory | null
  owner_id: string | null
  is_shared: boolean
  created_at: string
}

export interface Email {
  id: string
  direction: EmailDirection
  from_address: string | null
  to_addresses: string[] | null
  cc_addresses: string[] | null
  subject: string | null
  body_html: string | null
  body_text: string | null
  status: EmailStatus
  sent_at: string | null
  opened_at: string | null
  contact_id: number | null
  deal_id: number | null
  company_id: number | null
  sender_id: string | null
  template_id: string | null
  created_at: string
}

export type CallOutcome = 'connected' | 'no_answer' | 'voicemail' | 'busy' | 'wrong_number' | 'left_message'
export const CALL_OUTCOMES: CallOutcome[] = ['connected', 'no_answer', 'voicemail', 'busy', 'wrong_number', 'left_message']
export const CALL_OUTCOME_LABELS: Record<CallOutcome, string> = {
  connected: 'Connected',
  no_answer: 'No Answer',
  voicemail: 'Voicemail',
  busy: 'Busy',
  wrong_number: 'Wrong Number',
  left_message: 'Left Message',
}

export interface CallLog {
  id: string
  contact_id: number | null
  deal_id: number | null
  caller_id: string | null
  direction: 'inbound' | 'outbound' | null
  duration_seconds: number | null
  outcome: CallOutcome | null
  notes: string | null
  called_at: string
}

export type MeetingType = 'in_person' | 'video' | 'phone'
export const MEETING_TYPES: MeetingType[] = ['in_person', 'video', 'phone']
export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  in_person: 'In Person',
  video: 'Video Call',
  phone: 'Phone Call',
}

export interface Meeting {
  id: string
  title: string
  description: string | null
  start_time: string | null
  end_time: string | null
  location: string | null
  meeting_type: MeetingType | null
  organizer_id: string | null
  contact_id: number | null
  deal_id: number | null
  company_id: number | null
  outcome: string | null
  created_at: string
}

// Phase 7 types

export interface FileAttachment {
  id: string
  entity_type: 'contact' | 'company' | 'deal'
  entity_id: number
  file_name: string
  file_size: number | null
  mime_type: string | null
  storage_path: string
  uploaded_by: string | null
  created_at: string
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export interface Quote {
  id: string
  deal_id: number
  quote_number: string | null
  status: QuoteStatus
  valid_until: string | null
  subtotal: number
  tax_percent: number
  total: number
  terms: string | null
  notes: string | null
  created_by: string | null
  sent_at: string | null
  created_at: string
}

export interface QuoteLineItem {
  id: string
  quote_id: string
  description: string | null
  quantity: number
  unit_price: number | null
  discount_percent: number
  total: number | null
  hsn_code: string | null
}

// Phase 6 types

export type AutomationTrigger = 'stage_change' | 'field_change' | 'created' | 'time_based'
export type AutomationAction = 'send_email' | 'create_task' | 'update_field' | 'notify' | 'assign_owner'

export interface Automation {
  id: string
  name: string
  entity_type: 'contact' | 'deal' | 'company' | null
  trigger_type: AutomationTrigger
  trigger_config: Record<string, unknown>
  action_type: AutomationAction
  action_config: Record<string, unknown>
  is_active: boolean
  owner_id: string | null
  created_at: string
}

export type NotificationType = 'deal_won' | 'task_due' | 'mention' | 'automation' | 'assignment' | 'general'

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  notification_type: NotificationType | null
  created_at: string
}

// ── Phase 8: Import, API Keys & Webhooks ──

export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface ImportJob {
  id: string
  entity_type: string
  file_name: string | null
  total_rows: number
  created_count: number
  updated_count: number
  skipped_count: number
  failed_count: number
  status: ImportStatus
  error_log: unknown[]
  column_mapping: Record<string, string>
  started_by: string | null
  created_at: string
  completed_at: string | null
}

export interface ApiKey {
  id: string
  name: string
  key_hash: string
  key_prefix: string
  permissions: Record<string, string>
  owner_id: string | null
  last_used_at: string | null
  is_active: boolean
  created_at: string
}

export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  secret: string | null
  is_active: boolean
  owner_id: string | null
  last_triggered_at: string | null
  created_at: string
}
