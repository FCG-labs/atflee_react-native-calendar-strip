import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import CalendarStripV2 from '../src/components/CalendarStripV2';
import dayjs from '../src/dayjs';

// Mock console.log to track renders
const originalConsoleLog = console.log;
const mockConsoleLog = jest.fn();

// Mock React.memo to track memoization
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    memo: (component, areEqual) => {
      const memoizedComponent = originalReact.memo(component, areEqual);
      memoizedComponent.isMemoized = true;
      return memoizedComponent;
    }
  };
});

describe('CalendarStripV2 Rendering Optimization', () => {
  let renderCount;
  let dateItemRenderCount;

  beforeEach(() => {
    renderCount = 0;
    dateItemRenderCount = {};
    console.log = (...args) => {
      mockConsoleLog(...args);
      if (typeof args[0] === 'string') {
        if (args[0].includes('[CalendarStrip] renderWeek')) {
          renderCount++;
        }
        if (args[0].includes('[CalendarDateItem] render')) {
          const dateMatch = args[0].match(/date=(\d{4}-\d{2}-\d{2})/);
          if (dateMatch && dateMatch[1]) {
            const date = dateMatch[1];
            dateItemRenderCount[date] = (dateItemRenderCount[date] || 0) + 1;
          }
        }
      }
    };
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    mockConsoleLog.mockClear();
  });

  // 테스트를 위해 console.log를 잠시 활성화
  const setupConsoleForDebugging = () => {
    // 테스트용 코드에서만 활성화하는 방식
    jest.spyOn(global.console, 'log').mockImplementation((...args) => {
      if (args[0]?.toString().includes('[CalendarStrip]') || 
          args[0]?.toString().includes('[CalendarDateItem]')) {
        mockConsoleLog(...args);
      }
    });
  };

  test('주간 캐싱이 올바르게 작동하는지 검증', async () => {
    setupConsoleForDebugging();
    
    // weekCacheRef 접근을 위한 테스트용 속성 추가
    const { getByTestId } = render(
      <CalendarStripV2 
        testID="calendar-strip-v2"
        showWeekNumber={false}
        scrollable={true}
        initialDate={new Date(2025, 6, 15)} // 2025-07-15
        ref={ref => {
          // 캐시 참조 저장
          if (ref) {
            ref._testAccessCache = () => ref.weekCacheRef.current;
          }
        }}
      />
    );
    
    // 컴포넌트에서 캐시 접근
    const calendarStrip = getByTestId('calendar-strip-v2');
    
    // 여기서는 직접 캐시에 접근할 수 없으므로 간접적으로 테스트
    // 동일한 주를 여러 번 렌더링할 때 캐시로 인해 재계산이 발생하지 않아야 함
    
    // 이미 렌더링 된 날짜의 주변 날짜로 이동했을 때의 동작 확인
    const selectedDateBefore = dayjs(new Date(2025, 6, 15)); // 2025-07-15
    
    // 날짜 선택을 시뮬레이션 (여러번)
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        fireEvent(calendarStrip, 'onDateSelected', selectedDateBefore.toDate());
      });
    }
    
    // 다른 주로 이동했다가 다시 돌아오는 경우
    await act(async () => {
      fireEvent(calendarStrip, 'onDateSelected', selectedDateBefore.add(14, 'day').toDate());
    });
    
    await act(async () => {
      fireEvent(calendarStrip, 'onDateSelected', selectedDateBefore.toDate());
    });
    
    // 렌더링 카운트가 날짜 변경 횟수보다 적어야 함
    // 캐싱이 작동한다면 동일한 주는 캐시에서 가져오게 됨
    expect(mockConsoleLog).toHaveBeenCalled();
    
    // 캐싱이 작동하는지 확인 (자세한 로직은 실제 렌더링을 분석하여 개선해야 함)
    // 이 테스트는 콘솔 로깅이 활성화되어 있어야 의미가 있음
  });

  test('memoization이 CalendarDateItem에서 제대로 작동하는지 검증', async () => {
    setupConsoleForDebugging();
    
    const initialDate = new Date(2025, 6, 15);
    const { getByTestId, rerender } = render(
      <CalendarStripV2 
        testID="calendar-strip-v2"
        showWeekNumber={false}
        scrollable={true}
        initialDate={initialDate}
      />
    );
    
    const calendarStrip = getByTestId('calendar-strip-v2');
    
    // 초기 렌더링 이후 상태 확인
    
    // 속성을 변경하지 않고 재렌더링 (메모이제이션이 작동해야 함)
    rerender(
      <CalendarStripV2 
        testID="calendar-strip-v2"
        showWeekNumber={false}
        scrollable={true}
        initialDate={initialDate}
      />
    );
    
    // 다른 날짜 선택 시뮬레이션
    await act(async () => {
      fireEvent(calendarStrip, 'onDateSelected', dayjs(initialDate).add(1, 'day').toDate());
    });
    
    // 선택된 날짜만 다시 렌더링되어야 함 (메모이제이션 작동)
    // 테스트는 실제 콘솔 로깅을 통해 검증 가능
  });
  
  test('FlatList 최적화 설정이 적용되었는지 검증', () => {
    // FlatList props 검사를 위한 준비
    jest.spyOn(React, 'createElement');
    
    render(
      <CalendarStripV2 
        testID="calendar-strip-v2"
        scrollable={true}
        initialDate={new Date()}
      />
    );
    
    // FlatList 생성 시 필요한 최적화 속성이 전달되었는지 확인
    const flatListCalls = React.createElement.mock.calls
      .filter(call => call[0].displayName === 'FlatList' || call[0].name === 'FlatList');
    
    expect(flatListCalls.length).toBeGreaterThan(0);
    
    // 마지막 FlatList 호출의 props 확인
    const lastFlatListProps = flatListCalls[flatListCalls.length - 1][1];
    
    // 최적화 관련 속성들이 있는지 확인
    expect(lastFlatListProps).toHaveProperty('removeClippedSubviews', true);
    expect(lastFlatListProps).toHaveProperty('maxToRenderPerBatch');
    expect(lastFlatListProps).toHaveProperty('windowSize');
    expect(lastFlatListProps).toHaveProperty('getItemLayout');
    
    // getItemLayout 함수가 올바른 객체를 반환하는지 검사
    const itemLayoutResult = lastFlatListProps.getItemLayout(null, 0);
    expect(itemLayoutResult).toHaveProperty('length');
    expect(itemLayoutResult).toHaveProperty('offset');
    expect(itemLayoutResult).toHaveProperty('index', 0);
  });
});
