import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// 서비스 타입 매핑
export const SERVICE_NAME_MAP: Record<string, string> = {
  burner: '화구 교체',
  valve: '밸브 교체',
  gas: '가스누출 검사',
  pipe: '배관 철거',
  alarm: '경보기 교체',
  center: '고객센터',
  contract: '정기계약 이용권',
  quote: '시공견적 문의',
}

// 상태 매핑
export const STATUS_KOR_TO_ENG = {
  '요청됨': '요청됨',
  '작업 시행 중': '진행중',
  '서비스 완료': '완료',
  '서비스 취소됨': '취소',
}

export const STATUS_ENG_TO_KOR = {
  '요청됨': '요청됨',
  '진행중': '작업 시행 중',
  '완료': '서비스 완료',
  '취소': '서비스 취소됨',
}

// 타입 정의
export interface ServiceRequest {
  id: string
  status: string
  created_at: string
  working_at?: string
  completed_at?: string
  canceled_at?: string
  store_id: string
  service_id: string
  stores?: {
    id: string
    name: string
    address: string
  }
  services?: {
    name: string
  }
}

export interface Store {
  id: string
  name: string
  address: string
  user_id: string
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  store_id: string
  admin_id?: string
  updated_at: string
  stores?: {
    name: string
  }
  messages?: Message[]
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface RequestDetail {
  id: string
  request_id: string
  key: string
  value: string
}

