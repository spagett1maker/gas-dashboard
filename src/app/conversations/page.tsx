'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Conversation } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Search, MessageCircle, Clock, User } from 'lucide-react'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id,
          store_id,
          admin_id,
          updated_at,
          stores(name),
          messages(id, conversation_id, sender_id, content, created_at)
        `)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('대화 목록 로드 실패:', error)
      } else {
        const formattedData = (data || []).map(item => ({
          ...item,
          store: Array.isArray(item.stores) ? item.stores[0] : item.stores
        }))
        setConversations(formattedData as Conversation[])
      }
    } catch (error) {
      console.error('대화 목록 로드 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  // 검색 필터링
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConversations(conversations)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = conversations.filter(conversation =>
        conversation.store?.name?.toLowerCase().includes(term) ||
        conversation.messages?.some(msg =>
          msg.content?.toLowerCase().includes(term)
        )
      )
      setFilteredConversations(filtered)
    }
  }, [conversations, searchTerm])

  const getLatestMessage = (conversation: Conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return '메시지 없음'
    }
    const latest = conversation.messages[conversation.messages.length - 1]
    return latest.content || '메시지 없음'
  }

  const getLatestMessageTime = (conversation: Conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return formatDateTime(conversation.updated_at)
    }
    const latest = conversation.messages[conversation.messages.length - 1]
    return formatDateTime(latest.created_at)
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">고객센터</h1>
            <p className="mt-2 text-gray-600">고객 문의와 채팅을 관리하세요.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button onClick={fetchConversations} loading={loading}>
              새로고침
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">전체 대화</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : filteredConversations.length.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-orange-50 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">미할당 대화</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : conversations.filter(c => !c.admin_id).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-50 p-3 rounded-lg">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">활성 고객</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : new Set(conversations.map(c => c.user_id)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="가게명 또는 메시지 내용으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full text-gray-900"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-500">
                총 {filteredConversations.length}개의 대화
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 대화 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConversations.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">
                    {searchTerm ? '검색 결과가 없습니다.' : '아직 고객 문의가 없습니다.'}
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
                {filteredConversations.map((conversation) => (
                  <Link key={conversation.id} href={`/conversations/${conversation.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-purple-50 p-3 rounded-full">
                              <MessageCircle className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {conversation.store?.name || '알 수 없는 가게'}
                                </h3>
                                {!conversation.admin_id && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    미할당
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm line-clamp-2">
                                {getLatestMessage(conversation)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {getLatestMessageTime(conversation)}
                            </p>
                            {conversation.messages && conversation.messages.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                {conversation.messages.length}개 메시지
                              </p>
                            )}
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

