import type { Profile, UserRole } from './types'

const ROLE_LEVEL: Record<UserRole, number> = {
  viewer: 0,
  member: 1,
  manager: 2,
  admin: 3,
}

export function hasRole(profile: Profile | null, minRole: UserRole): boolean {
  if (!profile) return false
  return ROLE_LEVEL[profile.role] >= ROLE_LEVEL[minRole]
}

export function canManageUsers(profile: Profile | null): boolean {
  return hasRole(profile, 'admin')
}

export function canManageTeams(profile: Profile | null): boolean {
  return hasRole(profile, 'admin')
}

export function canEdit(profile: Profile | null): boolean {
  return hasRole(profile, 'member')
}

export function canDelete(profile: Profile | null): boolean {
  return hasRole(profile, 'manager')
}

export function isOwnerOrAbove(profile: Profile | null, ownerId: string | null): boolean {
  if (!profile) return false
  if (hasRole(profile, 'manager')) return true
  return profile.id === ownerId
}
