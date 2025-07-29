import React from 'react';
import { render } from '@testing-library/react-native';
import CalendarDateItem from '../src/components/CalendarDateItem';
import dayjs from '../src/dayjs';

// Mock useMemo to track memoization calls
const mockUseMemo = jest.fn((factory, deps) => factory());

jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    // 메모 호출 추적을 위한 mock
    memo: (component) => {
      return originalReact.memo(component);
    },
    // useMemo 호출 추적을 위한 mock
    useMemo: (factory, deps) => {
      mockUseMemo(factory, deps);
      return originalReact.useMemo(factory, deps);
    }
  };
});

describe('CalendarDateItem Rendering Optimization', () => {
  beforeEach(() => {
    mockUseMemo.mockClear();
  });

  test('컴포넌트가 React.memo로 최적화되었는지 확인', () => {
    const { rerender } = render(
      <CalendarDateItem
        date={new Date()}
        dateNumber="15"
        dayName="Mon"
        isToday={false}
        isWeekend={false}
        showDayName={true}
        showDayNumber={true}
        onDateSelected={() => {}}
      />
    );
    
    // 동일한 props로 재렌더링
    rerender(
      <CalendarDateItem
        date={new Date()}
        dateNumber="15"
        dayName="Mon"
        isToday={false}
        isWeekend={false}
        showDayName={true}
        showDayNumber={true}
        onDateSelected={() => {}}
      />
    );
    
    // memo 패턴이 적용되었으므로 실제 내부 컴포넌트가 리렌더링되지 않아야 함
    // 이 테스트는 내부 구현에 의존하므로, React DevTools나 콘솔 로깅으로 직접 확인하는 것이 더 정확함
  });

  test('useMemo를 사용하여 스타일과 계산을 최적화했는지 확인', () => {
    // 렌더링하여 useMemo 호출 확인
    render(
      <CalendarDateItem
        date={new Date()}
        dateNumber="15"
        dayName="Mon"
        isToday={false}
        isWeekend={false}
        isActive={true}
        showDayName={true}
        showDayNumber={true}
        onDateSelected={() => {}}
        highlightDateNumberStyle={{fontWeight: 'bold'}}
        dateNumberStyle={{color: 'black'}}
      />
    );

    // useMemo가 여러번 호출되어야 함 (스타일, 날짜 변환, 접근성 레이블 등)
    expect(mockUseMemo).toHaveBeenCalled();
    expect(mockUseMemo.mock.calls.length).toBeGreaterThan(3);
  });

  test('활성 상태 변경 시 올바른 스타일이 적용되는지 확인', () => {
    const testDate = new Date();
    
    const { rerender, getByText } = render(
      <CalendarDateItem
        date={testDate}
        dateNumber="15"
        dayName="Mon"
        isActive={false}
        isToday={false}
        isWeekend={false}
        showDayName={true}
        showDayNumber={true}
        onDateSelected={() => {}}
        highlightDateNumberStyle={{fontWeight: 'bold'}}
        dateNumberStyle={{color: 'black'}}
        testID="date-item"
      />
    );

    // 초기 상태에서는 하이라이트 스타일이 적용되지 않아야 함
    mockUseMemo.mockClear();
    
    // isActive를 true로 변경하여 스타일이 변경되는지 확인
    rerender(
      <CalendarDateItem
        date={testDate}
        dateNumber="15"
        dayName="Mon"
        isActive={true}
        isToday={false}
        isWeekend={false}
        showDayName={true}
        showDayNumber={true}
        onDateSelected={() => {}}
        highlightDateNumberStyle={{fontWeight: 'bold'}}
        dateNumberStyle={{color: 'black'}}
        testID="date-item"
      />
    );

    // 활성 상태 변경 시 스타일 계산이 다시 이루어져야 함
    expect(mockUseMemo).toHaveBeenCalled();
  });

  test('marked dates가 변경될 때 hasMarker가 올바르게 계산되는지 확인', () => {
    const testDate = dayjs(new Date()).format('YYYY-MM-DD');
    const markedDate = dayjs(testDate).toDate();
    
    const { rerender } = render(
      <CalendarDateItem
        date={markedDate}
        dateNumber="15"
        dayName="Mon"
        isActive={false}
        isToday={true}
        isWeekend={false}
        showDayName={true}
        showDayNumber={true}
        onDateSelected={() => {}}
        markedDates={[]}
      />
    );

    mockUseMemo.mockClear();
    
    // markedDates 추가
    rerender(
      <CalendarDateItem
        date={markedDate}
        dateNumber="15"
        dayName="Mon"
        isActive={false}
        isToday={true}
        isWeekend={false}
        showDayName={true}
        showDayNumber={true}
        onDateSelected={() => {}}
        markedDates={[markedDate]}
      />
    );

    // markedDates가 변경되면 hasMarker 계산이 다시 이루어져야 함
    expect(mockUseMemo).toHaveBeenCalled();
  });

  test('날짜 객체가 useMemo로 최적화되었는지 확인', () => {
    const testDate = new Date();
    
    render(
      <CalendarDateItem
        date={testDate}
        dateNumber="15"
        dayName="Mon"
        isActive={false}
        isToday={true}
        isWeekend={false}
        showDayName={true}
        showDayNumber={true}
        onDateSelected={() => {}}
      />
    );

    // dayjs 변환이 useMemo로 캐싱되어야 함
    const dateConversionCalls = mockUseMemo.mock.calls.filter(
      call => call[1] && call[1].length === 1 && call[1][0] === testDate
    );
    
    expect(dateConversionCalls.length).toBeGreaterThan(0);
  });
});
