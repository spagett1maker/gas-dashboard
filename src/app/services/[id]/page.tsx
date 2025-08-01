'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, ServiceRequest, SERVICE_NAME_MAP, RequestDetail } from '@/lib/supabase'
import { formatFullDateTime, getServiceIcon } from '@/lib/utils'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  PlayCircle,
  Calendar,
  FileText
} from 'lucide-react'

interface ServiceRequestWithDetails extends ServiceRequest {
  request_details?: RequestDetail[]
}

export default function ServiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [request, setRequest] = useState<ServiceRequestWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)

  const requestId = params.id as string

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        // 서비스 요청 정보 가져오기
        const { data: requestData, error: requestError } = await supabase
          .from('service_requests')
          .select(`
            id,
            status,
            created_at,
            working_at,
            completed_at,
            canceled_at,
            stores:store_id(id, name, address),
            services:service_id(name)
          `)
          .eq('id', requestId)
          .single()

        if (requestError) {
          console.error('서비스 요청 조회 실패:', requestError)
          return
        }

        // 요청 상세 정보 가져오기
        const { data: detailData, error: detailError } = await supabase
          .from('request_details')
          .select('id, request_id, key, value')
          .eq('request_id', requestId)

        if (detailError) {
          console.error('요청 상세 정보 조회 실패:', detailError)
        }

        setRequest({
          ...requestData,
          request_details: detailData || []
        })
      } catch (error) {
        console.error('데이터 로드 중 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    if (requestId) {
      fetchRequest()
    }
  }, [requestId])

  const handleStatusUpdate = async (newStatus: string, timeField: string) => {
    if (!request) return

    setUpdating(true)
    try {
      const now = new Date().toISOString()
      const updateData: any = { status: newStatus, [timeField]: now }

      const { error } = await supabase
        .from('service_requests')
        .update(updateData)
        .eq('id', request.id)

      if (error) {
        console.error('상태 업데이트 실패:', error)
        alert('상태 업데이트에 실패했습니다.')
        return
      }

      // 로컬 상태 업데이트
      setRequest(prev => prev ? { ...prev, ...updateData } : null)
      
      // 성공 메시지
      const messages = {
        '진행중': '요청이 수락되었습니다.',
        '완료': '작업이 완료되었습니다.',
        '취소': '요청이 취소되었습니다.',
      }
      alert(messages[newStatus as keyof typeof messages] || '상태가 업데이트되었습니다.')

    } catch (error) {
      console.error('상태 업데이트 중 오류:', error)
      alert('상태 업데이트 중 오류가 발생했습니다.')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      '요청됨': {
        title: '서비스 요청됨',
        description: '요청하신 서비스를 확인하고 있습니다.',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700'
      },
      '진행중': {
        title: '작업 시행 중',
        description: '서비스가 현재 진행 중입니다.',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700'
      },
      '완료': {
        title: '서비스 완료',
        description: '서비스가 성공적으로 완료되었습니다.',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700'
      },
      '취소': {
        title: '서비스 취소됨',
        description: '요청하신 서비스가 취소되었습니다.',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700'
      }
    }
    return configs[status as keyof typeof configs] || configs['요청됨']
  }

  const getTimeline = () => {
    if (!request) return []

    const steps = [
      { label: '요청됨', timestamp: request.created_at, icon: FileText },
      { label: '작업 시행 중', timestamp: request.working_at, icon: PlayCircle },
      { label: '서비스 완료', timestamp: request.completed_at, icon: CheckCircle },
      { label: '취소됨', timestamp: request.canceled_at, icon: XCircle },
    ]

    return steps.filter(step => step.timestamp).map(step => ({
      ...step,
      active: true
    }))
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

  if (!request) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">서비스 요청을 찾을 수 없습니다.</p>
              <Button onClick={() => router.back()} className="mt-4">
                돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  const statusConfig = getStatusConfig(request.status)
  const timeline = getTimeline()

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
              <h1 className="text-3xl font-bold text-gray-900">서비스 상세정보</h1>
              <p className="text-gray-600">요청 ID: {request.id.slice(0, 8)}</p>
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>

        {/* 상태 안내 */}
        <Card className={statusConfig.bgColor}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-bold ${statusConfig.textColor} mb-2`}>
                  {statusConfig.title}
                </h2>
                <p className={statusConfig.textColor}>
                  {statusConfig.description}
                </p>
              </div>
              <div className="text-4xl">
                {getServiceIcon(request.services?.name || '')}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 가게 정보 */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">가게 정보</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">가게명</p>
                  <p className="font-semibold text-gray-900">
                    {request.stores?.name || '정보 없음'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">주소</p>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <p className="text-gray-700">
                      {request.stores?.address || '정보 없음'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 서비스 정보 */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">서비스 정보</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">서비스 유형</p>
                  <p className="font-semibold text-gray-900">
                    {SERVICE_NAME_MAP[request.services?.name || ''] || request.services?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">요청 시간</p>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-700">
                      {formatFullDateTime(request.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 요청 상세 정보 */}
        {request.request_details && request.request_details.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">요청 항목</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {request.request_details.map((detail) => (
                  <div key={detail.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-600">{detail.key}</span>
                    <span className="font-medium text-gray-900">{detail.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 타임라인 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">처리 기록</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowTimeline(!showTimeline)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {showTimeline ? '숨기기' : '타임라인 보기'}
              </Button>
            </div>
          </CardHeader>
          {showTimeline && (
            <CardContent>
              <div className="space-y-4">
                {timeline.map((step, index) => {
                  const Icon = step.icon
                  return (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Icon className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{step.label}</p>
                        <p className="text-sm text-gray-500">
                          {formatFullDateTime(step.timestamp)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          )}
        </Card>

        {/* 액션 버튼 */}
        {(request.status === '요청됨' || request.status === '진행중') && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {request.status === '요청됨' ? (
                  <>
                    <Button
                      onClick={() => handleStatusUpdate('진행중', 'working_at')}
                      loading={updating}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      수락하기
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleStatusUpdate('취소', 'canceled_at')}
                      loading={updating}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      거절하기
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => handleStatusUpdate('완료', 'completed_at')}
                      loading={updating}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      완료하기
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleStatusUpdate('취소', 'canceled_at')}
                      loading={updating}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      취소하기
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}

