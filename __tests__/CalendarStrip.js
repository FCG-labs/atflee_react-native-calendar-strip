import React from 'react';
import { render } from '@testing-library/react-native';
import CalendarStrip from '../src/components/CalendarStrip';

describe('CalendarStrip functional API', () => {
  test('renders three weeks of seven days by default', () => {
    const { getAllByA11yRole } = render(<CalendarStrip showMonth={false} />);
    expect(getAllByA11yRole('button')).toHaveLength(21);
  });

  test('respects numDaysInWeek prop', () => {
    const { getAllByA11yRole } = render(
      <CalendarStrip showMonth={false} numDaysInWeek={14} />
    );
    expect(getAllByA11yRole('button')).toHaveLength(42);
  });

  test('renders a single week when not scrollable', () => {
    const { getAllByA11yRole } = render(
      <CalendarStrip showMonth={false} scrollable={false} />
    );
    expect(getAllByA11yRole('button')).toHaveLength(7);
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
});
