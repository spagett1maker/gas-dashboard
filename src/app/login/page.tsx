'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // 이미 로그인되어 있는지 확인
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/')
      }
    }
    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.')
        console.error('로그인 에러:', signInError)
        return
      }

      if (data.session) {
        // 프로필 확인 (어드민 권한 체크)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error('프로필 조회 에러:', profileError)
          setError('사용자 정보를 확인할 수 없습니다.')
          await supabase.auth.signOut()
          return
        }

        // 어드민 권한 체크 (필요시 추가)
        // if (profile.role !== 'admin') {
        //   setError('관리자 권한이 필요합니다.')
        //   await supabase.auth.signOut()
        //   return
        // }

        // 로그인 성공, 대시보드로 이동
        router.push('/')
      }
    } catch (err) {
      console.error('로그인 중 오류:', err)
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">가스 관리 시스템</h1>
          <p className="text-gray-600">관리자 로그인</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900">로그인</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                <LogIn className="h-4 w-4 mr-2" />
                로그인
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-4">
          계정이 없으신가요? 관리자에게 문의하세요.
        </p>
      </div>
    </div>
  )
}
