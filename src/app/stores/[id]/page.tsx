'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, Store, ServiceRequest, SERVICE_NAME_MAP } from '@/lib/supabase'
import { formatDate, formatTime, getServiceIcon } from '@/lib/utils'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Phone,
  Eye,
  BarChart3,
  Clock,
  Mail,
  Shield,
  MessageCircle,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  Activity
} from 'lucide-react'

interface StoreWithProfile extends Store {
  profiles?: {
    phone?: string
    email?: string
    role?: string
    created_at?: string
  }
}

interface Inquiry {
  id: string
  title: string
  status: string
  priority: string
  created_at: string
}

interface Conversation {
  id: string
  updated_at: string
  messages?: Array<{
    id: string
  }>
}

export default function StoreDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [store, setStore] = useState<StoreWithProfile | null>(null)
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const storeId = params.id as string

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        // 가게 정보 가져오기 (프로필 정보 포함)
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select(`
            id,
            name,
            address,
            user_id,
            created_at,
            profiles:user_id(phone, email, role, created_at)
          `)
          .eq('id', storeId)
          .single()

        if (storeError) {
          console.error('가게 정보 조회 실패:', storeError)
          return
        }

        // profiles가 배열로 올 경우 처리
        if (storeData && storeData.profiles && Array.isArray(storeData.profiles)) {
          const profiles = storeData.profiles[0] || undefined
          setStore({ ...storeData, profiles } as StoreWithProfile)
        } else {
          setStore(storeData as StoreWithProfile)
        }

        // 해당 가게의 서비스 요청 내역 가져오기
        const { data: requestsData, error: requestsError } = await supabase
          .from('service_requests')
          .select(`
            id,
            status,
            created_at,
            working_at,
            completed_at,
            canceled_at,
            store_id,
            service_id,
            services:service_id(name)
          `)
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })

        if (requestsError) {
          console.error('서비스 요청 내역 조회 실패:', requestsError)
        } else {
          // services가 배열로 반환되므로 service로 변환
          const processedData = (requestsData || []).map(request => ({
            ...request,
            service: Array.isArray(request.services) && request.services.length > 0
              ? request.services[0]
              : { name: '알 수 없는 서비스' }
          }))
          setRequests(processedData as ServiceRequest[])
        }

        // 가게 관련 문의 가져오기
        const { data: inquiriesData, error: inquiriesError } = await supabase
          .from('inquiries')
          .select('id, title, status, priority, created_at')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(5)

        if (inquiriesError) {
          console.error('문의 내역 조회 실패:', inquiriesError)
        } else {
          setInquiries(inquiriesData || [])
        }

        // 가게 관련 대화 가져오기
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            id,
            updated_at,
            messages(id)
          `)
          .eq('store_id', storeId)
          .order('updated_at', { ascending: false })
          .limit(5)

        if (conversationsError) {
          console.error('대화 내역 조회 실패:', conversationsError)
        } else {
          setConversations(conversationsData || [])
        }

      } catch (error) {
        console.error('데이터 로드 중 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    if (storeId) {
      fetchStoreData()
    }
  }, [storeId])

  const getRequestStats = () => {
    const total = requests.length
    const pending = requests.filter(r => r.status === '요청됨').length
    const inProgress = requests.filter(r => r.status === '진행중').length
    const completed = requests.filter(r => r.status === '완료').length
    const canceled = requests.filter(r => r.status === '취소').length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, pending, inProgress, completed, canceled, completionRate }
  }

  const getMostRequestedService = () => {
    if (requests.length === 0) return '없음'

    const serviceCounts: Record<string, number> = {}
    requests.forEach(request => {
      const serviceName = request.service?.name || '알 수 없음'
      serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1
    })

    const mostRequested = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]
    return SERVICE_NAME_MAP[mostRequested[0]] || mostRequested[0]
  }

  const getRecentActivityCount = () => {
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    return requests.filter(r => new Date(r.created_at) > last30Days).length
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!store) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">가게 정보를 찾을 수 없습니다.</p>
              <Button onClick={() => router.back()} className="mt-4">
                돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  const stats = getRequestStats()

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              돌아가기
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
              <p className="text-gray-600">가게 상세 정보</p>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            활성
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 가게 기본 정보 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">기본 정보</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">가게명</p>
                    <p className="font-semibold text-gray-900">{store.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">주소</p>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <p className="text-gray-700">{store.address}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">등록일</p>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-700">{formatDate(store.created_at)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">등록자 전화번호</p>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-700">
                        {store.profiles?.phone || '정보 없음'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">등록자 이메일</p>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-700">
                        {store.profiles?.email || '정보 없음'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">사용자 권한</p>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-700">
                        {store.profiles?.role || '정보 없음'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">사용자 가입일</p>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-700">
                        {store.profiles?.created_at ? formatDate(store.profiles.created_at) : '정보 없음'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">사용자 ID</p>
                    <p className="text-gray-700 font-mono text-sm">{store.user_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">가게 ID</p>
                    <p className="text-gray-700 font-mono text-sm">{store.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 서비스 요청 내역 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">서비스 요청 내역</h3>
                  <Link href={`/services?store=${store.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      전체 보기
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">아직 서비스 요청이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="text-xl">
                            {getServiceIcon(request.service?.name || '')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {SERVICE_NAME_MAP[request.service?.name || ''] || request.service?.name}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(request.created_at)} {formatTime(request.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={request.status} />
                          <Link href={`/services/${request.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                    {requests.length > 5 && (
                      <div className="text-center pt-4">
                        <Link href={`/services?store=${store.id}`}>
                          <Button variant="outline">
                            {requests.length - 5}개 더 보기
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 문의 내역 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">문의 내역</h3>
                  <Link href={`/inquiries?store=${store.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      전체 보기
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {inquiries.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">아직 문의 내역이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inquiries.map((inquiry) => (
                      <Link key={inquiry.id} href={`/inquiries/${inquiry.id}`}>
                        <div className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-gray-900 line-clamp-1">
                              {inquiry.title}
                            </p>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              inquiry.status === '완료' ? 'bg-green-100 text-green-700' :
                              inquiry.status === '처리중' ? 'bg-blue-100 text-blue-700' :
                              inquiry.status === '보류' ? 'bg-red-100 text-red-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {inquiry.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(inquiry.created_at)}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              inquiry.priority === '높음' ? 'bg-red-100 text-red-700' :
                              inquiry.priority === '낮음' ? 'bg-gray-100 text-gray-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {inquiry.priority}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 대화 내역 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">대화 내역</h3>
                  <Link href={`/conversations?store=${store.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      전체 보기
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">아직 대화 내역이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conversations.map((conversation) => (
                      <Link key={conversation.id} href={`/conversations/${conversation.id}`}>
                        <div className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <MessageCircle className="h-5 w-5 text-orange-500" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  대화 #{conversation.id.slice(0, 8)}
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  <span>최근 업데이트: {formatDate(conversation.updated_at)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {Array.isArray(conversation.messages) ? conversation.messages.length : 0}개 메시지
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 통계 사이드바 */}
          <div className="space-y-6">
            {/* 활동 요약 */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">활동 요약</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">서비스 요청</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{stats.total}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">문의 건수</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">{inquiries.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">대화 수</span>
                    </div>
                    <span className="text-lg font-bold text-orange-600">{conversations.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 서비스 통계 */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">서비스 통계</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">전체 요청</span>
                    <span className="font-semibold text-gray-900">{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">대기 중</span>
                    <span className="font-semibold text-orange-600">{stats.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">진행 중</span>
                    <span className="font-semibold text-blue-600">{stats.inProgress}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">완료</span>
                    <span className="font-semibold text-green-600">{stats.completed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">취소</span>
                    <span className="font-semibold text-red-600">{stats.canceled}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">완료율</span>
                      <span className="font-semibold text-green-600">{stats.completionRate}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 서비스 인사이트 */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">서비스 인사이트</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">가장 많이 요청된 서비스</p>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <p className="font-semibold text-gray-900">{getMostRequestedService()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">최근 30일 활동</p>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <p className="font-semibold text-gray-900">{getRecentActivityCount()}건</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">빠른 액션</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href={`/services?store=${store.id}&status=요청됨`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Clock className="h-4 w-4 mr-2" />
                      대기 중인 요청 보기
                    </Button>
                  </Link>
                  <Link href={`/services?store=${store.id}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      전체 요청 내역
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

