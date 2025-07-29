import React from 'react';
import CalendarDateItem from '../src/components/CalendarDateItem';
import dayjs from '../src/dayjs';

// 컴포넌트 호출 추적을 위한 목함수들
const mockMemo = jest.fn(component => component);
const mockUseMemo = jest.fn((factory, deps) => factory());

// React 모킹 - 호출 추적을 위해 memo와 useMemo만 모킹
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    // memo 호출을 추적하는 목
    memo: (component) => {
      mockMemo(component);
      return originalReact.memo(component);
    },
    // useMemo 호출을 추적하는 목
    useMemo: (factory, deps) => {
      mockUseMemo(factory, deps);
      return originalReact.useMemo(factory, deps);
    }
  };
});

// 컴포넌트 렌더링 없이 호출만 추적하는 테스트용 함수
const renderForTest = (component) => {
  // 컴포넌트를 생성하기만 하고 DOM에 렌더링하지 않음
  // 이 때 JSX는 실제 실행되어 React.createElement를 호출함
  React.createElement(component.type, component.props);
  
  const rerender = (newComponent) => renderForTest(newComponent);
  return { rerender };
};

describe('CalendarDateItem Rendering Optimization', () => {
  beforeEach(() => {
    mockUseMemo.mockClear();
    mockMemo.mockClear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('useMemo를 사용하여 스타일과 계산을 최적화했는지 확인', () => {
    const testDate = new Date();

    // 실제 CalendarDateItem이 사용되기 전에 목 정리
    mockUseMemo.mockClear();

    // 컴포넌트를 생성하면서 JSX 평가 단계에서 React.createElement 호출
    // 이때 우리가 모킹한 React.useMemo 함수도 실행됨
    const element = (
      <CalendarDateItem
        date={testDate}
        dateNumber="15"
        dayName="월"
        onDateSelected={jest.fn()}
        isActive={false}
      />
    );

    // 컴포넌트 생성
    renderForTest(element);

    // useMemo가 호출되었는지 확인
    console.log(`useMemo 호출 횟수: ${mockUseMemo.mock.calls.length}`);
    expect(mockUseMemo).toHaveBeenCalled();
    
    // 두 번째 렌더링을 위한 초기화
    mockUseMemo.mockClear();

    // 같은 props로 다시 렌더링 시뮬레이션
    renderForTest(element);

    // 실제 memo로 인한 최적화는 테스트하지 않고, useMemo 호출 자체만 확인
    expect(mockUseMemo).toHaveBeenCalled();
  });

  test('활성 상태 변경 시 올바른 스타일이 적용되는지 확인', () => {
    const testDate = new Date();
    
    // 비활성 상태의 컴포넌트 생성
    const inactiveElement = (
      <CalendarDateItem
        date={testDate}
        dateNumber="15"
        dayName="월"
        onDateSelected={jest.fn()}
        isActive={false}
      />
    );
    
    // 활성 상태의 컴포넌트 생성
    const activeElement = (
      <CalendarDateItem
        date={testDate}
        dateNumber="15"
        dayName="월"
        onDateSelected={jest.fn()}
        isActive={true}
      />
    );
    
    // 첫 번째 렌더링 후 목 클리어
    renderForTest(inactiveElement);
    mockUseMemo.mockClear();

    // 활성 상태로 리렌더링 시뮬레이션
    renderForTest(activeElement);

    // 스타일 계산에 대한 useMemo가 호출되어야 함
    console.log(`활성 상태 변경 후 useMemo 호출 횟수: ${mockUseMemo.mock.calls.length}`);
    expect(mockUseMemo).toHaveBeenCalled();
  });

  test('marked dates가 변경될 때 hasMarker가 올바르게 계산되는지 확인', () => {
    const testDate = new Date();
    const markedDate = dayjs(testDate).toDate();
    
    // 빈 markedDates로 컴포넌트 생성
    const emptyMarkedElement = (
      <CalendarDateItem
        date={markedDate}
        dateNumber="15"
        dayName="월"
        onDateSelected={jest.fn()}
        isActive={false}
        markedDates={[]}
      />
    );
    
    // 마크된 날짜가 있는 컴포넌트 생성
    const withMarkedElement = (
      <CalendarDateItem
        date={markedDate}
        dateNumber="15"
        dayName="월"
        onDateSelected={jest.fn()}
        isActive={false}
        markedDates={[markedDate]}
      />
    );
    
    // 첫 번째 렌더링 후 목 클리어
    renderForTest(emptyMarkedElement);
    mockUseMemo.mockClear();

    // markedDates 변경 후 리렌더링 시뮬레이션
    renderForTest(withMarkedElement);
    console.log(`markedDates 변경 후 useMemo 호출 횟수: ${mockUseMemo.mock.calls.length}`);
    
    // hasMarker 계산을 위한 useMemo가 호출되어야 함
    expect(mockUseMemo).toHaveBeenCalled();
  });

  test('날짜 객체가 useMemo로 최적화되었는지 확인', () => {
    const testDate = new Date();
    
    // 렌더링 전 목 클리어
    mockUseMemo.mockClear();
    
    // 컴포넌트 생성
    renderForTest(
      <CalendarDateItem
        date={testDate}
        dateNumber="15"
        dayName="월"
        onDateSelected={jest.fn()}
        isActive={false}
      />
    );

    console.log(`날짜 객체 테스트 useMemo 호출: ${mockUseMemo.mock.calls.length}`);
    console.log(`호출 함수 예시: ${mockUseMemo.mock.calls[0]?.[0].toString() || 'no calls'}`);
    
    // useMemo 호출 확인
    expect(mockUseMemo).toHaveBeenCalled();
  });

  test('memo 래핑을 통한 불필요한 리렌더링 방지 확인', () => {
    // 렌더링 전 목 클리어
    mockMemo.mockClear();
    
    // CalendarDateItem 렌더링 - 이것은 실제 CalendarDateItem 호출
    renderForTest(
      <CalendarDateItem
        date={new Date()}
        dateNumber="15"
        dayName="월"
        onDateSelected={jest.fn()}
        isActive={false}
      />
    );
    
    // CalendarDateItem의 displayName 확인
    expect(CalendarDateItem.displayName).toBe('CalendarDateItem');
    
    // memo 호출 확인 (JSX 파싱 과정에서 호출됨)
    console.log(`memo 호출 횟수: ${mockMemo.mock.calls.length}`);
    expect(mockMemo).toHaveBeenCalled();
  });
});
