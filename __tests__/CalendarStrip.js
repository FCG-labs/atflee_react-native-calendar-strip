import React from 'react';
import { render } from '@testing-library/react-native';
import { FlatList, View } from 'react-native';
import CalendarStrip from '../src/components/CalendarStrip';

describe('CalendarStrip functional API', () => {
  test('renders buffered weeks of seven days by default', () => {
    const ref = React.createRef();
    const { getAllByA11yRole } = render(
      <CalendarStrip showMonth={false} ref={ref} />
    );
    expect(getAllByA11yRole('button')).toHaveLength(49);
    expect(ref.current.getWeeks()).toHaveLength(7);
  });

  test('respects numDaysInWeek prop', () => {
    const { getAllByA11yRole } = render(
      <CalendarStrip showMonth={false} numDaysInWeek={14} />
    );
    expect(getAllByA11yRole('button')).toHaveLength(42);
  });

  test('renders a single week when not scrollable', () => {
    const ref = React.createRef();
    const { getAllByA11yRole } = render(
      <CalendarStrip showMonth={false} scrollable={false} ref={ref} />
    );
    expect(getAllByA11yRole('button')).toHaveLength(7);
    expect(ref.current.getWeeks()).toHaveLength(1);
  });

  test('exposes imperative methods via ref', () => {
    const ref = React.createRef();
    render(<CalendarStrip showMonth={false} ref={ref} />);
    expect(ref.current).toBeTruthy();
    expect(typeof ref.current.goToNextWeek).toBe('function');
    expect(typeof ref.current.goToPreviousWeek).toBe('function');
    expect(typeof ref.current.getSelectedDate).toBe('function');
    expect(typeof ref.current.scrollToDate).toBe('function');
  });

  test('swiping right triggers goToNextWeek once', () => {
    const ref = React.createRef();
    const { UNSAFE_getByType } = render(
      <CalendarStrip showMonth={false} scrollerPaging ref={ref} />
    );

    const flatList = UNSAFE_getByType(FlatList);
    const spy = jest.spyOn(ref.current, 'goToNextWeek');

    // Simulate a swipe to the right with momentum
    flatList.props.onScroll({
      nativeEvent: { contentOffset: { x: 400, y: 0 } }
    });
    if (flatList.props.onMomentumScrollEnd) {
      flatList.props.onMomentumScrollEnd({
        nativeEvent: { contentOffset: { x: 400, y: 0 } }
      });
    }

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('swiping left triggers goToPreviousWeek once', () => {
    const ref = React.createRef();
    const { UNSAFE_getByType } = render(
      <CalendarStrip showMonth={false} scrollerPaging ref={ref} />
    );

    const flatList = UNSAFE_getByType(FlatList);
    const spy = jest.spyOn(ref.current, 'goToPreviousWeek');

    flatList.props.onScroll({
      nativeEvent: { contentOffset: { x: -400, y: 0 } }
    });
    if (flatList.props.onMomentumScrollEnd) {
      flatList.props.onMomentumScrollEnd({
        nativeEvent: { contentOffset: { x: -400, y: 0 } }
      });
    }

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('reuses viewabilityConfigCallbackPairs array across renders', () => {
    const firstCb = jest.fn();
    const { UNSAFE_getByType, rerender } = render(
      <CalendarStrip showMonth={false} onViewableItemsChanged={firstCb} />
    );

    const flatList1 = UNSAFE_getByType(FlatList);
    const pairs1 = flatList1.props.viewabilityConfigCallbackPairs;

    const secondCb = jest.fn();
    rerender(
      <CalendarStrip showMonth={false} onViewableItemsChanged={secondCb} />
    );

    const flatList2 = UNSAFE_getByType(FlatList);
    const pairs2 = flatList2.props.viewabilityConfigCallbackPairs;

    expect(pairs2).toBe(pairs1);
    expect(pairs2[0].onViewableItemsChanged).toBe(secondCb);
  });

  test('updating weekBuffer re-creates weeks array', () => {
    const ref = React.createRef();
    const { rerender } = render(
      <CalendarStrip showMonth={false} weekBuffer={1} ref={ref} />
    );

    const weeksBefore = ref.current.getWeeks();
    expect(weeksBefore).toHaveLength(3);

    rerender(<CalendarStrip showMonth={false} weekBuffer={2} ref={ref} />);

    const weeksAfter = ref.current.getWeeks();
    expect(weeksAfter).toHaveLength(5);
    expect(weeksAfter).not.toBe(weeksBefore);
  });

  test('applies innerStyle to inner container', () => {
    const { UNSAFE_getAllByType } = render(
      <CalendarStrip showMonth={false} innerStyle={{ backgroundColor: 'red' }} />
    );
    const views = UNSAFE_getAllByType(View);
    expect(views[1].props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: 'red' })])
    );
  });
});
