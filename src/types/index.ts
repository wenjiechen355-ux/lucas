// ===== 用户/角色 =====
export type UserRole = 'member' | 'leader'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  position?: string        // 職位（主席、副主席等）
  phone?: string
  scout_unit?: string      // 旅團
  created_at: string
  updated_at: string
}

// ===== 活动 =====
export interface Event {
  id: string
  title: string
  description?: string
  event_date: string
  location?: string
  created_by: string
  created_at: string
}

// ===== 出席 =====
export type AttendanceStatus = 'present' | 'absent' | 'excused'

export interface Attendance {
  id: string
  event_id: string
  member_id: string
  status: AttendanceStatus
  checkin_time?: string
  remark?: string
  created_at: string
}

// ===== 进度 =====
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed'

export interface ProgressItem {
  id: string
  member_id: string
  title: string
  description?: string
  category?: string          // 分類（eg. 技能/服務/體能）
  status: ProgressStatus
  completed_date?: string
  completed_by?: string      // 領袖 ID
  created_at: string
  updated_at: string
}

// ===== 文档 =====
export type DocumentStatus = 'pending' | 'approved' | 'rejected'

export interface Document {
  id: string
  member_id: string
  title: string
  description?: string
  file_path: string          // Supabase Storage path
  file_name: string          // 原始文件名
  file_size: number
  file_type: string
  status: DocumentStatus
  reviewer_id?: string
  review_comment?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

// ===== 活动筹备 =====
export type PrepStatus = 'pending' | 'in_progress' | 'completed'

export interface EventPrepItem {
  id: string
  event_id: string
  title: string
  description?: string
  responsible_id?: string
  status: PrepStatus
  created_by: string
  created_at: string
  updated_at: string
}
