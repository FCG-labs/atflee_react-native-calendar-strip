import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Platform,
  LayoutAnimation,
  UIManager,
  InteractionManager
} from 'react-native';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

// Initialize dayjs plugins
dayjs.extend(isoWeek);

// Components
import CalendarHeader from '../CalendarHeader';
import CalendarDateItem from './CalendarDateItem';
import logger from '../utils/logger';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * CalendarStrip Component - Carousel Pattern
 * Fixed 5-week window with center-focused infinite scrolling
 */
const CalendarStrip = ({
  // Calendar configuration
  selectedDate,
  startingDate,
  minDate,
  maxDate,
  useIsoWeekday,
  numDaysInWeek = 7,
  scrollable,
  scrollerPaging,
  weekBuffer = 3,
  useFlashList = false,
  flashListEstimatedItemSize,
  
  // Header configuration
  showMonth,
  calendarHeaderFormat,
  calendarHeaderPosition,
  calendarHeaderStyle,
  
  // Styling
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
  
  // Display options
  showDayName,
  showDayNumber,
  upperCaseDays,
  allowDayTextScaling,
  
  // Events and callbacks
  onDateSelected,
  onWeekChanged,
  onHeaderSelected,
  updateMonthYear,
  onRenderComplete,
  
  // Custom components
  dayComponent,
  leftSelector,
  rightSelector,
  
  // Markers
  markedDates,
  markedDatesStyle,
  markerComponent,
  
  // Reference
  calendarRef
}) => {
  // Carousel constants - dynamic window based on weekBuffer
  // When 스크롤이 비활성화(non-scrollable)인 경우에는 주(week)가 한 개만 렌더되므로
  // WINDOW_SIZE와 CENTER_INDEX를 1, 0으로 고정한다. 그렇지 않으면
  // weeks[CENTER_INDEX]가 undefined가 되어 onWeekChanged, updateMonthYear 등이
  // 호출되지 않는 버그가 발생한다.
  const WINDOW_SIZE = scrollable ? weekBuffer * 2 + 1 : 1;
  const CENTER_INDEX = scrollable ? weekBuffer : 0;

  const ListComponent = useMemo(() => {
    if (useFlashList) {
      try {
        // eslint-disable-next-line global-require
        return require('@shopify/flash-list').FlashList;
      } catch (err) {
        logger.debug('[WARN] FlashList not installed, falling back to FlatList');
      }
    }
    return FlatList;
  }, [useFlashList]);

  // FlatList reference
  const flatListRef = useRef(null);
  // Track the currently visible week to avoid redundant callbacks
  const currentWeekRef = useRef('');
  // Skip onWeekChanged on initial render
  const skipInitialRef = useRef(true);

  // Cache previously generated weeks to avoid regeneration when buffer is large
  const weekCacheRef = useRef(new Map());

  // Week generation utility
  const generateWeek = useCallback((startDate) => {
    const start = dayjs(startDate);
    const today = dayjs();
    const days = [];
    
    for (let i = 0; i < numDaysInWeek; i++) {
      const date = start.add(i, 'day');
      days.push({
        date: date,
        dateString: date.format('YYYY-MM-DD'),
        dayOfWeek: date.day(),
        dayOfMonth: date.date(),
        month: date.month(),
        year: date.year(),
        isToday: date.isSame(today, 'day'),
        isCurrentMonth:
          date.month() === today.month() && date.year() === today.year()
      });
    }
    
    return {
      startDate: start.toDate(),
      endDate: start.add(numDaysInWeek - 1, 'day').toDate(),
      days
    };
  }, [numDaysInWeek]);

  const getWeekStart = useCallback((date) => {
    const d = dayjs(date);
    return useIsoWeekday ? d.startOf('isoWeek') : d.startOf('week');
  }, [useIsoWeekday]);

  // Retrieve a week from cache or generate and store it
  const getCachedWeek = useCallback(
    (startDate) => {
      const key = dayjs(startDate).startOf('day').format('YYYY-MM-DD');
      const cached = weekCacheRef.current.get(key);
      if (cached) {
        return cached;
      }
      const week = generateWeek(startDate);
      weekCacheRef.current.set(key, week);
      return week;
    },
    [generateWeek]
  );

  // Initialize carousel window
  const initCarousel = useCallback(() => {
    logger.debug('[INIT] Creating carousel window');
    const currentDate = selectedDate || startingDate || new Date();
    logger.debug('[INIT] Current date:', dayjs(currentDate).format('YYYY-MM-DD'));

    // Clear cache when rebuilding the carousel to avoid stale weeks
    weekCacheRef.current.clear();

    const weekStart = getWeekStart(currentDate);
    logger.debug('[INIT] Week start:', weekStart.format('YYYY-MM-DD'));

    const weeks = [];

    if (!scrollable) {
      // Only generate the current week when not scrollable
      const week = getCachedWeek(weekStart);
      logger.debug('[INIT] Week 1:', dayjs(week.startDate).format('YYYY-MM-DD'), 'to', dayjs(week.endDate).format('YYYY-MM-DD'));
      weeks.push(week);
    } else {
      // Generate window of weeks around the active date
      for (let i = -weekBuffer; i <= weekBuffer; i++) {
        const start = weekStart.add(i * numDaysInWeek, 'day');
        const week = getCachedWeek(start);
        logger.debug(`[INIT] Week ${i + 1}:`, dayjs(week.startDate).format('YYYY-MM-DD'), 'to', dayjs(week.endDate).format('YYYY-MM-DD'));
        weeks.push(week);
      }
    }

    logger.debug('[INIT] Created', weeks.length, 'weeks');
    return weeks;
  }, [
    selectedDate,
    startingDate,
    getWeekStart,
    getCachedWeek,
    numDaysInWeek,
    weekBuffer,
  ]);

  // State - Fixed carousel window
  const [weeks, setWeeks] = useState(() => {
    logger.debug('[STATE] Initializing weeks state');
    return initCarousel();
  });

  useEffect(() => {
    const centerWeek = weeks[CENTER_INDEX];

    if (centerWeek) {
      const weekKey = `${dayjs(centerWeek.startDate).format('YYYY-MM-DD')}_${dayjs(centerWeek.endDate).format('YYYY-MM-DD')}`;

      // Invoke callback only if week actually changed and skip initial mount
      if (currentWeekRef.current !== weekKey) {
        if (!skipInitialRef.current && onWeekChanged) {
          logger.debug('[CALLBACK] onWeekChanged (effect):',
            dayjs(centerWeek.startDate).format('YYYY-MM-DD'),
            dayjs(centerWeek.endDate).format('YYYY-MM-DD')
          );
          onWeekChanged(dayjs(centerWeek.startDate), dayjs(centerWeek.endDate));
        }
        currentWeekRef.current = weekKey;
        skipInitialRef.current = false;
      }
    }

    if (centerWeek && updateMonthYear) {
      const middleDate = dayjs(centerWeek.startDate).add(
        Math.floor(numDaysInWeek / 2),
        'day'
      );
      const month = middleDate.format('MM');
      const year = middleDate.format('YYYY');
      updateMonthYear(month, year);
    }
  }, [weeks, onWeekChanged, updateMonthYear, numDaysInWeek]);
  
  const [activeDate, setActiveDate] = useState(() => {
    const date = selectedDate || startingDate || new Date();
    logger.debug('[STATE] Initial active date:', dayjs(date).format('YYYY-MM-DD'));
    return date;
  });
  const [viewWidth, setViewWidth] = useState(Dimensions.get('window').width);
  const [leftWidth, setLeftWidth] = useState(0);
  const [rightWidth, setRightWidth] = useState(0);
  const startTimeRef = useRef(
    typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now()
  );

  // Handle selectedDate changes
  useEffect(() => {
    logger.debug('[EFFECT] selectedDate changed:', selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : 'null');
    logger.debug('[EFFECT] activeDate:', dayjs(activeDate).format('YYYY-MM-DD'));
    
    if (selectedDate && !dayjs(selectedDate).isSame(dayjs(activeDate), 'day')) {
      logger.debug('[EFFECT] Setting new active date');
      setActiveDate(selectedDate);
      
      // Check if selectedDate is in current window
      const targetWeekStart = getWeekStart(selectedDate);
      logger.debug('[EFFECT] Target week start:', targetWeekStart.format('YYYY-MM-DD'));
      
      const isInWindow = weeks.some(week => {
        const weekStart = getWeekStart(week.startDate);
        const match = weekStart.isSame(targetWeekStart, 'day');
        logger.debug('[EFFECT] Checking week:', weekStart.format('YYYY-MM-DD'), 'matches:', match);
        return match;
      });
      
      logger.debug('[EFFECT] Is in current window:', isInWindow);
      
      if (!isInWindow) {
        logger.debug('[EFFECT] Rebuilding carousel around selected date');
        const newWeeks = initCarousel();
        setWeeks(newWeeks);
      }
      
      // Recenter will occur via layout effect
    }
  }, [selectedDate, activeDate, weeks, getWeekStart, initCarousel]);

  // Initial centering once layout is calculated
  useLayoutEffect(() => {
    if (scrollerPaging && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: CENTER_INDEX,
        animated: scrollerPaging,
      });
    }

    if (onRenderComplete && startTimeRef.current) {
      const end =
        typeof performance !== 'undefined' && performance.now
          ? performance.now()
          : Date.now();
      onRenderComplete(end - startTimeRef.current);
    }
  }, [weeks, viewWidth, scrollerPaging, onRenderComplete]);

  // True Carousel: Real-time scroll threshold detection
  const isShiftingRef = useRef(false);
  const pendingShiftRef = useRef([]);
  
  const shiftLeft = useCallback(() => {
    if (isShiftingRef.current) {
      pendingShiftRef.current.push('left');
      return false;
    }
    isShiftingRef.current = true;

    let shifted = false;
    setWeeks(currentWeeks => {
      const firstWeek = currentWeeks[0];
      const prevWeekStart = getWeekStart(firstWeek.startDate).subtract(numDaysInWeek, 'day');
      const prevWeekEnd = dayjs(prevWeekStart).add(numDaysInWeek - 1, 'day');

      if (minDate && prevWeekEnd.isBefore(dayjs(minDate), 'day')) {
        return currentWeeks;
      }

      shifted = true;
      const newWeek = getCachedWeek(prevWeekStart);
      return [newWeek, ...currentWeeks.slice(0, WINDOW_SIZE - 1)];
    });

    InteractionManager.runAfterInteractions(() => {
      flatListRef.current?.scrollToIndex({ index: CENTER_INDEX, animated: false });
    });

    return shifted;
  }, [
    getCachedWeek,
    getWeekStart,
    numDaysInWeek,
    minDate,
    WINDOW_SIZE,
    weekBuffer,
  ]);

  const shiftRight = useCallback(() => {
    if (isShiftingRef.current) {
      pendingShiftRef.current.push('right');
      return false;
    }
    isShiftingRef.current = true;

    let shifted = false;
    setWeeks(currentWeeks => {
      const lastWeek = currentWeeks[currentWeeks.length - 1];
      const nextWeekStart = getWeekStart(lastWeek.startDate).add(numDaysInWeek, 'day');

      if (maxDate && dayjs(nextWeekStart).isAfter(dayjs(maxDate), 'day')) {
        return currentWeeks;
      }

      shifted = true;
      const newWeek = getCachedWeek(nextWeekStart);
      return [...currentWeeks.slice(1), newWeek];
    });

    InteractionManager.runAfterInteractions(() => {
      flatListRef.current?.scrollToIndex({ index: CENTER_INDEX, animated: false });
    });

    return shifted;
  }, [
    getCachedWeek,
    getWeekStart,
    numDaysInWeek,
    maxDate,
    WINDOW_SIZE,
    weekBuffer,
  ]);

  const onScrollEnd = useCallback(
    (event) => {
      const currentOffset = event.nativeEvent.contentOffset.x;
      const itemWidth = contentWidth;
      const page = Math.round(itemWidth ? currentOffset / itemWidth : 1);
      logger.debug('[CAROUSEL] Scroll end page:', page, 'offset:', currentOffset);

      if (isShiftingRef.current) {
        if (page === CENTER_INDEX) {
          isShiftingRef.current = false;
          const next = pendingShiftRef.current.shift();
          if (next === 'left') {
            shiftLeft();
          } else if (next === 'right') {
            shiftRight();
          }
        }
        return;
      }

      if (page === 0) {
        shiftLeft();
      } else if (page === WINDOW_SIZE - 1) {
        shiftRight();
      }
    },
    [contentWidth, shiftLeft, shiftRight]
  );

  
  // Determine the logical "center" week based on visible items
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (!viewableItems || viewableItems.length === 0) {
      return;
    }

    // Pick the index that is closest to the middle of the viewport.
    // Assumption: items array already sorted by their position.
    const visibleIndices = viewableItems
      .map(v => v.index)
      .filter(i => typeof i === 'number');

    if (visibleIndices.length === 0) return;

    // Choose the median index as an approximation of the centered item
    visibleIndices.sort((a, b) => a - b);
    const medianIdx = visibleIndices[Math.floor(visibleIndices.length / 2)];
    const centerWeek = weeks[medianIdx];

    if (!centerWeek) return;

    const weekKey = `${dayjs(centerWeek.startDate).format('YYYY-MM-DD')}_${dayjs(centerWeek.endDate).format('YYYY-MM-DD')}`;

    // Avoid redundant callbacks if week hasn't changed
    if (currentWeekRef.current !== weekKey) {
      if (onWeekChanged) {
        logger.debug('[CALLBACK] onWeekChanged (viewable):',
          dayjs(centerWeek.startDate).format('YYYY-MM-DD'),
          dayjs(centerWeek.endDate).format('YYYY-MM-DD')
        );
        onWeekChanged(dayjs(centerWeek.startDate), dayjs(centerWeek.endDate));
      }

      if (updateMonthYear) {
        const middleDate = dayjs(centerWeek.startDate).add(
          Math.floor(numDaysInWeek / 2),
          'day'
        );
        updateMonthYear(middleDate.format('MM'), middleDate.format('YYYY'));
      }

      currentWeekRef.current = weekKey;
    }
  }, [weeks, numDaysInWeek, onWeekChanged, updateMonthYear]);

  // Imperative methods
  React.useImperativeHandle(calendarRef, () => {
    const handleScrollToDate = (date) => {
      setActiveDate(date);

      // Rebuild carousel around new date
      const newWeeks = initCarousel();
      setWeeks(newWeeks);

    };

    return {
      jumpToDate: handleScrollToDate,
      scrollToDate: handleScrollToDate,
      getSelectedDate: () => activeDate,
      goToNextWeek: () => {
        const centerWeek = weeks[CENTER_INDEX];
        if (centerWeek) {
          const nextWeekStart = getWeekStart(centerWeek.startDate).add(numDaysInWeek, 'day');
          setActiveDate(nextWeekStart.toDate());
        }
      },
      goToPreviousWeek: () => {
        const centerWeek = weeks[CENTER_INDEX];
        if (centerWeek) {
          const prevWeekStart = getWeekStart(centerWeek.startDate).subtract(numDaysInWeek, 'day');
          setActiveDate(prevWeekStart.toDate());
        }
      },
      getCurrentWeek: () => weeks[CENTER_INDEX] || null,
      getWeeks: () => weeks,
      getCurrentWeekIndex: () => CENTER_INDEX,
    };
  });

  // Date selection handler
  const handleDateSelection = useCallback(date => {
    logger.debug('[DATE] Date selected:', dayjs(date).format('YYYY-MM-DD'));
    
    const dateObj = dayjs(date);
    if (minDate && dateObj.isBefore(dayjs(minDate), 'day')) {
      logger.debug('[DATE] Date before minDate, ignoring');
      return;
    }
    if (maxDate && dateObj.isAfter(dayjs(maxDate), 'day')) {
      logger.debug('[DATE] Date after maxDate, ignoring');
      return;
    }

    logger.debug('[DATE] Setting active date to:', dayjs(date).format('YYYY-MM-DD'));
    setActiveDate(date);

    if (onDateSelected) {
      logger.debug('[DATE] Calling onDateSelected callback');
      onDateSelected(date);
    }
  }, [onDateSelected, minDate, maxDate]);

  // Layout handlers
  const onLayout = useCallback(event => {
    const { width } = event.nativeEvent.layout;
    setViewWidth(width);
  }, []);

  const onLeftLayout = useCallback(e => {
    setLeftWidth(e.nativeEvent.layout.width);
  }, []);

  const onRightLayout = useCallback(e => {
    setRightWidth(e.nativeEvent.layout.width);
  }, []);

  const contentWidth = Math.max(viewWidth - leftWidth - rightWidth, 0);

  // Render week
  const renderWeek = useCallback(({ item: week }) => {
    return (
      <View style={[styles.week, { width: contentWidth }]}>
        {week.days.map(day => (
          <CalendarDateItem
            key={day.dateString}
            date={day.date}
            dateNumber={day.dayOfMonth}
            dayName={upperCaseDays
              ? day.date.format('ddd').toUpperCase()
              : day.date.format('ddd')
            }
            isToday={day.isToday}
            isActive={dayjs(day.date).isSame(dayjs(activeDate), 'day')}
            isWeekend={day.dayOfWeek === 0 || day.dayOfWeek === 6}
            isCurrentMonth={day.isCurrentMonth}
            onDateSelected={() => handleDateSelection(day.date)}
            markedDates={markedDates}
            markedDatesStyle={markedDatesStyle}
            markerComponent={markerComponent}
            dayComponent={dayComponent}
            dateNameStyle={dateNameStyle}
            dateNumberStyle={dateNumberStyle}
            highlightDateNameStyle={highlightDateNameStyle}
            highlightDateNumberStyle={highlightDateNumberStyle}
            dayContainerStyle={dayContainerStyle}
            calendarColor={calendarColor}
            highlightColor={highlightColor}
            disabledDateOpacity={disabledDateOpacity}
            styleWeekend={styleWeekend}
            showDayName={showDayName}
            showDayNumber={showDayNumber}
            allowDayTextScaling={allowDayTextScaling}
          />
        ))}
      </View>
    );
  }, [
    contentWidth, upperCaseDays, activeDate, handleDateSelection,
    markedDates, markedDatesStyle, markerComponent, dayComponent,
    dateNameStyle, dateNumberStyle, highlightDateNameStyle,
    highlightDateNumberStyle, dayContainerStyle, calendarColor,
    highlightColor, disabledDateOpacity, styleWeekend,
    showDayName, showDayNumber, allowDayTextScaling
  ]);

  const keyExtractor = useCallback(week => week.startDate.toISOString(), []);

  const getItemLayout = useCallback((data, index) => ({
    length: contentWidth,
    offset: contentWidth * index,
    index,
  }), [contentWidth]);

  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50
  }), []);

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged }
  ]);
  
  useEffect(() => {
    viewabilityConfigCallbackPairs.current[0].onViewableItemsChanged = onViewableItemsChanged;
  }, [onViewableItemsChanged]);

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
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
        
        {scrollable ? (
          <ListComponent
            ref={flatListRef}
            data={weeks}
            renderItem={renderWeek}
            keyExtractor={keyExtractor}
            horizontal
            pagingEnabled={scrollerPaging}
            showsHorizontalScrollIndicator={false}
            getItemLayout={getItemLayout}
            onMomentumScrollEnd={onScrollEnd}
            onScrollEndDrag={onScrollEnd}
            viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
            initialScrollIndex={CENTER_INDEX}
            {...(useFlashList && flashListEstimatedItemSize
              ? { estimatedItemSize: flashListEstimatedItemSize }
              : {})}
          />
        ) : (
          <View style={[styles.week, { width: contentWidth }]}>
            {weeks[CENTER_INDEX]?.days.map(day => (
              <CalendarDateItem
                key={day.dateString}
                date={day.date}
                dateNumber={day.dayOfMonth}
                dayName={upperCaseDays
                  ? day.date.format('ddd').toUpperCase()
                  : day.date.format('ddd')
                }
                isToday={day.isToday}
                isActive={dayjs(day.date).isSame(dayjs(activeDate), 'day')}
                isWeekend={day.dayOfWeek === 0 || day.dayOfWeek === 6}
                isCurrentMonth={day.isCurrentMonth}
                onDateSelected={() => handleDateSelection(day.date)}
                markedDates={markedDates}
                markedDatesStyle={markedDatesStyle}
                markerComponent={markerComponent}
                dayComponent={dayComponent}
                dateNameStyle={dateNameStyle}
                dateNumberStyle={dateNumberStyle}
                highlightDateNameStyle={highlightDateNameStyle}
                highlightDateNumberStyle={highlightDateNumberStyle}
                dayContainerStyle={dayContainerStyle}
                calendarColor={calendarColor}
                highlightColor={highlightColor}
                disabledDateOpacity={disabledDateOpacity}
                styleWeekend={styleWeekend}
                showDayName={showDayName}
                showDayNumber={showDayNumber}
                allowDayTextScaling={allowDayTextScaling}
              />
            ))}
          </View>
        )}
        
        <View onLayout={onRightLayout}>{rightSelector}</View>
      </View>
    </View>
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inner: {
    flex: 1,
  },
  calendarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});

CalendarStrip.propTypes = {
  // Calendar configuration
  selectedDate: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.object
  ]),
  startingDate: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.object
  ]),
  minDate: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.object
  ]),
  maxDate: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.object
  ]),
  useIsoWeekday: PropTypes.bool,
  numDaysInWeek: PropTypes.number,
  scrollable: PropTypes.bool,
  scrollerPaging: PropTypes.bool,
  weekBuffer: PropTypes.number,
  useFlashList: PropTypes.bool,
  flashListEstimatedItemSize: PropTypes.number,

  // Header configuration
  showMonth: PropTypes.bool,
  calendarHeaderFormat: PropTypes.string,
  calendarHeaderPosition: PropTypes.oneOf(['top', 'bottom']),
  calendarHeaderStyle: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),

  // Styling
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  innerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  calendarColor: PropTypes.string,
  highlightColor: PropTypes.string,
  dateNameStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  dateNumberStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  highlightDateNameStyle: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  highlightDateNumberStyle: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
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
  markedDatesStyle: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  markerComponent: PropTypes.func,

  // Reference
  calendarRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any })
  ])
};

CalendarStrip.defaultProps = {
  selectedDate: new Date(),
  startingDate: new Date(),
  minDate: undefined,
  maxDate: undefined,
  useIsoWeekday: false,
  numDaysInWeek: 7,
  scrollable: true,
  scrollerPaging: true,
  weekBuffer: 3,
  useFlashList: false,
  flashListEstimatedItemSize: undefined,

  // Header configuration defaults
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

  // Events and callbacks
  onDateSelected: undefined,
  onWeekChanged: undefined,
  onHeaderSelected: undefined,
  updateMonthYear: undefined,
  onRenderComplete: undefined,

  // Custom components
  dayComponent: undefined,
  leftSelector: undefined,
  rightSelector: undefined,

  // Markers
  markedDates: [],
  markedDatesStyle: {},
  markerComponent: undefined,

  // Reference
  calendarRef: undefined
};

export default CalendarStrip;
