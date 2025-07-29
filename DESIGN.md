# CalendarStripV2 설계 문서

## 핵심 설계 원칙

CalendarStripV2는 다음과 같은 인터페이스 설계 원칙을 따릅니다:

### 1. 공개 API와 내부 구현의 명확한 분리

```jsx
// 올바른 사용법: 표준 React ref 패턴
const calendarRef = useRef(null);
<CalendarStripV2 ref={calendarRef} />

// 메서드 접근
calendarRef.current.jumpToDate(someDate);
```

공개된 메서드는 다음과 같습니다:
- jumpToDate(date)
- scrollToDate(date)
- getSelectedDate()
- goToNextWeek()
- goToPreviousWeek()
- getCurrentWeek()
- getWeeks()
- getCurrentWeekIndex()

### 2. 일관된 데이터 접근 패턴

데이터 흐름은 항상 일관된 방향으로 이루어집니다:

1. **상태 변경**: 상태(activeDate)는 항상 CalendarStripV2 내부에서 관리됩니다.
2. **이벤트 통지**: 상태 변경은 항상 onDateSelected와 같은 콜백을 통해 부모에게 통지됩니다.
3. **외부 제어**: 외부에서는 ref 메서드를 통해서만 상태 변경을 요청할 수 있습니다.

### 3. 명확한 계약과 책임

- **CalendarStripV2**: 날짜 표시, 스크롤, 선택 기능 담당
- **CalendarHeader**: 월 표시 담당
- **CalendarDateItem**: 개별 날짜 아이템 표시 담당
- **SwipeCalendar**: 앱 특화 비즈니스 로직과 UI 처리 담당

## 향후 확장성 고려사항

### 1. 플러그인 시스템

다양한 기능을 필요에 따라 추가할 수 있는 플러그인 시스템을 도입합니다:

```jsx
<CalendarStripV2
  plugins={[
    new DateRangeSelectionPlugin({ multiSelect: true }),
    new EventVisualizationPlugin({ dotColors: ['red', 'blue'] }),
  ]}
/>
```

### 2. 상태 관리 개선

외부 상태 관리와 더 잘 통합될 수 있는 구조로 개선:

```jsx
<CalendarStripV2
  stateManager={new CalendarStateManager({
    initialState,
    onChange: (newState) => updateExternalState(newState)
  })}
/>
```

### 3. 테마 시스템

일관된 테마 시스템 적용:

```jsx
<CalendarProvider theme={customTheme}>
  <CalendarStripV2 />
</CalendarProvider>
```

### 4. 성능 최적화 추가 방안

1. **가상화(Virtualization) 개선**:
   - 현재 FlatList를 사용하고 있지만, 대량의 날짜 데이터를 처리할 때 더 최적화된 렌더링 방식 도입 가능
   - 보이지 않는 날짜 아이템에 대한 렌더링 지연(LazyLoading) 강화

2. **메모이제이션(Memoization) 체계화**:
   - 컴포넌트 전반에 걸친 메모이제이션 전략 통일
   - 불필요한 렌더링을 더 정밀하게 방지

## 테스트 전략

1. **단위 테스트**:
   - 각 메서드의 독립적 기능 검증
   - 경계값 테스트(minDate, maxDate 등)

2. **통합 테스트**:
   - CalendarStripV2와 SwipeCalendar의 연동 테스트
   - 이벤트 핸들러 동작 검증

3. **성능 테스트**:
   - 대량의 마커가 있는 상태에서의 스크롤 성능
   - 메모리 사용량 모니터링

## 기술적 부채 관리

현재 코드베이스에서 개선이 필요한 부분:

1. **중복 코드**:
   - CalendarStrip과 CalendarStripV2 간 중복 로직 정리
   - 유틸리티 함수 통합

2. **타입 안정성**:
   - PropTypes에서 TypeScript로의 완전한 마이그레이션
   - 전체 코드베이스에 일관된 타입 적용

3. **테스트 커버리지**:
   - 주요 로직에 대한 테스트 코드 부재
   - 자동화된 테스트 체계 도입 필요

## 구현 우선순위

1. 표준 React ref 패턴 일관 적용 (완료)
2. 예외 처리 및 방어적 프로그래밍 개선 (완료)
3. 문서화 및 사용 예제 제공 (완료)
4. 테스트 코드 작성
5. 플러그인 시스템 도입
6. 테마 시스템 구현
7. 성능 최적화 추가 작업
