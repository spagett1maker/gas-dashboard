'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Inquiry, InquiryResponse } from '@/lib/supabase'
import { formatFullDateTime } from '@/lib/utils'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  ArrowLeft,
  Clock,
  User,
  MessageCircle,
  Send,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

const STATUSES = ['접수됨', '처리중', '완료', '보류']

export default function InquiryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [inquiry, setInquiry] = useState<Inquiry | null>(null)
  const [loading, setLoading] = useState(true)
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const inquiryId = params.id as string

  useEffect(() => {
    const getAdminId = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user?.id) {
        setAdminId(data.user.id)
      }
    }
    getAdminId()
  }, [])

  const fetchInquiry = async () => {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          id,
          user_id,
          store_id,
          title,
          content,
          category,
          status,
          priority,
          created_at,
          updated_at,
          stores(name),
          inquiry_responses(
            id,
            inquiry_id,
            admin_id,
            content,
            is_internal_note,
            created_at
          )
        `)
        .eq('id', inquiryId)
        .single()

      if (error) {
        console.error('문의 상세 정보 조회 실패:', error)
        return
      }

      // 답변 정렬
      if (data.inquiry_responses) {
        data.inquiry_responses.sort((a: InquiryResponse, b: InquiryResponse) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }

      const processedData = {
        ...data,
        store: Array.isArray(data.stores) ? data.stores[0] : data.stores
      }
      setInquiry(processedData as Inquiry)
    } catch (error) {
      console.error('문의 상세 정보 조회 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (inquiryId) {
      fetchInquiry()
    }
  }, [inquiryId])

  const handleStatusUpdate = async (newStatus: string) => {
    if (!inquiry) return

    setUpdatingStatus(true)
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', inquiry.id)

      if (error) {
        console.error('상태 업데이트 실패:', error)
        alert('상태 변경에 실패했습니다.')
        return
      }

      setInquiry({ ...inquiry, status: newStatus })
      alert(`상태가 '${newStatus}'로 변경되었습니다.`)
    } catch (error) {
      console.error('상태 업데이트 중 오류:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleSubmitResponse = async () => {
    if (!responseText.trim() || !inquiryId || !adminId) {
      alert('답변 내용을 입력해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('inquiry_responses')
        .insert({
          inquiry_id: inquiryId,
          admin_id: adminId,
          content: responseText.trim(),
          is_internal_note: false,
        })

      if (error) {
        console.error('답변 등록 실패:', error)
        alert('답변 등록에 실패했습니다.')
        return
      }

      // 문의의 updated_at 업데이트
      await supabase
        .from('inquiries')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', inquiryId)

      setResponseText('')
      alert('답변이 등록되었습니다.')
      fetchInquiry()
    } catch (error) {
      console.error('답변 등록 중 오류:', error)
      alert('답변 등록 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      '접수됨': 'bg-orange-100 text-orange-700',
      '처리중': 'bg-blue-100 text-blue-700',
      '완료': 'bg-green-100 text-green-700',
      '보류': 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      '높음': 'bg-red-100 text-red-700',
      '보통': 'bg-yellow-100 text-yellow-700',
      '낮음': 'bg-green-100 text-green-700',
    }
    return colors[priority] || 'bg-gray-100 text-gray-700'
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

  if (!inquiry) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 mb-4">문의를 찾을 수 없습니다.</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

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
              <h1 className="text-3xl font-bold text-gray-900">문의 상세</h1>
              <p className="text-gray-600">문의 ID: {inquiry.id.slice(0, 8)}</p>
            </div>
          </div>
        </div>

        {/* 상태 변경 버튼 */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">상태 변경</h3>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updatingStatus}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    inquiry.status === status
                      ? getStatusColor(status) + ' border-2 border-current'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 문의 정보 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(inquiry.status)}`}>
                  {inquiry.status}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(inquiry.priority)}`}>
                  {inquiry.priority}
                </span>
                {inquiry.priority === '높음' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                {inquiry.category}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 제목 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {inquiry.title}
              </h2>
            </div>

            {/* 메타 정보 */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>작성일: {formatFullDateTime(inquiry.created_at)}</span>
              </div>
              {inquiry.store?.name && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{inquiry.store.name}</span>
                </div>
              )}
              {inquiry.updated_at !== inquiry.created_at && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>최근 업데이트: {formatFullDateTime(inquiry.updated_at)}</span>
                </div>
              )}
            </div>

            {/* 내용 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {inquiry.content}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 답변 목록 */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">
                답변 ({inquiry.inquiry_responses?.length || 0})
              </h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inquiry.inquiry_responses && inquiry.inquiry_responses.length > 0 ? (
                inquiry.inquiry_responses.map((response) => (
                  <div key={response.id} className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="bg-orange-600 p-1.5 rounded-full">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-orange-700">관리자</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatFullDateTime(response.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {response.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  아직 답변이 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 답변 작성 */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">답변 작성</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="답변을 입력해주세요..."
                rows={6}
                maxLength={1000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-gray-900"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {responseText.length}/1000
                </span>
                <Button
                  onClick={handleSubmitResponse}
                  disabled={submitting || !responseText.trim()}
                  loading={submitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  답변 등록
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
