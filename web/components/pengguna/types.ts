export interface AppUser {
  id: string
  name: string
  email: string
  username?: string | null
  displayUsername?: string | null
  role?: string | null
  rt?: string | null
  rw?: string | null
  banned?: boolean | null
  banReason?: string | null
  createdAt?: string | Date
  updatedAt?: string | Date
}

export type UserDetail = AppUser
