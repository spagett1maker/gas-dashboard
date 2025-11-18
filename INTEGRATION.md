# gas-dashboard와 gas-web-2 통합 완료

## 개요
gas-web-2 (고객용 앱)과 gas-dashboard (관리자 대시보드)의 데이터베이스 스키마와 타입이 동기화되었습니다.

## 완료된 통합 작업

### 1. 타입 및 상수 동기화
- ✅ SERVICE_NAME_MAP 동기화
- ✅ SERVICE_STATUS 상수 추가
- ✅ INQUIRY_CATEGORIES 상수 추가
- ✅ PRIORITY_LEVELS 상수 추가
- ✅ BURNER_TYPES 가격 정보 추가
- ✅ ADMIN_USER_ID 환경변수 추가
- ✅ Store 인터페이스에 phone 필드 추가

### 2. 데이터베이스 스키마 업데이트
- ✅ stores 테이블에 phone 필드 지원 추가
- ✅ 가게 목록 페이지에 전화번호 표시
- ✅ 가게 상세 페이지에 전화번호 표시
- ✅ 문의 목록에 가게 전화번호 표시
- ✅ 문의 상세 페이지에 가게 정보 (이름, 주소, 전화번호) 표시

### 3. 프로필 데이터 처리 개선
- ✅ Supabase 조인 쿼리에서 profiles 배열 처리
- ✅ 타입 안전한 데이터 변환 로직 구현

### 4. 환경 변수 설정
- ✅ .env.example 파일 생성
- ✅ ADMIN_USER_ID 환경변수 추가

## 공통 데이터베이스 스키마

### stores 테이블
```typescript
{
  id: string
  name: string
  address: string
  phone?: string          // ✅ 추가됨
  user_id: string
  created_at: string
}
```

### service_requests 테이블
```typescript
{
  id: string
  status: '요청됨' | '진행중' | '완료' | '취소'
  created_at: string
  working_at?: string
  completed_at?: string
  canceled_at?: string
  store_id: string
  service_id: string
}
```

### inquiries 테이블
```typescript
{
  id: string
  user_id: string
  store_id?: string
  title: string
  content: string
  category: string
  status: string
  priority: string
  created_at: string
  updated_at: string
}
```

## 사용 방법

### 1. 환경 변수 설정
두 프로젝트 모두 동일한 Supabase 인스턴스를 사용해야 합니다:

```bash
# .env 파일 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ADMIN_USER_ID=your_admin_user_id
```

### 2. 관리자 권한 설정
gas-web-2에서 생성한 관리자 계정의 user_id를 `NEXT_PUBLIC_ADMIN_USER_ID`에 설정합니다.

### 3. 데이터 흐름
1. **고객 (gas-web-2)**
   - 가게 등록 (stores 테이블에 추가)
   - 서비스 요청 (service_requests 테이블에 추가)
   - 문의 등록 (inquiries 테이블에 추가)

2. **관리자 (gas-dashboard)**
   - 모든 가게/서비스/문의 조회
   - 서비스 요청 상태 변경
   - 문의 답변 작성
   - 실시간 채팅 응답

## 주요 파일 위치

### gas-dashboard
- `/src/lib/supabase.ts` - 공통 타입 및 상수
- `/src/app/stores/page.tsx` - 가게 목록
- `/src/app/stores/[id]/page.tsx` - 가게 상세
- `/src/app/services/page.tsx` - 서비스 요청 목록
- `/src/app/inquiries/page.tsx` - 문의 목록
- `/src/app/conversations/page.tsx` - 대화 목록

### gas-web-2
- `/lib/supabase.ts` - Supabase 클라이언트
- `/lib/constants.ts` - 공통 상수
- `/app/profile/add-store/page.tsx` - 가게 등록
- `/app/service/*/page.tsx` - 서비스 요청 페이지들
- `/app/service/inquiry-create/page.tsx` - 문의 등록

## 아직 미구현된 기능

### Priority 1 (핵심)
- ❌ 관리자 역할 기반 접근 제어 (현재 ID만 체크)
- ❌ 가게 정보 수정 기능
- ❌ 서비스 타입 관리 (services 테이블 CRUD)
- ❌ 사용자 관리 UI
- ❌ 알림 발송 기능 (notifications 테이블 사용)

### Priority 2 (중요)
- ❌ 결제 정보 추적
- ❌ 기사 배정 시스템
- ❌ 데이터 내보내기 (CSV/PDF)
- ❌ 고급 분석 대시보드
- ❌ 이메일/SMS 알림 통합

### Priority 3 (개선)
- ❌ 파일 업로드 (서비스 사진)
- ❌ 일정 관리
- ❌ 감사 로그
- ❌ 다중 관리자 지원

## 테스트 방법

### 1. 데이터베이스 테스트
```sql
-- stores 테이블 확인
SELECT id, name, address, phone, user_id, created_at FROM stores LIMIT 5;

-- service_requests 테이블 확인
SELECT id, status, store_id, service_id, created_at FROM service_requests LIMIT 5;

-- inquiries 테이블 확인
SELECT id, title, status, priority, store_id, created_at FROM inquiries LIMIT 5;
```

### 2. 통합 테스트 시나리오
1. gas-web-2에서 가게 등록
2. gas-dashboard에서 해당 가게가 목록에 보이는지 확인
3. gas-web-2에서 서비스 요청
4. gas-dashboard에서 요청이 보이고 상태 변경 가능한지 확인
5. gas-web-2에서 문의 등록
6. gas-dashboard에서 문의 보이고 답변 작성 가능한지 확인

## 트러블슈팅

### 문제: 가게 목록이 비어있음
- Supabase URL과 Key가 올바른지 확인
- Row Level Security (RLS) 정책 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 문제: profiles 관련 에러
- Supabase에서 profiles 테이블이 존재하는지 확인
- user_id가 올바르게 설정되었는지 확인

### 문제: 관리자 접근 불가
- ADMIN_USER_ID 환경변수가 설정되었는지 확인
- gas-web-2의 ADMIN_USER_ID와 동일한지 확인

## 다음 단계

1. **역할 기반 접근 제어 구현**
   - profiles 테이블에 role 컬럼 활용
   - admin, technician, customer 역할 구분

2. **가게 정보 편집 기능 추가**
   - 가게 상세 페이지에 수정 버튼 추가
   - 모달 또는 별도 페이지에서 수정 폼 제공

3. **알림 시스템 구축**
   - 서비스 요청 상태 변경 시 자동 알림
   - 문의 답변 시 알림
   - 실시간 푸시 알림 (선택사항)

4. **분석 대시보드 개선**
   - 실제 데이터 기반 차트
   - 기간별 필터링
   - 지역별/서비스별 통계

## 참고 사항

- 두 프로젝트는 동일한 Supabase 인스턴스를 공유합니다
- 데이터 변경은 실시간으로 반영되지 않으므로 새로고침이 필요합니다
- 추후 Supabase Realtime을 활용한 실시간 업데이트 구현 가능
- 타입스크립트 타입은 수동으로 동기화되므로 스키마 변경 시 주의 필요

## 문의

통합 과정에서 문제가 발생하면 다음을 확인하세요:
1. 환경 변수 설정
2. Supabase 테이블 스키마
3. Row Level Security 정책
4. 브라우저 개발자 도구 콘솔 로그
