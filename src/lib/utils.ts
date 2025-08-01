import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isToday, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 날짜 포맷팅 함수
export function formatDate(dateString: string): string {
  const date = parseISO(dateString)
  return format(date, 'yyyy-MM-dd')
}

export function formatTime(dateString: string): string {
  const date = parseISO(dateString)
  return format(date, 'HH:mm')
}

export function formatDateTime(dateString: string): string {
  const date = parseISO(dateString)
  if (isToday(date)) {
    return format(date, 'HH:mm')
  }
  return format(date, 'MM/dd')
}

export function formatFullDateTime(dateString: string): string {
  const date = parseISO(dateString)
  return format(date, 'yyyy/MM/dd, HH:mm')
}

// 상태별 스타일 함수
export function getStatusStyle(status: string) {
  switch (status) {
    case '요청됨':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: 'text-blue-500'
      }
    case '진행중':
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        icon: 'text-yellow-500'
      }
    case '완료':
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: 'text-green-500'
      }
    case '취소':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: 'text-red-500'
      }
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        icon: 'text-gray-500'
      }
  }
}

// 서비스 아이콘 매핑
export function getServiceIcon(serviceName: string): string {
  switch (serviceName) {
    case 'burner':
      return '🔥'
    case 'valve':
      return '🔧'
    case 'gas':
      return '⚠️'
    case 'pipe':
      return '🔧'
    case 'alarm':
      return '🚨'
    case 'quote':
      return '📋'
    case 'center':
      return '💬'
    case 'contract':
      return '📄'
    default:
      return '🔧'
  }
}

