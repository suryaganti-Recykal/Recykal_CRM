import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import { useProfile } from '../contexts/ProfileContext'
import { canManageUsers, canManageTeams } from '../lib/permissions'
import ProfileSettings from '../components/settings/ProfileSettings'
import TeamSettings from '../components/settings/TeamSettings'
import UserManagement from '../components/settings/UserManagement'
import ProductSettings from '../components/settings/ProductSettings'
import CustomFieldSettings from '../components/settings/CustomFieldSettings'
import EmailTemplateSettings from '../components/settings/EmailTemplateSettings'
import AutomationSettings from '../components/settings/AutomationSettings'
import ImportExportSettings from '../components/settings/ImportExportSettings'
import ApiKeySettings from '../components/settings/ApiKeySettings'
import WebhookSettings from '../components/settings/WebhookSettings'
import { User, Users, Building, Package, SlidersHorizontal, Mail, Zap, Upload, Key, Webhook } from 'lucide-react'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
    isActive
      ? 'border-brand-600 text-brand-700 dark:text-brand-400 dark:border-brand-400'
      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
  }`

export default function Settings() {
  const { profile } = useProfile()
  const isAdmin = canManageUsers(profile)
  const canTeams = canManageTeams(profile)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Settings</h1>

      <div className="border-b border-slate-200 dark:border-slate-700 mb-6 flex gap-0 overflow-x-auto">
        <NavLink to="/settings/profile" className={tabClass}>
          <User size={16} /> Profile
        </NavLink>
        {canTeams && (
          <NavLink to="/settings/teams" className={tabClass}>
            <Building size={16} /> Teams
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/settings/users" className={tabClass}>
            <Users size={16} /> Users
          </NavLink>
        )}
        <NavLink to="/settings/products" className={tabClass}>
          <Package size={16} /> Products
        </NavLink>
        {isAdmin && (
          <NavLink to="/settings/custom-fields" className={tabClass}>
            <SlidersHorizontal size={16} /> Custom Fields
          </NavLink>
        )}
        <NavLink to="/settings/email-templates" className={tabClass}>
          <Mail size={16} /> Email Templates
        </NavLink>
        {isAdmin && (
          <NavLink to="/settings/automations" className={tabClass}>
            <Zap size={16} /> Automations
          </NavLink>
        )}
        <NavLink to="/settings/import-export" className={tabClass}>
          <Upload size={16} /> Import / Export
        </NavLink>
        {isAdmin && (
          <NavLink to="/settings/api-keys" className={tabClass}>
            <Key size={16} /> API Keys
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/settings/webhooks" className={tabClass}>
            <Webhook size={16} /> Webhooks
          </NavLink>
        )}
      </div>

      <Routes>
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="teams" element={<TeamSettings />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="products" element={<ProductSettings />} />
        <Route path="custom-fields" element={<CustomFieldSettings />} />
        <Route path="email-templates" element={<EmailTemplateSettings />} />
        <Route path="automations" element={<AutomationSettings />} />
        <Route path="import-export" element={<ImportExportSettings />} />
        <Route path="api-keys" element={<ApiKeySettings />} />
        <Route path="webhooks" element={<WebhookSettings />} />
        <Route index element={<Navigate to="profile" replace />} />
      </Routes>
    </div>
  )
}
