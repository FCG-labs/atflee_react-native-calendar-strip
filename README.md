<h1 align="center"> ATFlee React Native Calendar Strip </h1>
<div align="center">
  <strong>고성능 React Native 캘린더 컴포넌트 - 컨트롤러 기반 아키텍처 및 네이티브 모듈 통합</strong>
</div>
<br>

## 개요

ATFlee React Native Calendar Strip은 React Native 애플리케이션을 위한 고성능 캘린더 컴포넌트입니다. 이 라이브러리는 무한 양방향 스크롤, 이벤트 마커, 주별 표시, 그리고 커스텀 스타일링을 지원합니다. 컨트롤러 기반 아키텍처를 사용하여 상태 관리와 UI 렌더링을 분리하고, 네이티브 모듈 통합을 통해 성능을 최적화했습니다.

### 주요 특징

- 컨트롤러 기반 아키텍처 - 상태 관리와 UI 렌더링 분리
- 네이티브 모듈 통합으로 성능 최적화
- 무한 양방향 스크롤 지원
- 날짜 마커 및 이벤트 표시 기능
- 테마 및 다양한 스타일링 옵션
- ISO 표준 요일 지원 (월요일 시작)
- 가변 주 길이 지원 (5-14일)

## 목차

- [설치](#설치)
- [기본 사용법](#기본-사용법)
- [API 참조](#api-참조)
- [성능 최적화](#성능-최적화)
- [네이티브 모듈 통합](#네이티브-모듈-통합)
- [예제 앱](#예제-앱)

## 설치

```bash
npm install atflee_react-native-calendar-strip --save
# or
yarn add atflee_react-native-calendar-strip
```

## 기본 사용법

```jsx
import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import CalendarStrip from 'atflee_react-native-calendar-strip';

const MyCalendarScreen = () => {
  const calendarRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // 날짜 선택 핸들러
  const handleDateSelected = (date) => {
    setSelectedDate(date);
    console.log('선택된 날짜:', date.format('YYYY-MM-DD'));
  };
  
  // 이번 달로 이동
  const goToToday = () => {
    calendarRef.current?.goToDate(new Date());
  };
  
  return (
    <View style={{ flex: 1 }}>
      <CalendarStrip
        ref={calendarRef}
        selectedDate={selectedDate}
        onDateSelected={handleDateSelected}
        startingDate={new Date()} // 초기 표시할 날짜
        useIsoWeekday={false} // true: 월요일 시작, false: 일요일 시작
        showMonth={true} // 상단에 월 표시
        visibleDaysCount={7} // 표시할 날짜 수
        markedDates={[
          { date: '2023-08-15', dots: [{ color: 'red' }] },
          { date: '2023-08-18', dots: [{ color: 'blue' }] },
        ]}
        style={{ height: 100, paddingVertical: 10 }}
      />
      
      <TouchableOpacity onPress={goToToday} style={{ padding: 10 }}>
        <Text>오늘로 이동</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MyCalendarScreen;
```

## API 참조

### CalendarStrip Props

| 속성 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `selectedDate` | `Date` 또는 `Dayjs` | `new Date()` | 현재 선택된 날짜 |
| `onDateSelected` | `function` | - | 날짜 선택 시 호출되는 콜백 함수 |
| `startingDate` | `Date` 또는 `Dayjs` | `new Date()` | 초기 표시할 날짜 |
| `useIsoWeekday` | `boolean` | `false` | ISO 표준 요일 사용 여부 (true: 월요일 시작) |
| `showMonth` | `boolean` | `true` | 상단에 월 표시 여부 |
| `visibleDaysCount` | `number` | `7` | 표시할 날짜 수 (5-14 사이) |
| `markedDates` | `array` | `[]` | 마커로 표시할 날짜 배열 |
| `theme` | `object` | - | 커스텀 테마 설정 |
| `style` | `ViewStyle` | - | 컨테이너 스타일 |
| `headerStyle` | `ViewStyle` | - | 헤더 스타일 |
| `dateNumberStyle` | `TextStyle` | - | 날짜 숫자 스타일 |
| `dateNameStyle` | `TextStyle` | - | 요일명 스타일 |
| `highlightDateNumberStyle` | `TextStyle` | - | 선택된 날짜 숫자 스타일 |
| `highlightDateNameStyle` | `TextStyle` | - | 선택된 요일명 스타일 |
| `disabledDateNumberStyle` | `TextStyle` | - | 비활성화된 날짜 숫자 스타일 |
| `disabledDateNameStyle` | `TextStyle` | - | 비활성화된 요일명 스타일 |
| `scrollable` | `boolean` | `true` | 스크롤 가능 여부 |
| `scrollerPaging` | `boolean` | `true` | 페이징 스크롤 사용 여부 |
| `useNativeDriver` | `boolean` | `true` | 네이티브 드라이버 사용 여부 |

### CalendarController 메서드

| 메서드 | 매개변수 | 반환값 | 설명 |
| --- | --- | --- | --- |
| `goToDate` | `Date` 또는 `Dayjs` | - | 특정 날짜로 이동 |
| `getSelectedDate` | - | `Dayjs` | 현재 선택된 날짜 반환 |
| `getVisibleWeek` | - | `array` | 현재 표시된 날짜 배열 반환 |
| `goToPrevious` | - | - | 이전 주/기간으로 이동 |
| `goToNext` | - | - | 다음 주/기간으로 이동 |

자세한 API 정보는 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) 파일을 참조하세요.

## 성능 최적화

### 컨트롤러 기반 아키텍처

ATFlee React Native Calendar Strip은 컨트롤러 기반 아키텍처를 사용하여 상태 관리와 UI 렌더링을 분리했습니다. 이를 통해 다음과 같은 이점을 얻을 수 있습니다:

- **메모리 효율성**: 필요한 날짜 데이터만 메모리에 유지
- **불필요한 재렌더링 방지**: 변경된 부분만 업데이트
- **외부 제어 용이성**: 컨트롤러를 통한 명확한 API 제공

### 네이티브 성능 최적화

- **가상화된 리스트**: 보이는 항목만 렌더링하여 메모리 사용량 최소화
- **메모이제이션**: React.memo 및 useCallback을 통한 렌더링 최적화
- **네이티브 모듈**: 날짜 계산 및 주간 데이터 생성에 네이티브 코드 활용

## 네이티브 모듈 통합

### 모듈 구조

```
├── android/src/main/java/com/atflee/calendarstrip/
│   ├── ATFCalendarModule.java
│   └── ATFCalendarPackage.java
└── ios/
    ├── ATFCalendarModule.swift
    └── ATFCalendarModuleBridge.m
```

### 네이티브 모듈 기능

- **주간 데이터 생성**: 날짜 범위에 대한 주간 데이터 계산
- **ISO 요일 변환**: 표준 요일 및 ISO 요일 간 변환
- **날짜 연산**: 성능 중요 날짜 계산 처리

네이티브 모듈은 자동으로 통합되며, JavaScript 레벨에서는 `CalendarNativeModule.js`를 통해 접근할 수 있습니다.

## 예제 앱

프로젝트에는 다양한 기능을 보여주는 예제 앱이 포함되어 있습니다:

```
example/
└── App.js  # 데모 앱 진입점
```

예제 앱 실행 방법:

```bash
# 프로젝트 루트 디렉토리에서
cd example
npm install
npm start
```

### 예제 앱 기능

- 테마 전환 (라이트/다크)
- ISO 요일 전환
- 표시 날짜 수 조절
- 네비게이션 컨트롤
- 이벤트 관리 UI
- 성능 메트릭 표시

## 라이선스

MIT

```sh
$ npm install react-native-calendar-strip
# OR
$ yarn add react-native-calendar-strip
```

## Usage

### Scrollable CalendarStrip — New in 2.x

The `scrollable` prop was introduced in 2.0.0 and features a bi-directional infinite scroller.  It recycles days using RecyclerListView, shifting the dates as the ends are reached.  The Chrome debugger can cause issues with this updating due to a [RN setTimeout bug](https://github.com/facebook/react-native/issues/4470). To prevent date shifts at the ends of the scroller, set the `minDate` and `maxDate` range to a year or less.

The refactor to support `scrollable` introduced internal changes to the `CalendarDay` component.  Users of the `dayComponent` prop may need to adjust their custom day component to accommodate the props passed to it.

<div align="center">
  <img src="https://user-images.githubusercontent.com/6295083/82712731-54a98780-9c4e-11ea-9076-eddf0b756239.gif" alt="">
</div>

<details>

```jsx
import { View, StyleSheet } from 'react-native';
import CalendarStrip from 'react-native-calendar-strip';

const Example = () => (
  <View style={styles.container}>
    <CalendarStrip
      scrollable
      style={{height:200, paddingTop: 20, paddingBottom: 10}}
      calendarColor={'#3343CE'}
      calendarHeaderStyle={{color: 'white'}}
      dateNumberStyle={{color: 'white'}}
      dateNameStyle={{color: 'white'}}
      iconContainer={{flex: 0.1}}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 }
});
```

</details>


### Simple "out of the box" Example

You can use this component without any styling or customization. Just import it in your project and render it:
<div align="center">
  <img src="https://user-images.githubusercontent.com/6295083/81627792-9459af00-93c4-11ea-870c-601390912615.gif" alt="">
</div>

<details>

```jsx
import { View, StyleSheet } from 'react-native';
import CalendarStrip from 'react-native-calendar-strip';

const Example = () => (
  <View style={styles.container}>
    <CalendarStrip
      style={{height:150, paddingTop: 20, paddingBottom: 10}}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 }
});
```

</details>

### Styling and animations Example

Even though this component works withouth any customization, it is possible to customize almost everything, so you can make it as beautiful as you want:

<div align="center">
  <img src="https://user-images.githubusercontent.com/6295083/81627795-958adc00-93c4-11ea-9307-878e9f023cfd.gif" alt="">
</div>

<details>

```jsx
import React, {Component} from 'react';
import {
    AppRegistry,
    View
} from 'react-native';
import dayjs from 'dayjs';

import CalendarStrip from 'react-native-calendar-strip';

class Example extends Component {
    let datesWhitelist = [{
      start: dayjs(),
      end: dayjs().add(3, 'days')  // total 4 days enabled
    }];
    let datesBlacklist = [ dayjs().add(1, 'days') ]; // 1 day disabled

    render() {
        return (
            <View>
                <CalendarStrip
                    calendarAnimation={{type: 'sequence', duration: 30}}
                    daySelectionAnimation={{type: 'border', duration: 200, borderWidth: 1, borderHighlightColor: 'white'}}
                    style={{height: 100, paddingTop: 20, paddingBottom: 10}}
                    calendarHeaderStyle={{color: 'white'}}
                    calendarColor={'#7743CE'}
                    dateNumberStyle={{color: 'white'}}
                    dateNameStyle={{color: 'white'}}
                    highlightDateNumberStyle={{color: 'yellow'}}
                    highlightDateNameStyle={{color: 'yellow'}}
                    disabledDateNameStyle={{color: 'grey'}}
                    disabledDateNumberStyle={{color: 'grey'}}
                    datesWhitelist={datesWhitelist}
                    datesBlacklist={datesBlacklist}
                    iconLeft={require('./img/left-arrow.png')}
                    iconRight={require('./img/right-arrow.png')}
                    iconContainer={{flex: 0.1}}
                />
            </View>
        );
    }
}

AppRegistry.registerComponent('Example', () => Example);
```

</details>

## Props

### Initial data and onDateSelected handler

| Prop                 | Description                                                                                                                                                        | Type     | Default    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ---------- |
| **`numDaysInWeek`**  | Number of days shown in week. Applicable only when scrollable is false.                                                                                            | Number   | **`7`**    |
| **`scrollable`**     | Dates are scrollable if true.                                                                                                                                      | Bool     | **`False`**|
| **`scrollerPaging`** | Dates are scrollable as a page (7 days) if true (Only works with `scrollable` set to true).                                                                        | Bool     | **`False`**|
| **`weekBuffer`**     | Number of weeks kept in memory when scrollable. The visible week plus this many weeks before and after will be rendered. Works with custom `numDaysInWeek`. | Number | **`3`** |
| **`startingDate`**   | Date to be used for centering the calendar/showing the week based on that date. It is internally wrapped by `dayjs` so it accepts both `Date` and `dayjs Date`.  | Any      |
| **`selectedDate`**   | Date to be used as pre selected Date. It is internally wrapped by `dayjs` so it accepts both `Date` and `dayjs Date`.                                            | Any      |
| **`onDateSelected`** | Function to be used as a callback when a date is selected. Receives param `date` dayjs date.                                                                      | Function |
| **`onWeekChanged`**  | Function to be used as a callback when a week is changed. Receives params `(start, end)` dayjs dates.                                                             | Function |
| **`onWeekScrollStart`**| Function to be used as a callback in `scrollable` mode when dates page starts gliding. Receives params `(start, end)` dayjs dates.                              | Function |
| **`onWeekScrollEnd`**| Function to be used as a callback in `scrollable` mode when dates page stops gliding. Receives params `(start, end)` dayjs dates.                                 | Function |
| **`onHeaderSelected`**| Function to be used as a callback when the header is selected. Receives param object `{weekStartDate, weekEndDate}` dayjs dates.                                 | Function |
| **`headerText`**     | Text to use in the header. Use with `onWeekChanged` to receive the visible start & end dates.                                                                      | String  |
| **`updateWeek`**     | Update the week view if other props change. If `false`, the week view won't change when other props change, but will still respond to left/right selectors.        | Bool     | **`True`** |
| **`useIsoWeekday`**  | start week on ISO day of week (default true). If false, starts week on _startingDate_ parameter.                                                                   | Bool     | **`True`** |
| **`minDate`**        | minimum date that the calendar may navigate to. A week is allowed if minDate falls within the current week.                                                        | Any      |
| **`maxDate`**        | maximum date that the calendar may navigate to. A week is allowed if maxDate falls within the current week.                                                        | Any      |
| **`datesWhitelist`** | Array of dates that are enabled, or a function callback which receives a date param and returns true if enabled. Array supports ranges specified with an object entry in the array. Check example <a href="#dateswhitelist-array-example">Below</a> | Array or Func |
| **`datesBlacklist`** | Array of dates that are disabled, or a function callback. Same format as _datesWhitelist_. This overrides dates in _datesWhitelist_.                               | Array or Func |
| **`markedDates`**    | Dates that are marked with dots or lines. Format as <a href="#markeddates-example">markedDatesFormat</a>.                                                          | Array or Func | **[]**
| **`scrollToOnSetSelectedDate`** | Controls whether to reposition the scroller to the date passed to `setSelectedDate`.                                                                         | Bool     | **`True`** |


##### datesWhitelist Array Example

```jsx
  datesWhitelist = [
    // single date (today)
    dayjs(),

    // date range
    {
      start: (Date or dayjs Date),
      end: (Date or dayjs Date)
    }
  ];

  return (
    <CalendarStrip
      datesWhitelist={datesWhitelist}
    />
  );
```

##### datesBlacklist Callback Example

```jsx
  const datesBlacklistFunc = date => {
    return date.isoWeekday() === 6; // disable Saturdays
  }

  return (
    <CalendarStrip
      datesBlacklist={datesBlacklistFunc}
    />
  );
```

##### markedDates Example
<div align="center">
  <img src="https://user-images.githubusercontent.com/6295083/83835989-e1752c00-a6b7-11ea-9104-c79a26438c50.png" alt="marked dates example">
</div>

`markedDates` may be an array of dates with dots/lines, or a callback that returns the same shaped object for a date passed to it.

```jsx
  // Marked dates array format
  markedDatesArray = [
    {
      date: '(string, Date or Moment object)',
      dots: [
        {
          color: <string>,
          selectedColor: <string> (optional),
        },
      ],
    },
    {
      date: '(string, Date or Moment object)',
      lines: [
        {
          color: <string>,
          selectedColor: <string> (optional),
        },
      ],
    },
  ];

```

```jsx
  // Marked dates callback
  markedDatesFunc = date => {
    // Dot
    if (date.isoWeekday() === 4) { // Thursdays
      return {
        dots:[{
          color: <string>,
          selectedColor: <string> (optional),
        }]
      };
    }
    // Line
    if (date.isoWeekday() === 6) { // Saturdays
      return {
        lines:[{
          color: <string>,
          selectedColor: <string> (optional),
        }]
      };
    }
    return {};
  }

```

### Hiding Components

| Prop                | Description                       | Type | Default    |
| ------------------- | --------------------------------- | ---- | ---------- |
| **`showMonth`**     | Show or hide the month label.     | Bool | **`True`** |
| **`showDate`**      | Show or hide all the dates.       | Bool | **`True`** |
| **`showDayName`**   | Show or hide the day name label   | Bool | **`True`** |
| **`showDayNumber`** | Show or hide the day number label | Bool | **`True`** |

### Styling

| Prop                           | Description                                                                                                                                                                                                                                                                              | Type   | Default    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ---------- |
| **`style`**                    | Style for the top level CalendarStrip component.                                                                                                 | Any            |
| **`innerStyle`**               | Style for the responsively sized inner view. This is necessary to account for padding/margin from the top level view. The inner view has style `flex:1` by default. If this component is nested within another dynamically sized container, remove the flex style by passing in `[]`. | Any    |
| **`calendarHeaderStyle`**      | Style for the header text of the calendar                                                                                                  | Any            |
| **`calendarHeaderContainerStyle`** | Style for the header text wrapper of the calendar                                                                                      | Any            |
| **`calendarHeaderPosition`**   | Position of the header text (above or below)                                                                                               | `above, below` | **`above`** |
| **`calendarHeaderFormat`**     | Format for the header text of the calendar. For options, refer to [dayjs documentation](https://day.js.org/docs/en/display/format)    | String         |
| **`dateNameStyle`**            | Style for the name of the day on work days in dates strip                                                                                  | Any            |
| **`dateNumberStyle`**          | Style for the number of the day on work days in dates strip.                                                                               | Any            |
| **`dayContainerStyle`**        | Style for all day containers. RNCS scales the width & height responsively, so take that into account if overriding them.                   | Any            |
| **`weekendDateNameStyle`**     | Style for the name of the day on weekend days in dates strip.                                                                              | Any            |
| **`weekendDateNumberStyle`**   | Style for the number of the day on weekend days in dates strip.                                                                            | Any            |
| **`styleWeekend`**             | Whether to style weekend dates separately.                                                                                                 | Bool           | **`True`** |
| **`highlightDateNameStyle`**   | Style for the selected name of the day in dates strip.                                                                                     | Any            |
| **`highlightDateNumberStyle`** | Style for the selected number of the day in dates strip.                                                                                   | Any            |
| **`highlightDateNumberContainerStyle`** | Style for the selected date number container. Similar to `highlightDateNumberStyle`, but this fixes the issue that some styles may have on iOS when using `highlightDateNumberStyle`.        | Any            |
| **`highlightDateContainerStyle`** | Style for the selected date container.            | Object         |
| **`disabledDateNameStyle`**    | Style for disabled name of the day in dates strip (controlled by datesWhitelist & datesBlacklist).                                         | Any            |
| **`disabledDateNumberStyle`**  | Style for disabled number of the day in dates strip (controlled by datesWhitelist & datesBlacklist).                                       | Any            |
| **`markedDatesStyle`**         | Style for the marked dates marker.                                                                                                         | Object         |
| **`disabledDateOpacity`**      | Opacity of disabled dates strip.                                                                                                           | Number         | **`0.3`**  |
| **`customDatesStyles`**        | Custom per-date styling, overriding the styles above. Check Table <a href="#customdatesstyles"> Below </a>     .                           | Array or Func  | [] |
| **`shouldAllowFontScaling`**   | Override the underlying Text element scaling to respect font settings                                                                      | Bool           | **`True`**|
| **`upperCaseDays`**   | Format text of the days to upper case or title case | Bool | **`True`**|

#### customDatesStyles

<div align="center">
  <img src="https://cloud.githubusercontent.com/assets/6295083/25105759/a3335fc8-238b-11e7-9a92-3174498a0d89.png" alt="Custom date styling example">
</div>

This prop may be passed an array of style objects or a callback which receives a date param and returns a style object for it.  The format for the style object follows:

| Key                      | Description                                                                        | Type | optional    |
| ------------------------ | ---------------------------------------------------------------------------------- | ---- | ----------- |
| **`startDate`**          | anything parseable by Moment.                                                      | Any  | **`False`** (unused w/ callback)|
| **`endDate`**            | specify a range. If no endDate is supplied, startDate is treated as a single date. | Any  | **`True`** (unused w/ callback) |
| **`dateNameStyle`**      | Text style for the name of the day.                                                | Any  | **`True`**  |
| **`dateNumberStyle`**    | Text style for the number of the day.                                              | Any  | **`True`**  |
| **`highlightDateNameStyle`**   | Text style for the selected name of the day. This overrides the global prop.   | Any  | **`True`**  |
| **`highlightDateNumberStyle`** | Text style for the selected number of the day. This overrides the global prop. | Any  | **`True`**  |
| **`dateContainerStyle`** | Style for the date Container.                                                      | Any  | **`True`**  |

##### Array Usage Example:

<details>

```jsx
  let customDatesStyles = [];
  let startDate = dayjs();
  for (let i=0; i<6; i++) {
    customDatesStyles.push({
        startDate: startDate.clone().add(i, 'days'), // Single date since no endDate provided
        dateNameStyle: styles.dateNameStyle,
        dateNumberStyle: styles.dateNumberStyle,
        // Random color...
        dateContainerStyle: { backgroundColor: `#${(`#00000${(Math.random() * (1 << 24) | 0).toString(16)}`).slice(-6)}` },
      });
  }

  render() {
    return (
      <CalendarStrip
        customDatesStyles={customDatesStyles}
        ...
      />
    );
  }
```
</details>

##### Callback Usage Example:

<details>

```jsx
  const customDatesStylesFunc = date => {
    if (date.isoWeekday() === 5) { // Fridays
      return {
        dateNameStyle: {color: 'blue'},
        dateNumberStyle: {color: 'purple'},
        dateContainerStyle:  {color: 'yellow'},
      }
    }
  }

  render() {
    return (
      <CalendarStrip
        customDatesStyles={customDatesStylesFunc}
        ...
      />
    );
  }
```
</details>


#### Responsive Sizing

| Prop                         | Description                                                                                                                                          | Type   | Default  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------- |
| **`maxDayComponentSize`**    | Maximum size that CalendarDay will responsively size up to.                                                                                          | Number | **`80`** |
| **`minDayComponentSize`**    | Minimum size that CalendarDay will responsively size down to.                                                                                        | Number | **`10`** |
| **`responsiveSizingOffset`** | Adjust the responsive sizing. May be positive (increase size) or negative (decrease size). This value is added to the calculated day component width | Number | **`0`**  |
| **`dayComponentHeight`**     | Fixed height for the CalendarDay component or custom `dayComponent`.                                                                                 | Number |          |

#### Icon Sizing

| Prop                 | Description                                                                                                                                                                             | Type | Default |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------- |
| **`iconLeft`**       | Icon to be used for the left icon. It accepts require statement with url to the image (`require('./img/icon.png')`), or object with remote uri `{uri: 'http://example.com/image.png'}`  | Any  |
| **`iconRight`**      | Icon to be used for the right icon. It accepts require statement with url to the image (`require('./img/icon.png')`), or object with remote uri `{uri: 'http://example.com/image.png'}` | Any  |
| **`iconStyle`**      | Style that is applied to both left and right icons. It is applied before _iconLeftStyle_ or _iconRightStyle_.                                                                           | Any  |
| **`iconLeftStyle`**  | Style for left icon. It will override all of the other styles applied to icons.                                                                                                         | Any  |
| **`iconRightStyle`** | Style for right icon. It will override all of the other styles applied to icons.                                                                                                        | Any  |
| **`iconContainer`**  | Style for the container of icons. (Example usage is to add `flex` property to it so in the portrait mode, it will shrink the dates strip)                                               | Any  |
| **`leftSelector`**   | Component for the left selector control. May be an instance of any React component. This overrides the icon\* props above. Passing in an empty array `[]` hides this control.           | Any  |
| **`rightSelector`**  | Component for the right selector control. May be an instance of any React component. This overrides the icon\* props above. Passing in an empty array `[]` hides this control.          | Any  |

#### Custom Day component

| Prop                 | Description                                                                                                                                                                             | Type | Default |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------- |
| **`dayComponent`**       | User-defined component for the Days. All day-related props are passed to the custom component: https://github.com/BugiDev/react-native-calendar-strip/blob/master/src/CalendarStrip.js#L542 | Any  |

### Methods

Methods may be accessed through the instantiated component's [ref](https://reactjs.org/docs/react-component.html).

| Prop                                  | Description                                                                                                                                                                                                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| **`getSelectedDate()`**               | Returns the currently selected date. If no date is selected, returns undefined.   |
| **`setSelectedDate(date)`**           | Sets the selected date. `date` may be a Moment object, ISO8601 date string, or any format that Moment is able to parse. It is the responsibility of the caller to select a date that makes sense (e.g. within the current week view). Passing in a value of `0` effectively clears the selected date. `scrollToOnSetSelectedDate` controls whether the scroller repositions to the selected date. |
| **`getNextWeek()`**                   | Advance to the next week.                                                         |
| **`getPreviousWeek()`**               | Rewind to the previous week.                                                      |
| **`updateWeekView(date)`**            | Show the week starting on `date`.                                                 |


## Animations

### Week Strip Animation

| Sequence example (dates shown one by one)                                                                                                                                  | Parallel example (dates shown all at once)                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![alt text](https://user-images.githubusercontent.com/6295083/81627798-96237280-93c4-11ea-998f-53f7ee07caba.gif "react-native-calendar-strip parallel animation demo") | ![alt text](https://user-images.githubusercontent.com/6295083/81627797-96237280-93c4-11ea-874d-1f23fe6ba487.gif "react-native-calendar-strip parallel animation demo") |

#### Week Strip Animation Options

The `calendarAnimation` prop accepts an object in the following format:

| Props          | Description                                         | Types                    |
| -------------- | --------------------------------------------------- | ------------------------ |
| **`Type`**     | Pick which type of animation you would like to show | `sequence` or `parallel` |
| **`duration`** | duration of animation in milliseconds               | Number (ms)              |
| **`useNativeDriver`** | Use Animated's native driver (default true)  | Bool                     |

### Day Selection Animation

| Border example                                                                                                                                                              | Background example                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![alt text](https://user-images.githubusercontent.com/6295083/81627793-94f24580-93c4-11ea-9726-89a56b2c4d49.gif "react-native-calendar-strip border animation demo") | ![alt text](https://user-images.githubusercontent.com/6295083/81627791-93c11880-93c4-11ea-8a1b-e5fb5848d2a7.gif "react-native-calendar-strip simple demo") |

#### Day Selection Animation Options

The `daySelectionAnimation` prop accepts an object in the following format:

| Props                      | Description                                                                                                            | Type                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| **`Type`**                 | Pick which type of animation you would like to show                                                                    | `border` or `background` |
| **`duration`**             | duration of animation in milliseconds                                                                                  | Number (ms)              |
| **`borderWidth`**          | Selected day's border width. _Required if the type is set to border_.                                                  | Number                   |
| **`borderHighlightColor`** | Selected day's border color. _Required if the type is set to border_.                                                  | String                   |
| **`highlightColor`**       | Highlighted color of selected date. _Required if the type is set to background_.                                       | String                   |
| **`animType`**             | optional config options passed to [LayoutAnimation](https://facebook.github.io/react-native/docs/layoutanimation.html) | any                      |
| **`animUpdateType`**       | optional config options passed to [LayoutAnimation](https://facebook.github.io/react-native/docs/layoutanimation.html) | any                      |
| **`animProperty`**         | optional config options passed to [LayoutAnimation](https://facebook.github.io/react-native/docs/layoutanimation.html) | any                      |
| **`animSpringDamping`**    | optional config options passed to [LayoutAnimation](https://facebook.github.io/react-native/docs/layoutanimation.html) | any                      |

## Localization

| Props        | Description      | Type   |
| ------------ | ---------------- | ------ |
| **`locale`** | Locale for dates | Object |

This prop is used for adding localization to react-native-calendar-strip component. The localization rules follow dayjs and can be found in [dayjs documentation](https://day.js.org/docs/en/i18n/i18n)

| `locale` Props | Description                                                 | Type   |
| -------------- | ----------------------------------------------------------- | ------ |
| **`name`**     | The name of the locale (ex. 'fr')                           | String |
| **`config`**   | The config object holding all of the localization strings.. | Object |

#### Build Release info

To properly make a release build, import the appropriate "Locale" module using the following steps.  Not importing the locale module will crash the release build (though the dev build will work).

1- install dayjs with locales:
> $ yarn add dayjs

or

> $ npm install dayjs

2- Go to your index.js and import the specific locale before using CalendarStrip. Ex:
```
import dayjs from 'dayjs';
import 'dayjs/locale/fr';  // language must match config
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);  // only if timezone is needed
// CalendarStrip attempts to load the locale automatically, but bundlers
// may require the locale file to be imported explicitly as above.
```

The locale import must match the language specified in the locale config (example below).

#### Example of one locale object is:

<details>

```jsx
const locale = {
  name: 'fr',
  config: {
    months: 'Janvier_Février_Mars_Avril_Mai_Juin_Juillet_Août_Septembre_Octobre_Novembre_Décembre'.split(
      '_'
    ),
    monthsShort: 'Janv_Févr_Mars_Avr_Mai_Juin_Juil_Août_Sept_Oct_Nov_Déc'.split(
      '_'
    ),
    weekdays: 'Dimanche_Lundi_Mardi_Mercredi_Jeudi_Vendredi_Samedi'.split('_'),
    weekdaysShort: 'Dim_Lun_Mar_Mer_Jeu_Ven_Sam'.split('_'),
    weekdaysMin: 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
    longDateFormat: {
      LT: 'HH:mm',
      LTS: 'HH:mm:ss',
      L: 'DD/MM/YYYY',
      LL: 'D MMMM YYYY',
      LLL: 'D MMMM YYYY LT',
      LLLL: 'dddd D MMMM YYYY LT'
    },
    calendar: {
      sameDay: "[Aujourd'hui à] LT",
      nextDay: '[Demain à] LT',
      nextWeek: 'dddd [à] LT',
      lastDay: '[Hier à] LT',
      lastWeek: 'dddd [dernier à] LT',
      sameElse: 'L'
    },
    relativeTime: {
      future: 'dans %s',
      past: 'il y a %s',
      s: 'quelques secondes',
      m: 'une minute',
      mm: '%d minutes',
      h: 'une heure',
      hh: '%d heures',
      d: 'un jour',
      dd: '%d jours',
      M: 'un mois',
      MM: '%d mois',
      y: 'une année',
      yy: '%d années'
    },
    ordinalParse: /\d{1,2}(er|ème)/,
    ordinal: function(number) {
      return number + (number === 1 ? 'er' : 'ème');
    },
    meridiemParse: /PD|MD/,
    isPM: function(input) {
      return input.charAt(0) === 'M';
    },
    // in case the meridiem units are not separated around 12, then implement
    // this function (look at locale/id.js for an example)
    // meridiemHour : function (hour, meridiem) {
    //     return /* 0-23 hour, given meridiem token and hour 1-12 */
    // },
    meridiem: function(hours, minutes, isLower) {
      return hours < 12 ? 'PD' : 'MD';
    },
    week: {
      dow: 1, // Monday is the first day of the week.
      doy: 4 // The week that contains Jan 4th is the first week of the year.
    }
  }
};
```

</details>
</br>

## Device Specific Notes

<ul>
<li>OnePlus devices use OnePlus Slate font by default which causes text being cut off in the date number in react-native-calendar-strip. To overcome this change the default font of the device or use a specific font throughout your app.</li>
</ul>

## Development with Sample Application

To facilitate development, the `example` directory has a sample app.

```sh
cd example
npm run cp
npm install
npm start
```

The CalendarStrip source files are copied from the project root directory into `example/CalendarStrip` using `npm run cp`.  If a source file is modified, it must be copied over again with `npm run cp`.

## Contributing

Contributions are welcome!

1. Fork it.
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

Or open up [an issue](https://github.com/BugiDev/react-native-calendar-strip/issues).


## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->

| [<img src="https://avatars0.githubusercontent.com/u/4005545?v=4" width="100px;"/><br /><sub><b>Bogdan Begovic</b></sub>](https://github.com/BugiDev)<br />[💬](#question-BugiDev "Answering Questions") [💻](https://github.com/bugidev/react-native-calendar-strip/commits?author=BugiDev "Code") [🎨](#design-BugiDev "Design") [📖](https://github.com/bugidev/react-native-calendar-strip/commits?author=BugiDev "Documentation") [💡](#example-BugiDev "Examples") [🔧](#tool-BugiDev "Tools") | [<img src="https://avatars3.githubusercontent.com/u/6295083?v=4" width="100px;"/><br /><sub><b>Peace</b></sub>](https://github.com/peacechen)<br />[💬](#question-peacechen "Answering Questions") [🐛](https://github.com/bugidev/react-native-calendar-strip/issues?q=author%3Apeacechen "Bug reports") [💻](https://github.com/bugidev/react-native-calendar-strip/commits?author=peacechen "Code") [📖](https://github.com/bugidev/react-native-calendar-strip/commits?author=peacechen "Documentation") [👀](#review-peacechen "Reviewed Pull Requests") | [<img src="https://avatars1.githubusercontent.com/u/15834048?v=4" width="100px;"/><br /><sub><b>Chris Burns</b></sub>](http://www.usebillo.com)<br />[💬](#question-Burnsy "Answering Questions") [🐛](https://github.com/bugidev/react-native-calendar-strip/issues?q=author%3ABurnsy "Bug reports") [💻](https://github.com/bugidev/react-native-calendar-strip/commits?author=Burnsy "Code") [📖](https://github.com/bugidev/react-native-calendar-strip/commits?author=Burnsy "Documentation") [🔧](#tool-Burnsy "Tools") [💡](#example-Burnsy "Examples") [👀](#review-Burnsy "Reviewed Pull Requests") | [<img src="https://avatars0.githubusercontent.com/u/26348965?v=4" width="100px;"/><br /><sub><b>samcolby</b></sub>](https://github.com/samcolby)<br />[💻](https://github.com/bugidev/react-native-calendar-strip/commits?author=samcolby "Code") [⚠️](https://github.com/bugidev/react-native-calendar-strip/commits?author=samcolby "Tests") | [<img src="https://avatars0.githubusercontent.com/u/239360?v=4" width="100px;"/><br /><sub><b>Florian Biebel</b></sub>](https://chromosom23.de)<br />[💻](https://github.com/bugidev/react-native-calendar-strip/commits?author=1ne8ight7even "Code") | [<img src="https://avatars0.githubusercontent.com/u/986135?v=4" width="100px;"/><br /><sub><b>Vitaliy Zhukov</b></sub>](http://intspirit.com/)<br />[💻](https://github.com/bugidev/react-native-calendar-strip/commits?author=Vitall "Code") | [<img src="https://avatars1.githubusercontent.com/u/15323137?v=4" width="100px;"/><br /><sub><b>lbrdar</b></sub>](https://github.com/lbrdar)<br />[💻](https://github.com/bugidev/react-native-calendar-strip/commits?author=lbrdar "Code") |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| [<img src="https://avatars0.githubusercontent.com/u/6774813?v=4" width="100px;"/><br /><sub><b>Dimka Vasilyev</b></sub>](https://github.com/gHashTag)<br />[💻](https://github.com/bugidev/react-native-calendar-strip/commits?author=gHashTag "Code") | [<img src="https://avatars2.githubusercontent.com/u/6241354?v=4" width="100px;"/><br /><sub><b>Eugene</b></sub>](https://github.com/hellpirat)<br />[💻](https://github.com/bugidev/react-native-calendar-strip/commits?author=hellpirat "Code") |
<!-- ALL-CONTRIBUTORS-LIST:END -->
Thanks goes to these wonderful people ([emoji key](https://github.com/kentcdodds/all-contributors#emoji-key)):

## Discussion and Collaboration

In addition to the [Github Issues](https://github.com/BugiDev/react-native-calendar-strip/issues) page, there is a [Discord group](https://discord.gg/RvFM97v) for React Native with a channel specifically for [react-native-calendar-strip](https://discordapp.com/channels/413352084981678082/413360340579909633).  Thanks @MichelDiz for setting that up.

## License

Licensed under the MIT License.
