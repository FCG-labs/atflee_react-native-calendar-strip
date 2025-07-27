import React from 'react';
import dayjs from 'dayjs';
import { FlatList } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import CalendarStrip from '../src/components/CalendarStrip';

function getItemWidth(flatList) {
  return flatList.props.getItemLayout([], 0).length;
}

describe('CalendarStrip week shifting', () => {
  test('shifts right only once per swipe', () => {
    const ref = React.createRef();
    const { UNSAFE_getByType } = render(<CalendarStrip ref={ref} showMonth={false} />);
    const list = UNSAFE_getByType(FlatList);
    const width = getItemWidth(list);
    const before = ref.current.getCurrentWeek().startDate;

    fireEvent(list, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: width * 2 } } });
    // second event from internal reset
    fireEvent(list, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: width } } });

    const after = ref.current.getCurrentWeek().startDate;
    expect(dayjs(after).diff(dayjs(before), 'day')).toBe(7);
    expect(ref.current.getWeeks()).toHaveLength(3);
  });

  test('shifts left only once per swipe', () => {
    const ref = React.createRef();
    const { UNSAFE_getByType } = render(<CalendarStrip ref={ref} showMonth={false} />);
    const list = UNSAFE_getByType(FlatList);
    const width = getItemWidth(list);
    const before = ref.current.getCurrentWeek().startDate;

    fireEvent(list, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: 0 } } });
    fireEvent(list, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: width } } });

    const after = ref.current.getCurrentWeek().startDate;
    expect(dayjs(before).diff(dayjs(after), 'day')).toBe(7);
    expect(ref.current.getWeeks()).toHaveLength(3);
  });
});
