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

  test('queues additional right swipe while shifting', () => {
    const ref = React.createRef();
    const { UNSAFE_getByType } = render(<CalendarStrip ref={ref} showMonth={false} />);
    const list = UNSAFE_getByType(FlatList);
    const width = getItemWidth(list);
    const before = ref.current.getCurrentWeek().startDate;

    fireEvent(list, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: width * 2 } } });
    fireEvent(list, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: width * 2 } } });
    fireEvent(list, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: width } } });
    fireEvent(list, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: width } } });

    const after = ref.current.getCurrentWeek().startDate;
    expect(dayjs(after).diff(dayjs(before), 'day')).toBe(14);
  });

  test('queues additional left swipe while shifting', () => {
    const ref = React.createRef();
    const { UNSAFE_getByType } = render(<CalendarStrip ref={ref} showMonth={false} />);
    const list = UNSAFE_getByType(FlatList);
    const width = getItemWidth(list);
    const before = ref.current.getCurrentWeek().startDate;

    fireEvent(list, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: 0 } } });
    fireEvent(list, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: 0 } } });
    fireEvent(list, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: width } } });
    fireEvent(list, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: width } } });

    const after = ref.current.getCurrentWeek().startDate;
    expect(dayjs(before).diff(dayjs(after), 'day')).toBe(14);
  });

  test('onWeekChanged receives dayjs objects during rapid updates', () => {
    const onWeekChanged = jest.fn();
    const { UNSAFE_getByType } = render(
      <CalendarStrip showMonth={false} onWeekChanged={onWeekChanged} />
    );
    const list = UNSAFE_getByType(FlatList);
    const callback = list.props.viewabilityConfigCallbackPairs[0].onViewableItemsChanged;

    callback({ viewableItems: [{ index: 1 }] });
    callback({ viewableItems: [{ index: 1 }] });

    expect(onWeekChanged).toHaveBeenCalled();
    onWeekChanged.mock.calls.forEach(args => {
      expect(dayjs.isDayjs(args[0])).toBe(true);
      expect(dayjs.isDayjs(args[1])).toBe(true);
    });
  });
});
