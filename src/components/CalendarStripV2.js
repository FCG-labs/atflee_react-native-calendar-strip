import React, { forwardRef, useCallback, useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Platform,
  LayoutAnimation,
  UIManager,
  InteractionManager,
} from 'react-native';
import dayjs from '../dayjs';
import CalendarHeader from '../CalendarHeader';
import CalendarDateItem from './CalendarDateItem';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * CalendarStripV2 - Optimized version using stable props and custom memo comparators
 */
const CalendarStripV2 = forwardRef(function CalendarStripV2(
  props,
  ref
) {
  const {
    selectedDate,
    startingDate,
    minDate,
    maxDate,
    useIsoWeekday,
    numDaysInWeek = 7,
    scrollable,
    scrollerPaging,
    weekBuffer = 3,
    debug = false,
    // header
    showMonth,
    calendarHeaderFormat,
    calendarHeaderPosition,
    calendarHeaderStyle,
    // styling
    style,
    innerStyle,
    calendarColor,
    highlightColor,
    dateNameStyle,
    dateNumberStyle,
    highlightDateNameStyle,
    highlightDateNumberStyle,
    dayContainerStyle,
    disabledDateOpacity,
    styleWeekend,
    // display
    showDayName,
    showDayNumber,
    upperCaseDays,
    allowDayTextScaling,
    // events
    onDateSelected,
    onWeekChanged,
    onHeaderSelected,
    updateMonthYear,
    onRenderComplete,
    // custom
    dayComponent,
    leftSelector,
    rightSelector,
    // markers
    markedDates,
    markedDatesStyle,
    markerComponent,
  } = props;

  // --- WEEK GENERATION, CACHING, INITCAROUSEL (same as v1) ---
  const weekCacheRef = useRef(new Map());

  const generateWeek = useCallback((startDate) => {
    const start = dayjs(startDate);
    const today = dayjs();
    const days = [];
    for (let i = 0; i < numDaysInWeek; i++) {
      const d = start.add(i, 'day');
      const epoch = d.valueOf();
      const dayName = d.format('ddd');
      days.push({
        date: new Date(epoch),
        epoch,
        dateString: dayName ? d.format('YYYY-MM-DD') : '',
        dayName,
        dayNameUpper: dayName.toUpperCase(),
        dayOfWeek: d.day(),
        dayOfMonth: d.date(),
        month: d.month(),
        year: d.year(),
        isToday: d.isSame(today, 'day'),
        isCurrentMonth: d.month() === today.month() && d.year() === today.year(),
      });
    }
    return {
      startDate: start.clone(),
      endDate: start.add(numDaysInWeek - 1, 'day').clone(),
      days,
    };
  }, [numDaysInWeek]);

  const getWeekStart = useCallback((date) => {
    const d = dayjs(date);
    return useIsoWeekday ? d.startOf('isoWeek') : d.startOf('week');
  }, [useIsoWeekday]);

  const getCachedWeek = useCallback((startDate) => {
    const key = dayjs(startDate).startOf('day').format('YYYY-MM-DD');
    const cached = weekCacheRef.current.get(key);
    if (cached) return cached;
    const week = generateWeek(startDate);
    weekCacheRef.current.set(key, week);
    return week;
  }, [generateWeek]);

  const initCarousel = useCallback(() => {
    const currentDate = selectedDate || startingDate || new Date();
    weekCacheRef.current.clear();
    const weekStart = getWeekStart(currentDate);
    const carouselWeeks = [];
    if (!scrollable) {
      carouselWeeks.push(getCachedWeek(weekStart));
    } else {
      for (let i = -weekBuffer; i <= weekBuffer; i++) {
        const start = weekStart.add(i * numDaysInWeek, 'day');
        carouselWeeks.push(getCachedWeek(start));
      }
    }
    return carouselWeeks;
  }, [selectedDate, startingDate, getWeekStart, getCachedWeek, numDaysInWeek, weekBuffer]);

  // State
  const [activeDate, setActiveDate] = useState(() => selectedDate || startingDate || new Date());
  const [weeks, setWeeks] = useState(() => initCarousel());

  // Handle selectedDate changes
  const handleDateSelection = useCallback(date => {
    const d = dayjs(date);
    if (minDate && d.isBefore(dayjs(minDate), 'day')) return;
    if (maxDate && d.isAfter(dayjs(maxDate), 'day')) return;
    setActiveDate(d);
    if (onDateSelected) onDateSelected(d);
  }, [minDate, maxDate, onDateSelected]);

  // Memoize common CalendarDateItem props
  const commonDateItemProps = useMemo(() => ({
    markedDates,
    markedDatesStyle,
    markerComponent,
    dayComponent,
    dateNameStyle,
    dateNumberStyle,
    highlightDateNameStyle,
    highlightDateNumberStyle,
    dayContainerStyle,
    calendarColor,
    highlightColor,
    disabledDateOpacity,
    styleWeekend,
    showDayName,
    showDayNumber,
    allowDayTextScaling,
    onDateSelected: handleDateSelection,
  }), [
    markedDates,
    markedDatesStyle,
    markerComponent,
    dayComponent,
    dateNameStyle,
    dateNumberStyle,
    highlightDateNameStyle,
    highlightDateNumberStyle,
    dayContainerStyle,
    calendarColor,
    highlightColor,
    disabledDateOpacity,
    styleWeekend,
    showDayName,
    showDayNumber,
    allowDayTextScaling,
    handleDateSelection,
  ]);

  // Layout & pagination
const [viewWidth, setViewWidth] = useState(Dimensions.get('window').width);
const [leftWidth, setLeftWidth] = useState(0);
const [rightWidth, setRightWidth] = useState(0);
const contentWidth = useMemo(() => Math.max(viewWidth - leftWidth - rightWidth, 0), [viewWidth, leftWidth, rightWidth]);
const onLayout = useCallback(event => {
  setViewWidth(event.nativeEvent.layout.width);
}, []);
const onLeftLayout = useCallback(e => {
  setLeftWidth(e.nativeEvent.layout.width);
}, []);
const onRightLayout = useCallback(e => {
  setRightWidth(e.nativeEvent.layout.width);
}, []);
const getItemLayout = useCallback((data, index) => ({
  length: contentWidth,
  offset: contentWidth * index,
  index,
}), [contentWidth]);

// FlatList ref and viewability setup
const flatListRef = useRef(null);
const currentWeekRef = useRef(null);
const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 50 }), []);
const onViewableItemsChanged = useCallback(({ viewableItems }) => {
  if (!viewableItems || viewableItems.length === 0) return;
  const idx = viewableItems[0].index;
  if (idx == null) return;
  const week = weeks[idx];
  const weekKey = week.startDate.format('YYYY-MM-DD');
  if (currentWeekRef.current !== weekKey) {
    if (onWeekChanged) onWeekChanged(dayjs(week.startDate), dayjs(week.endDate));
    if (updateMonthYear) {
      const mid = dayjs(week.startDate).add(Math.floor(numDaysInWeek/2), 'day');
      updateMonthYear(mid.format('MM'), mid.format('YYYY'));
    }
    currentWeekRef.current = weekKey;
  }
}, [weeks, onWeekChanged, updateMonthYear, numDaysInWeek]);

// Center initial week
const centerIndex = Math.floor(weeks.length / 2);
const reCenter = useCallback(() => {
  if (flatListRef.current && scrollerPaging) {
    flatListRef.current.scrollToIndex({ index: centerIndex, animated: false });
  }
}, [centerIndex, scrollerPaging]);

useLayoutEffect(() => {
  reCenter();
  currentWeekRef.current = weeks[centerIndex]?.startDate.format('YYYY-MM-DD');
  if (onRenderComplete) onRenderComplete();
}, [weeks, reCenter, centerIndex]);

// Handle external selectedDate changes
useEffect(() => {
  if (selectedDate && !dayjs(selectedDate).isSame(activeDate, 'day')) {
    setActiveDate(dayjs(selectedDate));
    const newWeeks = initCarousel();
    setWeeks(newWeeks);
  }
}, [selectedDate]);

// Imperative methods
React.useImperativeHandle(ref, () => ({
  jumpToDate: date => {
    setActiveDate(dayjs(date));
    const newWeeks = initCarousel();
    setWeeks(newWeeks);
  },
  scrollToDate: date => {
    setActiveDate(dayjs(date));
    const newWeeks = initCarousel();
    setWeeks(newWeeks);
  },
  getSelectedDate: () => activeDate,
  goToNextWeek: () => {
    const nextDate = dayjs(activeDate).add(numDaysInWeek, 'day');
    setActiveDate(nextDate);
    const newWeeks = initCarousel();
    setWeeks(newWeeks);
  },
  goToPreviousWeek: () => {
    const prevDate = dayjs(activeDate).subtract(numDaysInWeek, 'day');
    setActiveDate(prevDate);
    const newWeeks = initCarousel();
    setWeeks(newWeeks);
  },
  getCurrentWeek: () => weeks[centerIndex],
  getWeeks: () => weeks,
  getCurrentWeekIndex: () => centerIndex,
}), [activeDate, initCarousel, weeks, numDaysInWeek, centerIndex]);

// Render a single week
  const renderWeek = useCallback(({ item: week, index }) => {
    return (
      <View style={[styles.week, { width: contentWidth }]}>  
        {week.days.map(day => (
          <CalendarDateItem
            {...commonDateItemProps}
            key={`${day.epoch}`}
            date={day.date}
            dateNumber={day.dayOfMonth}
            dayName={upperCaseDays ? day.dayNameUpper : day.dayName}
            isToday={day.isToday}
            isWeekend={day.dayOfWeek === 0 || day.dayOfWeek === 6}
            isCurrentMonth={day.isCurrentMonth}
            isActive={day.epoch === dayjs(activeDate).valueOf()}
          />
        ))}
      </View>
    );
  }, [commonDateItemProps, upperCaseDays, activeDate]);

  // Main render
  return (
    <View style={[styles.container, style]} ref={ref} onLayout={onLayout}>
      <View style={[styles.inner, innerStyle]}>
        {showMonth && (
          <CalendarHeader
            calendarHeaderFormat={calendarHeaderFormat}
            calendarHeaderStyle={calendarHeaderStyle}
            testID="calendar_header"
            activeDate={activeDate}
            onHeaderSelected={onHeaderSelected}
          />
        )}
        <View style={styles.calendarContainer}>
          <View onLayout={onLeftLayout}>{leftSelector}</View>
          <FlatList
            ref={flatListRef}
            initialScrollIndex={centerIndex}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
            data={weeks}
            horizontal
            pagingEnabled={scrollerPaging}
            showsHorizontalScrollIndicator={false}
            keyExtractor={week => week.startDate.format('YYYY-MM-DD')}
            renderItem={renderWeek}
            extraData={dayjs(activeDate).valueOf()}
            getItemLayout={getItemLayout}
          />
          <View onLayout={onRightLayout}>{rightSelector}</View>
        </View>
      </View>
    </View>
  );
});

CalendarStripV2.propTypes = {
  // Calendar configuration
  selectedDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.object, PropTypes.string]),
  startingDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.object, PropTypes.string]),
  minDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.object, PropTypes.string]),
  maxDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.object, PropTypes.string]),
  useIsoWeekday: PropTypes.bool,
  numDaysInWeek: PropTypes.number,
  scrollable: PropTypes.bool,
  scrollerPaging: PropTypes.bool,
  weekBuffer: PropTypes.number,
  debug: PropTypes.bool,

  // Header configuration
  showMonth: PropTypes.bool,
  calendarHeaderFormat: PropTypes.string,
  calendarHeaderPosition: PropTypes.oneOf(['top', 'bottom']),
  calendarHeaderStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),

  // Styling
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  innerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  calendarColor: PropTypes.string,
  highlightColor: PropTypes.string,
  dateNameStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  dateNumberStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  highlightDateNameStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  highlightDateNumberStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  dayContainerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  disabledDateOpacity: PropTypes.number,
  styleWeekend: PropTypes.bool,

  // Display options
  showDayName: PropTypes.bool,
  showDayNumber: PropTypes.bool,
  upperCaseDays: PropTypes.bool,
  allowDayTextScaling: PropTypes.bool,

  // Events and callbacks
  onDateSelected: PropTypes.func,
  onWeekChanged: PropTypes.func,
  onHeaderSelected: PropTypes.func,
  updateMonthYear: PropTypes.func,
  onRenderComplete: PropTypes.func,

  // Custom components
  dayComponent: PropTypes.func,
  leftSelector: PropTypes.node,
  rightSelector: PropTypes.node,

  // Markers
  markedDates: PropTypes.array,
  markedDatesStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  markerComponent: PropTypes.func,
};


CalendarStripV2.defaultProps = {
  selectedDate: dayjs(),
  startingDate: dayjs(),
  minDate: dayjs('2022-01-01'),
  maxDate: undefined,
  useIsoWeekday: false,
  numDaysInWeek: 7,
  scrollable: true,
  scrollerPaging: true,
  weekBuffer: 3,
  debug: false,

  // Header defaults
  showMonth: true,
  calendarHeaderFormat: 'MMMM YYYY',
  calendarHeaderPosition: 'top',
  calendarHeaderStyle: {},

  // Styling defaults
  style: {},
  innerStyle: {},
  calendarColor: '#fff',
  highlightColor: '#000',
  dateNameStyle: {},
  dateNumberStyle: {},
  highlightDateNameStyle: {},
  highlightDateNumberStyle: {},
  dayContainerStyle: {},
  disabledDateOpacity: 0.3,
  styleWeekend: false,

  // Display options defaults
  showDayName: true,
  showDayNumber: true,
  upperCaseDays: false,
  allowDayTextScaling: true,

  // Callbacks defaults
  onDateSelected: undefined,
  onWeekChanged: undefined,
  onHeaderSelected: undefined,
  updateMonthYear: undefined,
  onRenderComplete: undefined,

  // Custom components defaults
  dayComponent: undefined,
  leftSelector: undefined,
  rightSelector: undefined,

  // Markers defaults
  markedDates: [],
  markedDatesStyle: {},
  markerComponent: undefined,
};


const styles = StyleSheet.create({
  container: { width: '100%' },
  inner: { flex: 1 },
  calendarContainer: { flexDirection: 'row', alignItems: 'center' },
  week: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
});

export default React.memo(CalendarStripV2);
