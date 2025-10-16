'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Message } from '@/lib/supabase'
import { formatTime } from '@/lib/utils'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  ArrowLeft, 
  Send, 
  MessageCircle,
  User,
  Store
} from 'lucide-react'

interface ConversationDetail {
  id: string
  user_id: string
  store_id: string
  admin_id?: string
  updated_at: string
  stores?: {
    name: string
    address: string
  }
}

export default function ConversationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [conversation, setConversation] = useState<ConversationDetail | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [adminId, setAdminId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  const conversationId = params.id as string

  // 관리자 ID 가져오기
  useEffect(() => {
    const getAdminId = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user?.id) {
        setAdminId(data.user.id)
      }
    }
    getAdminId()
  }, [])

  // 대화 정보 및 메시지 로드
  useEffect(() => {
    const fetchConversationData = async () => {
      if (!conversationId) return

      try {
        // 대화 정보 가져오기
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .select(`
            id,
            user_id,
            store_id,
            admin_id,
            updated_at,
            stores:store_id(name, address)
          `)
          .eq('id', conversationId)
          .single()

        if (conversationError) {
          console.error('대화 정보 조회 실패:', conversationError)
          return
        }

        // stores가 배열로 반환되므로 첫 번째 요소를 사용
        const processedData = {
          ...conversationData,
          stores: Array.isArray(conversationData.stores) && conversationData.stores.length > 0 
            ? conversationData.stores[0] 
            : { name: '알 수 없는 가게', address: '주소 정보 없음' }
        }

        setConversation(processedData)    

        // 관리자 자동 할당 (admin_id가 없는 경우)
        if (!conversationData.admin_id && adminId) {
          await supabase
            .from('conversations')
            .update({ admin_id: adminId })
            .eq('id', conversationId)
        }

        // 메시지 가져오기
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        if (messagesError) {
          console.error('메시지 조회 실패:', messagesError)
        } else {
          setMessages(messagesData || [])
        }

      } catch (error) {
        console.error('데이터 로드 중 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    if (conversationId && adminId) {
      fetchConversationData()
    }
  }, [conversationId, adminId])

  // 실시간 메시지 구독
  useEffect(() => {
    if (!conversationId) return

    // 기존 채널 제거
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // 새 채널 구독
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => [...prev, newMessage])
          scrollToBottom()
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId])

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !adminId || sending) return

    setSending(true)
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: adminId,
        content: newMessage.trim(),
      })

      if (error) {
        console.error('메시지 전송 실패:', error)
        alert('메시지 전송에 실패했습니다.')
        return
      }

      // 대화 업데이트 시간 갱신
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      setNewMessage('')
      scrollToBottom()

    } catch (error) {
      console.error('메시지 전송 중 오류:', error)
      alert('메시지 전송 중 오류가 발생했습니다.')
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
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

  if (!conversation) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">대화를 찾을 수 없습니다.</p>
              <Button onClick={() => router.back()} className="mt-4">
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
      <div className="p-6 h-[calc(100vh-2rem)] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              돌아가기
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {conversation.stores?.name || '알 수 없는 가게'}
              </h1>
              <p className="text-gray-600 text-sm">
                {conversation.stores?.address}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Store className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">고객센터 채팅</span>
          </div>
        </div>

        {/* 메시지 영역 */}
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">아직 메시지가 없습니다.</p>
                    <p className="text-gray-400 text-sm">첫 메시지를 보내보세요!</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === adminId ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === adminId
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender_id === adminId
                            ? 'text-orange-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 메시지 입력 */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="메시지를 입력하세요..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-gray-900"
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  loading={sending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

