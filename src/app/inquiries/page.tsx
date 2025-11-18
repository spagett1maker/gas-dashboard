'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Inquiry } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Search, MessageCircle, Clock, AlertCircle, CheckCircle, Phone, Store } from 'lucide-react'

const STATUS_FILTERS = ['전체', '접수됨', '처리중', '완료', '보류']
const PRIORITY_FILTERS = ['전체', '높음', '보통', '낮음']

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('전체')
  const [priorityFilter, setPriorityFilter] = useState('전체')

  const fetchInquiries = async () => {
    setLoading(true)
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
          stores!store_id(
            name,
            address,
            user_id
          ),
          inquiry_responses(id, inquiry_id, admin_id, content, is_internal_note, created_at)
        `)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('문의 목록 로드 실패:', error)
      } else {
        // stores 배열을 단일 객체로 변환
        const formattedData = (data || []).map((item) => {
          const store = Array.isArray(item.stores) ? item.stores[0] : item.stores
          return {
            ...item,
            store
          }
        })

        // 각 store의 user_id로 profiles 조회
        const userIds = formattedData
          .map(item => item.store?.user_id)
          .filter(Boolean) as string[]

        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, phone')
            .in('id', userIds)

          // profiles를 store에 매핑
          const profilesMap = new Map(
            (profilesData || []).map(p => [p.id, p])
          )

          formattedData.forEach((item: any) => {
            if (item.store?.user_id) {
              const profile = profilesMap.get(item.store.user_id)
              if (profile) {
                item.store = { ...item.store, profiles: { phone: profile.phone } }
              }
            }
          })
        }

        setInquiries(formattedData as Inquiry[])
      }
    } catch (error) {
      console.error('문의 목록 로드 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInquiries()
  }, [])

  // 필터링 로직
  useEffect(() => {
    let filtered = inquiries

    // 상태 필터
    if (statusFilter !== '전체') {
      filtered = filtered.filter(inquiry => inquiry.status === statusFilter)
    }

    // 우선순위 필터
    if (priorityFilter !== '전체') {
      filtered = filtered.filter(inquiry => inquiry.priority === priorityFilter)
    }

    // 검색 필터
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(inquiry =>
        inquiry.title?.toLowerCase().includes(term) ||
        inquiry.content?.toLowerCase().includes(term) ||
        inquiry.store?.name?.toLowerCase().includes(term)
      )
    }

    setFilteredInquiries(filtered)
  }, [inquiries, statusFilter, priorityFilter, searchTerm])

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

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactElement> = {
      '접수됨': <Clock className="h-4 w-4" />,
      '처리중': <MessageCircle className="h-4 w-4" />,
      '완료': <CheckCircle className="h-4 w-4" />,
      '보류': <AlertCircle className="h-4 w-4" />,
    }
    return icons[status] || <Clock className="h-4 w-4" />
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">문의 관리</h1>
            <p className="mt-2 text-gray-600">고객 문의를 확인하고 답변하세요.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button onClick={fetchInquiries} loading={loading}>
              새로고침
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {STATUS_FILTERS.filter(f => f !== '전체').map((status) => {
            const count = inquiries.filter(i => i.status === status).length
            return (
              <Card key={status}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{status}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loading ? '...' : count}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 필터 및 검색 */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* 상태 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        statusFilter === status
                          ? 'bg-orange-100 text-orange-700 border border-orange-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* 우선순위 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
                <div className="flex flex-wrap gap-2">
                  {PRIORITY_FILTERS.map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setPriorityFilter(priority)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        priorityFilter === priority
                          ? 'bg-orange-100 text-orange-700 border border-orange-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              {/* 검색창 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="제목, 내용 또는 가게명으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full text-gray-900"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 문의 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInquiries.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">
                    {searchTerm || statusFilter !== '전체' || priorityFilter !== '전체'
                      ? '검색 결과가 없습니다.'
                      : '아직 문의가 없습니다.'}
                  </p>
                  {(searchTerm || statusFilter !== '전체' || priorityFilter !== '전체') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('전체')
                        setPriorityFilter('전체')
                      }}
                    >
                      필터 초기화
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredInquiries.map((inquiry) => (
                  <Link key={inquiry.id} href={`/inquiries/${inquiry.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                                {inquiry.status}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(inquiry.priority)}`}>
                                {inquiry.priority}
                              </span>
                              {inquiry.priority === '높음' && (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {inquiry.title}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                              {inquiry.content}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatDateTime(inquiry.updated_at)}
                              </span>
                              {inquiry.store?.name && (
                                <span className="flex items-center">
                                  <Store className="h-4 w-4 mr-1" />
                                  {inquiry.store.name}
                                </span>
                              )}
                              {inquiry.store?.profiles?.phone && (
                                <span className="flex items-center">
                                  <Phone className="h-4 w-4 mr-1" />
                                  {inquiry.store.profiles.phone}
                                </span>
                              )}
                              <span className="flex items-center">
                                <MessageCircle className="h-4 w-4 mr-1" />
                                답변 {inquiry.inquiry_responses?.length || 0}개
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                {inquiry.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
