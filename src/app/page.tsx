'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { BarChart3, Users, Wrench, MessageCircle, TrendingUp, Clock } from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

interface DashboardStats {
  totalRequests: number
  pendingRequests: number
  totalStores: number
  totalConversations: number
  completedToday: number
  inProgressRequests: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    pendingRequests: 0,
    totalStores: 0,
    totalConversations: 0,
    completedToday: 0,
    inProgressRequests: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 전체 서비스 요청 수
        const { count: totalRequests } = await supabase
          .from('service_requests')
          .select('*', { count: 'exact', head: true })

        // 대기 중인 요청 수
        const { count: pendingRequests } = await supabase
          .from('service_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', '요청됨')

        // 진행 중인 요청 수
        const { count: inProgressRequests } = await supabase
          .from('service_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', '진행중')

        // 오늘 완료된 요청 수
        const today = new Date().toISOString().split('T')[0]
        const { count: completedToday } = await supabase
          .from('service_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', '완료')
          .gte('completed_at', `${today}T00:00:00.000Z`)

        // 전체 가게 수
        const { count: totalStores } = await supabase
          .from('stores')
          .select('*', { count: 'exact', head: true })

        // 전체 대화 수
        const { count: totalConversations } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })

        setStats({
          totalRequests: totalRequests || 0,
          pendingRequests: pendingRequests || 0,
          inProgressRequests: inProgressRequests || 0,
          completedToday: completedToday || 0,
          totalStores: totalStores || 0,
          totalConversations: totalConversations || 0,
        })
      } catch (error) {
        console.error('통계 데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: '대기 중인 요청',
      value: stats.pendingRequests,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/services?status=요청됨',
      change: '+12%',
      changeType: 'increase' as const,
    },
    {
      title: '진행 중인 작업',
      value: stats.inProgressRequests,
      icon: Wrench,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/services?status=진행중',
      change: '+8%',
      changeType: 'increase' as const,
    },
    {
      title: '오늘 완료',
      value: stats.completedToday,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/services?status=완료',
      change: '+23%',
      changeType: 'increase' as const,
    },
    {
      title: '등록된 가게',
      value: stats.totalStores,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/stores',
      change: '+5%',
      changeType: 'increase' as const,
    },
  ]

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-2 text-gray-600">가스 서비스 요청 및 고객 관리 현황을 확인하세요.</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon
            return (
              <Link key={index} href={card.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {loading ? '...' : card.value.toLocaleString()}
                        </p>
                        <div className="flex items-center mt-2">
                          <span className={`text-sm font-medium ${
                            card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {card.change}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">지난주 대비</span>
                        </div>
                      </div>
                      <div className={`${card.bgColor} p-3 rounded-lg`}>
                        <Icon className={`h-6 w-6 ${card.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* 빠른 액션 및 최근 활동 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 빠른 액션 */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">빠른 액션</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link
                  href="/services?status=요청됨"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="bg-orange-50 p-2 rounded-lg group-hover:bg-orange-100 transition-colors">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">대기 중인 요청 처리</p>
                    <p className="text-sm text-gray-600">새로운 서비스 요청을 확인하고 처리하세요</p>
                  </div>
                </Link>
                <Link
                  href="/conversations"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="bg-purple-50 p-2 rounded-lg group-hover:bg-purple-100 transition-colors">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">고객 문의 응답</p>
                    <p className="text-sm text-gray-600">고객의 문의사항에 답변하세요</p>
                  </div>
                </Link>
                <Link
                  href="/stores"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="bg-green-50 p-2 rounded-lg group-hover:bg-green-100 transition-colors">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">가게 정보 관리</p>
                    <p className="text-sm text-gray-600">등록된 가게들의 정보를 관리하세요</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 시스템 상태 */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">시스템 상태</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">전체 서비스 요청</span>
                  <span className="text-sm font-bold text-gray-900">
                    {loading ? '...' : stats.totalRequests.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">활성 대화</span>
                  <span className="text-sm font-bold text-gray-900">
                    {loading ? '...' : stats.totalConversations.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">시스템 상태</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    정상
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">마지막 업데이트</span>
                  <span className="text-sm text-gray-500">방금 전</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

