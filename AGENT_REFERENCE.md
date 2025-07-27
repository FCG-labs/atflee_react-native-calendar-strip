# React Native CalendarStrip 프로젝트 에이전트 참고 문서

## 📋 프로젝트 개요

React Native 환경에서 사용하는 캘린더 스트립 컴포넌트 라이브러리입니다. 
- **메인 기능**: 주간/일간 캘린더 뷰 제공, 무한 스크롤, 네이티브 최적화
- **패턴**: Carousel 패턴 기반 5주 고정 윈도우
- **플랫폼**: iOS, Android 지원

## 🏗️ 아키텍처 설계 원칙

### 1. 공개 API와 내부 구현의 명확한 분리
- 외부에서 호출 가능한 메서드는 명확한 문서화와 일관된 동작 제공
- 내부 구현 세부사항은 외부로부터 감춤
- PropTypes와 defaultProps를 통한 명확한 인터페이스 정의

### 2. 일관성 있는 데이터 접근 패턴
- 데이터 접근 방식이 전체 코드베이스에서 일관됨
- 동일한 데이터에 여러 경로로 접근하지 않음
- 중앙집중화된 상태 관리

### 3. 명확한 계약과 책임
- 각 컴포넌트와 모듈의 역할이 명확히 정의됨
- 필요한 의존성은 명시적으로 주입받음
- 단일 책임 원칙(SRP) 준수

## 📁 디렉토리 구조

```
src/
├── components/              # React 컴포넌트
│   ├── CalendarStrip.js    # 메인 캘린더 컴포넌트 (15.9KB)
│   └── CalendarDateItem.js # 개별 날짜 아이템 (6.2KB)
├── native/                 # 네이티브 모듈 인터페이스
│   └── CalendarNativeModule.js # 네이티브 브리지 (7.7KB)
├── img/                    # 이미지 리소스
├── utils/                  # 유틸리티 함수 (현재 비어있음)
├── CalendarHeader.js       # 헤더 컴포넌트 (3.2KB)
├── Calendar.style.js       # 공통 스타일 (1.7KB)
└── dayjs.js               # 날짜 라이브러리 설정 (1.9KB)
```

## 🔧 주요 컴포넌트 분석

### CalendarStrip (메인 컴포넌트)
**파일**: `/src/components/CalendarStrip.js`
**역할**: 
- 캘린더의 전체 로직과 상태 관리
- Carousel 패턴으로 5주 고정 윈도우 구현
- 무한 스크롤링과 중앙 포커스 기능
- FlatList 기반 가상화된 렌더링

**주요 기능**:
- `selectedDate`: 선택된 날짜 관리
- `scrollable`: 스크롤 가능 여부
- `useIsoWeekday`: ISO 주간 설정
- `minDate`/`maxDate`: 날짜 범위 제한

### CalendarDateItem (개별 날짜 컴포넌트)
**파일**: `/src/components/CalendarDateItem.js`
**역할**:
- 개별 날짜 아이템의 렌더링
- React.memo로 최적화된 리렌더링 방지
- 접근성 지원 및 사용자 상호작용 처리

**최적화**:
- `memo()` HOC 적용으로 불필요한 리렌더링 방지
- 접근성 라벨 자동 생성
- 마커와 스타일링 지원

### CalendarHeader (헤더 컴포넌트)
**파일**: `/src/CalendarHeader.js`
**역할**:
- 월/주 헤더 표시 및 포맷팅
- 사용자 정의 헤더 형식 지원
- 월 경계를 넘나드는 주간 표시 처리

### CalendarNativeModule (네이티브 브리지)
**파일**: `/src/native/CalendarNativeModule.js`
**역할**:
- 네이티브 모듈과의 인터페이스
- 성능 최적화를 위한 네이티브 계산
- JavaScript 폴백 구현

**특징**:
- 네이티브 모듈 사용 불가 시 JS 구현으로 자동 폴백
- 주 계산 등 복잡한 로직을 네이티브에서 처리
- Promise 기반 비동기 API

## 📚 기술 스택

### 핵심 의존성
- **React Native**: 메인 프레임워크
- **dayjs**: 날짜 처리 라이브러리
- **PropTypes**: 타입 검증

### dayjs 플러그인
- `isoWeek`: ISO 주간 지원
- `isBetween`: 날짜 범위 검사
- `advancedFormat`: 고급 포맷팅
- `weekday`: 요일 처리

## 🎨 스타일링 시스템

### Calendar.style.js
- 전체 프로젝트의 공통 스타일 정의
- StyleSheet.create() 사용으로 최적화
- 일관된 디자인 시스템 제공

### 스타일 카테고리
- **Calendar Styles**: 메인 컨테이너 및 레이아웃
- **Calendar Day**: 개별 날짜 아이템 스타일
- **Responsive**: 반응형 디자인 지원

## 🔄 데이터 플로우

### 상태 관리
1. **CalendarStrip**: 선택된 날짜, 현재 뷰 상태 관리
2. **Props Drilling**: 필요한 데이터를 하위 컴포넌트로 전달
3. **Callback Pattern**: 사용자 액션을 상위로 전파

### 최적화 전략
- **FlatList 가상화**: 대량 데이터 렌더링 최적화
- **React.memo**: 불필요한 리렌더링 방지
- **Native Module**: 성능 크리티컬한 계산을 네이티브에서 처리

## 🚀 개발 가이드라인

### 새로운 기능 추가 시
1. **인터페이스 우선 설계**: API 정의 후 구현
2. **책임 분리**: 기능별로 적절한 컴포넌트에 배치
3. **타입 안전성**: PropTypes 정의 필수
4. **성능 고려**: 렌더링 최적화 방안 검토

### 코드 수정 시
1. **기존 API 호환성** 유지
2. **테스트 커버리지** 확인
3. **접근성 가이드라인** 준수
4. **크로스 플랫폼 호환성** 검증

## 🐛 주의사항

### 알려진 제약사항
- Android에서 LayoutAnimation 수동 활성화 필요
- Metro bundler의 동적 require 제한으로 locale 정적 매핑
- Native module 의존성 관리 필요

### 성능 고려사항
- 대량 날짜 데이터 처리 시 가상화 활용
- 빈번한 날짜 계산은 네이티브 모듈 사용 권장
- 스타일 객체 재생성 방지

## 📝 확장 포인트

### 쉽게 확장 가능한 영역
- **커스텀 마커**: markerComponent prop 활용
- **스타일링**: 다양한 style props 제공
- **로케일 지원**: dayjs locale 확장
- **애니메이션**: LayoutAnimation 커스터마이징

### 주의가 필요한 영역
- **네이티브 모듈**: 플랫폼별 구현 필요
- **날짜 계산**: 타임존 및 DST 고려
- **성능 최적화**: 메모리 사용량 모니터링

---

**마지막 업데이트**: 2025-07-28
**프로젝트 버전**: React Native CalendarStrip
**문서 버전**: 1.0
