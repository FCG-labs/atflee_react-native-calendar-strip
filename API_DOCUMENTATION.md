# React Native Calendar Strip API Documentation

## Overview

React Native Calendar Strip은 React Native 애플리케이션을 위한 고성능 캘린더 컴포넌트입니다. 이 라이브러리는 무한 양방향 스크롤, 이벤트 마커, 주별 표시, 그리고 커스텀 스타일링을 지원합니다. 컨트롤러 기반 아키텍처를 사용하여 상태 관리와 UI 렌더링을 분리하고, 네이티브 모듈 통합을 통해 성능을 최적화했습니다.

## 설치

```bash
npm install atflee_react-native-calendar-strip --save
# or
yarn add atflee_react-native-calendar-strip
```

## 컴포넌트

### CalendarStrip

메인 컴포넌트로, 스크롤 가능한 캘린더 스트립을 렌더링합니다.

#### Props

##### 캘린더 구성

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `selectedDate` | `Date` | `new Date()` | 선택된 날짜 |
| `startingDate` | `Date` | `new Date()` | `selectedDate`가 제공되지 않은 경우 사용할 시작 날짜 |
| `minDate` | `Date` | `undefined` | 스크롤 가능한 최소 날짜 |
| `maxDate` | `Date` | `undefined` | 스크롤 가능한 최대 날짜 |
| `useIsoWeekday` | `boolean` | `false` | ISO 표준(월요일이 첫 요일)을 사용할지 여부 |
| `numDaysInWeek` | `number` | `7` | 주당 표시할 날짜 수 (5-14 범위) |
| `scrollable` | `boolean` | `true` | 스크롤 가능 여부 |
| `scrollerPaging` | `boolean` | `true` | 페이지 단위 스크롤 여부 |

##### 헤더 구성

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `showMonth` | `boolean` | `true` | 월 헤더 표시 여부 |
| `calendarHeaderFormat` | `string` | `'MMMM YYYY'` | 헤더 날짜 포맷(dayjs 형식) |
| `calendarHeaderPosition` | `string` | `'top'` | 헤더 위치 (`top` or `bottom`) |
| `calendarHeaderStyle` | `Object` | `{}` | 헤더 스타일 |

##### 스타일링

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `style` | `Object` | `{}` | 컨테이너 스타일 |
| `calendarColor` | `string` | `'#fff'` | 캘린더 배경색 |
| `highlightColor` | `string` | `'#000'` | 선택된 날짜 강조색 |
| `dateNameStyle` | `Object` | `{}` | 요일 텍스트 스타일 |
| `dateNumberStyle` | `Object` | `{}` | 날짜 텍스트 스타일 |
| `highlightDateNameStyle` | `Object` | `{}` | 선택된 요일 텍스트 스타일 |
| `highlightDateNumberStyle` | `Object` | `{}` | 선택된 날짜 텍스트 스타일 |
| `dayContainerStyle` | `Object` | `{}` | 날짜 컨테이너 스타일 |
| `disabledDateOpacity` | `number` | `0.3` | 비활성화된 날짜 투명도 |
| `styleWeekend` | `boolean` | `false` | 주말 스타일 적용 여부 |

##### 표시 옵션

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `showDayName` | `boolean` | `true` | 요일 이름(월, 화 등) 표시 여부 |
| `showDayNumber` | `boolean` | `true` | 날짜 숫자(1, 2, 3 등) 표시 여부 |
| `upperCaseDays` | `boolean` | `false` | 요일 이름 대문자 변환 여부 |
| `allowDayTextScaling` | `boolean` | `true` | 텍스트 크기 조정 허용 여부 |

##### 이벤트와 콜백

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `onDateSelected` | `Function` | `undefined` | 날짜 선택 시 호출되는 콜백: `(date) => void` |
| `onWeekChanged` | `Function` | `undefined` | 주 변경 시 호출되는 콜백: `(start: Dayjs, end: Dayjs) => void` |
| `onHeaderSelected` | `Function` | `undefined` | 헤더 선택 시 호출되는 콜백: `() => void` |
| `updateMonthYear` | `Function` | `undefined` | 표시되는 월/연도 업데이트 시 호출되는 콜백: `(month, year) => void` (`month`: `MM`, `year`: `YYYY`) |

##### 커스텀 컴포넌트

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `dayComponent` | `Component` | `undefined` | 날짜 렌더링에 사용할 커스텀 컴포넌트 |
| `leftSelector` | `Component` | `undefined` | 좌측 화살표 커스텀 컴포넌트 |
| `rightSelector` | `Component` | `undefined` | 우측 화살표 커스텀 컴포넌트 |

##### 마커

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `markedDates` | `Array` | `[]` | 마커가 표시될 날짜 객체 배열: `[{date, dots}]` |
| `markedDatesStyle` | `Object` | `{}` | 마커 스타일 |
| `markerComponent` | `Component` | `undefined` | 커스텀 마커 컴포넌트 |

##### 참조

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `calendarRef` | `Ref` | `undefined` | 캘린더 메서드에 접근하는 Ref |

#### 메서드

`calendarRef`를 통해 다음 메서드에 접근할 수 있습니다:

| Method | Parameters | Description |
| --- | --- | --- |
| `jumpToDate` | `(date: Date)` | 특정 날짜로 즉시 이동 |
| `scrollToDate` | `(date: Date)` | 특정 날짜로 스크롤(jumpToDate와 동일) |
| `getSelectedDate` | `()` | 현재 선택된 날짜 반환 |
| `goToNextWeek` | `()` | 다음 주로 이동 |
| `goToPreviousWeek` | `()` | 이전 주로 이동 |

## 컨트롤러

### CalendarController

캘린더의 상태와 날짜 계산을 관리하는 클래스입니다.

#### 생성자

```javascript
new CalendarController({
  initialDate: new Date(), // 초기 선택 날짜
  useIsoWeekday: false,   // ISO 요일 사용 여부
  numDaysInWeek: 7        // 주당 표시할 일수
})
```

#### 메서드

| Method | Parameters | Return | Description |
| --- | --- | --- | --- |
| `addListener` | `(listener: Function)` | `Function` | 상태 변경 리스너 추가. 제거 함수 반환 |
| `jumpToDate` | `(date: Date)` | `void` | 특정 날짜로 즉시 이동 |
| `goToNextWeek` | `()` | `void` | 다음 주로 이동 |
| `goToPreviousWeek` | `()` | `void` | 이전 주로 이동 |
| `getCurrentWeek` | `()` | `Array` | 현재 표시중인 주의 날짜 배열 |
| `getCurrentWeekIndex` | `()` | `number` | 현재 주의 인덱스 |
| `getWeeks` | `()` | `Object` | 캐시된 주 데이터 |
| `getSelectedDateNative` | `()` | `Date` | 선택된 날짜(Native Date 객체) |

## 네이티브 모듈 통합

CalendarStrip은 성능을 최적화하기 위해 네이티브 모듈 통합을 지원합니다. 다음 기능들이 네이티브로 구현되어 있습니다:

### Android (ATFCalendarModule.java)

- `generateWeekDates`: 주의 날짜를 생성하는 함수
- `getDatesBetween`: 두 날짜 사이의 날짜를 생성하는 함수
- `getNativeWeekDates`: 네이티브에서 주 날짜를 생성하는 함수

### iOS (ATFCalendarModule.swift)

- `generateWeekDates`: 주의 날짜를 생성하는 함수
- `getDatesBetween`: 두 날짜 사이의 날짜를 생성하는 함수

## 예시

### 기본 사용법

```jsx
import React, { useRef } from 'react';
import { View } from 'react-native';
import CalendarStrip from 'atflee_react-native-calendar-strip';

const CalendarExample = () => {
  const calendarRef = useRef(null);
  
  const onDateSelected = (date) => {
    console.log('Selected date:', date);
  };
  
  return (
    <View style={{ flex: 1 }}>
      <CalendarStrip
        calendarRef={calendarRef}
        selectedDate={new Date()}
        onDateSelected={onDateSelected}
        useIsoWeekday={false}
        numDaysInWeek={7}
        showDayName={true}
        showDayNumber={true}
        calendarColor="#FFFFFF"
        highlightColor="#2196F3"
      />
    </View>
  );
};

export default CalendarExample;
```

### 고급 사용법 (마커 포함)

```jsx
import React, { useRef } from 'react';
import { View } from 'react-native';
import CalendarStrip from 'atflee_react-native-calendar-strip';
import dayjs from 'dayjs';

const CalendarAdvancedExample = () => {
  const calendarRef = useRef(null);
  
  // 이벤트가 있는 날짜 설정
  const markedDates = [
    {
      date: dayjs().toDate(),
      dots: [
        {
          color: '#FF0000',
          count: 2,
        },
      ],
    },
    {
      date: dayjs().add(2, 'day').toDate(),
      dots: [
        {
          color: '#00FF00',
          count: 1,
        },
      ],
    },
  ];
  
  const onDateSelected = (date) => {
    console.log('Selected date:', date);
  };
  
  const onWeekChanged = (startDate, endDate) => {
    console.log('Week changed:', startDate, 'to', endDate);
  };
  
  return (
    <View style={{ flex: 1 }}>
      <CalendarStrip
        calendarRef={calendarRef}
        selectedDate={new Date()}
        onDateSelected={onDateSelected}
        onWeekChanged={onWeekChanged}
        useIsoWeekday={true}
        numDaysInWeek={7}
        showDayName={true}
        showDayNumber={true}
        calendarColor="#FFFFFF"
        highlightColor="#2196F3"
        markedDates={markedDates}
        markedDatesStyle={{ marginBottom: 4 }}
      />
    </View>
  );
};

export default CalendarAdvancedExample;
```

## 성능 최적화 팁

1. `numDaysInWeek`를 필요한 만큼만 설정하세요 (5-14)
2. 필요한 경우에만 `markedDates` 배열을 업데이트하세요
3. 네이티브 모듈을 활용하려면 적절한 환경 설정이 필요합니다
4. 복잡한 커스텀 컴포넌트를 `dayComponent`로 전달할 때는 메모이제이션을 사용하세요
5. 필요 없는 경우 `allowDayTextScaling`을 `false`로 설정하세요

## 문제해결

### 네이티브 모듈 빌드 이슈

Android 네이티브 모듈 빌드 시 발생하는 import 에러는 다음과 같이 해결할 수 있습니다:

1. 프로젝트의 `android/build.gradle` 파일에서 React Native 의존성이 올바르게 설정되어 있는지 확인하세요
2. Android 스튜디오에서 Gradle 싱크를 수행하세요
3. 필요한 경우 `npm install` 또는 `yarn install`을 다시 실행하세요

iOS에서는 다음 단계를 확인하세요:

1. CocoaPods가 최신 버전인지 확인하세요
2. 프로젝트 폴더의 iOS 디렉토리에서 `pod install`을 실행하세요
3. Xcode 프로젝트를 다시 열어 빌드하세요
