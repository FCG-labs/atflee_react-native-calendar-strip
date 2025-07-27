import React from 'react';
import { render } from '@testing-library/react-native';
import { FlatList } from 'react-native';
import dayjs from 'dayjs';
import CalendarStrip from '../src/components/CalendarStrip';
import CalendarController from '../src/controllers/CalendarController';

// 모의 이벤트 핸들러
const mockOnDateSelected = jest.fn();
const mockOnWeekChanged = jest.fn();
const mockOnRenderComplete = jest.fn();

// 기본 Props
const getBaseProps = () => ({
  onDateSelected: mockOnDateSelected,
  onWeekChanged: mockOnWeekChanged,
  onRenderComplete: mockOnRenderComplete,
  markedDates: [
    { date: new Date(), color: '#FF0000' }
  ]
});

describe('CalendarStrip Component', () => {
  beforeEach(() => {
    // 각 테스트 전 모의 함수 초기화
    mockOnDateSelected.mockClear();
    mockOnWeekChanged.mockClear();
    mockOnRenderComplete.mockClear();
  });

  it('should render correctly with default props', () => {
    const { getByTestId } = render(<CalendarStrip {...getBaseProps()} testID="calendar-strip" />);
    expect(getByTestId('calendar-strip')).toBeTruthy();
  });

  it('should render with custom initial date', () => {
    const customDate = new Date(2025, 0, 1);
    const { getByTestId } = render(
      <CalendarStrip 
        {...getBaseProps()} 
        testID="calendar-strip"
        initialDate={customDate}
      />
    );
    expect(getByTestId('calendar-strip')).toBeTruthy();
    // 초기 날짜 설정 확인은 컨트롤러에 이미 테스트됨
  });

  it('should respect style props', () => {
    const { getByTestId } = render(
      <CalendarStrip 
        {...getBaseProps()} 
        testID="calendar-strip"
        style={{ backgroundColor: 'red' }}
        calendarHeaderStyle={{ color: 'blue' }}
      />
    );
    expect(getByTestId('calendar-strip')).toBeTruthy();
    // 스타일이 적용되었는지 확인하려면 더 복잡한 로직 필요
  });

  // CalendarController 통합 테스트
  describe('integration with CalendarController', () => {
    let controller;

    beforeEach(() => {
      controller = new CalendarController();
    });

    it('should call onDateSelected when a date is selected', () => {
      // 실제로는 컴포넌트 렌더링 후 날짜 터치 이벤트를 발생시키고
      // onDateSelected가 호출되는지 확인해야 함
      // 단위 테스트로 내부 메서드만 테스트
      const date = new Date();
      controller.selectDate(date);
      
      const selectedDate = controller.getSelectedDate();
      expect(selectedDate).toBeTruthy();
      expect(dayjs(selectedDate).isSame(dayjs(date), 'day')).toBe(true);
    });

    it('should update visible dates when navigating', () => {
      // 주간 이동 테스트
      const initialWeekIndex = controller.getCurrentWeekIndex();
      controller.goToNextWeek();
      expect(controller.getCurrentWeekIndex()).toBe(initialWeekIndex + 1);
      
      controller.goToPreviousWeek();
      expect(controller.getCurrentWeekIndex()).toBe(initialWeekIndex);
    });
  });

  // 마커 관련 테스트
  describe('marked dates', () => {
    it('should handle marked dates correctly', () => {
      const today = new Date();
      const markedDates = [
        { date: today, color: '#FF0000' },
        { date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2), color: '#00FF00' }
      ];
      
      const { getByTestId } = render(
        <CalendarStrip 
          {...getBaseProps()} 
          markedDates={markedDates}
          testID="calendar-strip"
        />
      );
      expect(getByTestId('calendar-strip')).toBeTruthy();
    });
  });

  it('should call updateMonthYear with formatted values', () => {
    const updateMock = jest.fn();
    const startDate = new Date(2024, 10, 15); // 15 Nov 2024

    const { UNSAFE_getByType } = render(
      <CalendarStrip
        {...getBaseProps()}
        startingDate={startDate}
        updateMonthYear={updateMock}
      />
    );

    const flatList = UNSAFE_getByType(FlatList);
    const cb = flatList.props.viewabilityConfigCallbackPairs[0].onViewableItemsChanged;
    cb({ viewableItems: [{ index: 1 }] });

    const middleDate = dayjs(startDate).startOf('week').add(3, 'day');
    expect(updateMock).toHaveBeenCalledWith(middleDate.format('MM'), middleDate.format('YYYY'));
  });

  // ref 테스트
  describe('ref functionality', () => {
    it('should expose controller methods via ref', () => {
      const ref = React.createRef();
      render(<CalendarStrip {...getBaseProps()} ref={ref} />);
      
      expect(ref.current).toBeTruthy();
      expect(typeof ref.current.goToNextWeek).toBe('function');
      expect(typeof ref.current.goToPreviousWeek).toBe('function');
      expect(typeof ref.current.getSelectedDate).toBe('function');
      expect(typeof ref.current.jumpToDate).toBe('function');
    });
  });
});
