'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Store } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Search, MapPin, Calendar, Eye, Users } from 'lucide-react'

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchStores = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('가게 목록 로드 실패:', error)
      } else {
        setStores(data || [])
      }
    } catch (error) {
      console.error('가게 목록 로드 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStores()
  }, [])

  // 검색 필터링
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStores(stores)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = stores.filter(store =>
        store.name?.toLowerCase().includes(term) ||
        store.address?.toLowerCase().includes(term)
      )
      setFilteredStores(filtered)
    }
  }, [stores, searchTerm])

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">가게 관리</h1>
            <p className="mt-2 text-gray-600">등록된 가게들을 관리하고 정보를 확인하세요.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button onClick={fetchStores} loading={loading}>
              새로고침
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">전체 가게</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : filteredStores.length.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-50 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">이번 달 신규</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : stores.filter(store => {
                      const storeDate = new Date(store.created_at)
                      const currentDate = new Date()
                      return storeDate.getMonth() === currentDate.getMonth() && 
                             storeDate.getFullYear() === currentDate.getFullYear()
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">활성 지역</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : new Set(stores.map(store => 
                      store.address?.split(' ')[0] || ''
                    ).filter(Boolean)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 필터 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="가게명 또는 주소로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full text-gray-900"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-500">
                총 {filteredStores.length}개의 가게
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 가게 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStores.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">
                    {searchTerm ? '검색 결과가 없습니다.' : '등록된 가게가 없습니다.'}
                  </p>
                  {searchTerm && (
                    <Button variant="outline" onClick={() => setSearchTerm('')}>
                      검색 초기화
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredStores.map((store) => (
                  <Card key={store.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {store.name}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              활성
                            </span>
                          </div>
                          <div className="flex items-start space-x-2 mb-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-600 text-sm">
                              {store.address}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>등록일: {formatDate(store.created_at)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>ID: {store.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link href={`/stores/${store.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              상세보기
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

