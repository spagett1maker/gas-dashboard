import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// 관리자 사용자 ID (gas-web-2와 동기화)
export const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID || 'f0887d78-02cc-4e94-a9a5-76baf8bac9f4'

// 서비스 타입
export const SERVICES = {
  BURNER: 'burner',
  VALVE: 'valve',
  ALARM: 'alarm',
  GAS: 'gas',
  PIPE: 'pipe',
  QUOTE: 'quote',
  CONTRACT: 'contract',
  CENTER: 'center',
} as const

// 서비스명 매핑
export const SERVICE_NAME_MAP: Record<string, string> = {
  burner: '화구 교체',
  valve: '밸브 교체',
  alarm: '경보기 교체',
  gas: '가스누출 검사',
  pipe: '배관 철거',
  quote: '시공견적 문의',
  contract: '정기계약 이용권',
  center: '고객센터',
}

// 서비스 상태
export const SERVICE_STATUS = {
  REQUESTED: '요청됨',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소',
} as const

// 상태 매핑 (하위 호환성)
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

// 문의 카테고리
export const INQUIRY_CATEGORIES = {
  GENERAL: '일반문의',
  TECHNICAL: '기술지원',
  SERVICE: '서비스문의',
  OTHER: '기타',
} as const

// 우선순위
export const PRIORITY_LEVELS = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
} as const

// 화구 타입 및 가격
export const BURNER_TYPES = [
  { id: 1, name: '(일반화구) 1열 1구', price: 20000 },
  { id: 2, name: '(일반화구) 1열 2구', price: 30000 },
  { id: 3, name: '(일반화구) 1열 3구', price: 40000 },
  { id: 4, name: '(시그마버너) 1열 1구', price: 40000 },
  { id: 5, name: '(시그마버너) 1열 2구', price: 60000 },
  { id: 6, name: '(시그마버너) 1열 3구', price: 80000 },
] as const

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
  store?: {
    id: string
    name: string
    address: string
  }
  service?: {
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
  store?: {
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

export interface Inquiry {
  id: string
  user_id: string
  store_id?: string
  title: string
  content: string
  category: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  store?: {
    name: string
    address?: string
    user_id?: string
    profiles?: {
      phone?: string
    }
  }
  inquiry_responses?: InquiryResponse[]
}

export interface InquiryResponse {
  id: string
  inquiry_id: string
  admin_id: string
  content: string
  is_internal_note: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  description: string
  icon_type: string
  is_read: boolean
  created_at: string
}

