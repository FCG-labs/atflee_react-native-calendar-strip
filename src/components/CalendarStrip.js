import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useMemo,
  forwardRef,
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
const CalendarStrip = forwardRef(function CalendarStrip({
  debug = false,
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
  useFlashList = true,
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
}) {
  // Carousel constants - dynamic window based on weekBuffer
  // When 스크롤이 비활성화(non-scrollable)인 경우에는 주(week)가 한 개만 렌더되므로
  // WINDOW_SIZE와 CENTER_INDEX를 1, 0으로 고정한다. 그렇지 않으면
  // weeks[CENTER_INDEX]가 undefined가 되어 onWeekChanged, updateMonthYear 등이
  // 호출되지 않는 버그가 발생한다.
  const WINDOW_SIZE = scrollable ? weekBuffer * 2 + 1 : 1;
  const CENTER_INDEX = scrollable ? weekBuffer : 0;

  // Number of weeks to add/remove when user reaches either end of the window.
  // Shift an entire "buffer" worth of weeks for more aggressive preloading.
  const SHIFT_SIZE = Math.max(1, weekBuffer);

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
  // Track whether we've already performed the first centering pass
  const didInitialCenterRef = useRef(false);
  // Track the currently visible week to avoid redundant callbacks
  const currentWeekRef = useRef('');
  // Skip onWeekChanged on initial render
  const skipInitialRef = useRef(true);

  // Helper to programmatically re-center the list to CENTER_INDEX
  const reCenter = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: CENTER_INDEX, animated: scrollerPaging });
    }
  }, [scrollerPaging, CENTER_INDEX]);

  // Cache previously generated weeks to avoid regeneration when buffer is large
  const weekCacheRef = useRef(new Map());

  // Week generation utility
  const generateWeek = useCallback((startDate) => {
    const start = dayjs(startDate);
    const today = dayjs();
    const days = [];
    
    for (let i = 0; i < numDaysInWeek; i++) {
      const d = start.add(i, 'day');
      const epoch = d.valueOf();
      const dayName = d.format('ddd');
      days.push({
        // store lightweight Date object (or epoch) instead of full dayjs instance
        date: new Date(epoch),
        epoch,
        dateString: dayName ? `${d.format('YYYY-MM-DD')}` : '',
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
      // keep Dayjs objects to avoid implicit timezone shifts when serialized
      startDate: start.clone(),
      endDate: start.add(numDaysInWeek - 1, 'day').clone(),
      days,
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
    const currentDate = selectedDate || startingDate || new Date();

    // Clear cache when rebuilding the carousel to avoid stale weeks
    weekCacheRef.current.clear();

    const weekStart = getWeekStart(currentDate);

    const weeks = [];

    if (!scrollable) {
      // Only generate the current week when not scrollable
      const week = getCachedWeek(weekStart);
      weeks.push(week);
    } else {
      // Generate window of weeks around the active date
      for (let i = -weekBuffer; i <= weekBuffer; i++) {
        const start = weekStart.add(i * numDaysInWeek, 'day');
        const week = getCachedWeek(start);
        weeks.push(week);
      }
    }

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
    return initCarousel();
  });

  useEffect(() => {
    if (isShiftingRef.current) {
      // Ignore interim week array changes triggered by shift; the correct week
      // will be emitted via onViewableItemsChanged after scrolling settles.
      return;
    }
    const centerWeek = weeks[CENTER_INDEX];

    if (centerWeek) {
      const weekKey = `${dayjs(centerWeek.startDate).format('YYYY-MM-DD')}_${dayjs(centerWeek.endDate).format('YYYY-MM-DD')}`;

      // Invoke callback only if week actually changed and skip initial mount
      if (currentWeekRef.current !== weekKey) {
        if (!skipInitialRef.current && onWeekChanged) {
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
    
    if (selectedDate && !dayjs(selectedDate).isSame(dayjs(activeDate), 'day')) {
      setActiveDate(selectedDate);
      
      // Check if selectedDate is in current window
      const targetWeekStart = getWeekStart(selectedDate);
      
      const isInWindow = weeks.some(week => {
        const weekStart = getWeekStart(week.startDate);
        const match = weekStart.isSame(targetWeekStart, 'day');
        return match;
      });
      
      
      if (!isInWindow) {
        didInitialCenterRef.current = false; // allow next layout effect to recenter
        const newWeeks = initCarousel();
        setWeeks(newWeeks);
        // Ensure re-center after new data applied (next frame)
        InteractionManager.runAfterInteractions(reCenter);

      } else if (scrollable) {
        // Selected date is already in the week buffer – scroll to its week so it becomes visible.
        const targetIdx = weeks.findIndex(week =>
          getWeekStart(week.startDate).isSame(targetWeekStart, 'day')
        );
        if (targetIdx !== -1) {
          requestAnimationFrame(() => {
            flatListRef.current?.scrollToIndex({ index: targetIdx, animated: scrollerPaging });
          });
        }
      }
    }
  }, [selectedDate, activeDate, weeks, getWeekStart, initCarousel, reCenter, scrollable, scrollerPaging]);

  // Initial centering once layout is calculated
  useLayoutEffect(() => {
    if (!didInitialCenterRef.current && scrollerPaging) {
      reCenter();
      didInitialCenterRef.current = true;
    }

    if (onRenderComplete && startTimeRef.current) {
      const end =
        typeof performance !== 'undefined' && performance.now
          ? performance.now()
          : Date.now();
      onRenderComplete(end - startTimeRef.current);
    }
  }, [viewWidth, scrollerPaging, onRenderComplete]);

  useLayoutEffect(() => {
    if (isShiftingRef.current) {
      flushCompensation();   // **즉시** 오프셋 보정
    }
  }, [weeks]);               // weeks 가 바뀔 때마다

  // True Carousel: Real-time scroll threshold detection
  const isShiftingRef = useRef(false);
  const pendingShiftRef = useRef([]);
  const lastOffsetRef = useRef(0);
  // Latest usable content width (excludes selectors) and pending compensation
  const contentWidthRef = useRef(0);
  const pendingDeltaRef = useRef(0);
  
  const shiftLeft = useCallback(() => {
    if (isShiftingRef.current) {
      pendingShiftRef.current.push('left');
      return false;
    }
    isShiftingRef.current = true;

    let addedCount = 0;
    setWeeks(currentWeeks => {
      let weeksToAdd = [];
      let cursorStart = getWeekStart(currentWeeks[0].startDate);

      for (let i = 0; i < SHIFT_SIZE; i++) {
        const candidateStart = cursorStart.subtract(numDaysInWeek, 'day');
        const candidateEnd = candidateStart.add(numDaysInWeek - 1, 'day');

        if (minDate && candidateEnd.isBefore(dayjs(minDate), 'day')) {
          break; // stop at boundary
        }

        weeksToAdd.push(getCachedWeek(candidateStart));
        cursorStart = candidateStart;
        addedCount += 1;
      }

      if (addedCount === 0) {
        return currentWeeks; // nothing added
      }

      weeksToAdd.reverse(); // maintain chronological order
      return [...weeksToAdd, ...currentWeeks.slice(0, WINDOW_SIZE - addedCount)];
    });

    queueCompensation(addedCount);
     return true;
  }, [
    getCachedWeek,
    getWeekStart,
    numDaysInWeek,
    minDate,
    WINDOW_SIZE,
    weekBuffer,
    SHIFT_SIZE,
    queueCompensation,
  ]);

  const shiftRight = useCallback(() => {
    if (isShiftingRef.current) {
      pendingShiftRef.current.push('right');
      return false;
    }
    isShiftingRef.current = true;

    let addedCount = 0;
    setWeeks(currentWeeks => {
      let weeksToAdd = [];
      let cursorStart = getWeekStart(currentWeeks[currentWeeks.length - 1].startDate);

      for (let i = 0; i < SHIFT_SIZE; i++) {
        const candidateStart = cursorStart.add(numDaysInWeek, 'day');

        if (maxDate && dayjs(candidateStart).isAfter(dayjs(maxDate), 'day')) {
          break; // boundary hit
        }

        weeksToAdd.push(getCachedWeek(candidateStart));
        cursorStart = candidateStart;
        addedCount += 1;
      }

      if (addedCount === 0) {
        return currentWeeks;
      }

      return [...currentWeeks.slice(addedCount), ...weeksToAdd];
    });

    queueCompensation(-addedCount);
    // isShiftingRef will be cleared inside rAF
    return true;
  }, [
    getCachedWeek,
    getWeekStart,
    numDaysInWeek,
    maxDate,
    WINDOW_SIZE,
    weekBuffer,
    SHIFT_SIZE,
    queueCompensation,
  ]);

  // Edge detection for rubber-band overscroll
  const edgeShiftHandledRef = useRef(false);

  const onScrollEnd = useCallback(
    (event) => {
      const rawX = event.nativeEvent.contentOffset.x;
      const w = contentWidthRef.current;
      if (!w) return;

      const maxX = (WINDOW_SIZE - 1) * w;

      // Determine which logical page we're on.
      let page;
      if (rawX < 0) {
        page = 0;
      } else if (rawX > maxX) {
        page = WINDOW_SIZE - 1;
      } else {
        page = Math.floor((rawX + w / 2) / w);
      }

      const snappedOffset = page * w;
      lastOffsetRef.current = snappedOffset;

      // Reset edge guard when back in the middle
      if (page === CENTER_INDEX) {
        edgeShiftHandledRef.current = false;
      }

      // If a shift animation is still in progress, flush pending queue.
      if (isShiftingRef.current) {
        if (page === CENTER_INDEX) {
          isShiftingRef.current = false;
          const next = pendingShiftRef.current.shift();
          if (next === 'left') shiftLeft();
          else if (next === 'right') shiftRight();
        }
        return;
      }

      // Edge shift – allow only once until user scrolls back into window
      if (page === 0) {
        if (!edgeShiftHandledRef.current) {
          edgeShiftHandledRef.current = true;
          shiftLeft();
        }
      } else if (page === WINDOW_SIZE - 1) {
        if (!edgeShiftHandledRef.current) {
          edgeShiftHandledRef.current = true;
          shiftRight();
        }
      }
    },
    [WINDOW_SIZE, shiftLeft, shiftRight],
  );

  // Live scroll offset logger
  const onScroll = useCallback(event => {
    const offsetX = event.nativeEvent.contentOffset.x;
    lastOffsetRef.current = offsetX; // keep ref in sync
  }, []);

  // flush pending compensation using latest width
  const flushCompensation = useCallback(() => {
    const k = pendingDeltaRef.current;
    if (!k) return;
    pendingDeltaRef.current = 0;

    const w = contentWidthRef.current;
    if (w <= 0) return;

    const maxOffset = (WINDOW_SIZE - 1) * w;
    let newOffset = lastOffsetRef.current + k * w;
    newOffset = Math.round(newOffset / w) * w;
    newOffset = Math.max(0, Math.min(newOffset, maxOffset));

    lastOffsetRef.current = newOffset;
    flatListRef.current?.scrollToOffset({ offset: newOffset, animated: false });
    isShiftingRef.current = false;
  }, [WINDOW_SIZE]);

  // queue compensation and ensure a flush next frame
  const queueCompensation = useCallback((deltaK) => {
    if (deltaK === 0) return;
    pendingDeltaRef.current += deltaK;
    requestAnimationFrame(flushCompensation);
  }, [flushCompensation]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    // Prevent spurious callbacks when the carousel internally shifts its window
    // (e.g. the user hits the edge and we prepend/append weeks). At that time
    // `viewableItems` changes even though the user hasn’t explicitly scrolled
    // to a new week yet. We simply ignore those interim events; once the
    // compensation completes and `isShiftingRef` is cleared, the next
    // viewability change (triggered by real user interaction) will fire the
    // correct callbacks.
    if (isShiftingRef.current) {
      return;
    }
    if (!viewableItems || viewableItems.length === 0) {
      return;
    }

    // Compute the item whose center is nearest to viewport center
    // Viewport center X in list coordinates
    const viewportCenterX = lastOffsetRef.current + contentWidthRef.current / 2;

    let closestIdx = null;
    let minDistance = Number.MAX_VALUE;

    viewableItems.forEach(v => {
      if (typeof v.index !== 'number') return;
      const itemCenterX = (v.index + 0.5) * contentWidthRef.current;
      const dist = Math.abs(itemCenterX - viewportCenterX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = v.index;
      }
    });

    if (closestIdx == null) return;

    const centerWeek = weeks[closestIdx];

    if (!centerWeek) return;

    const weekKey = `${dayjs(centerWeek.startDate).format('YYYY-MM-DD')}_${dayjs(centerWeek.endDate).format('YYYY-MM-DD')}`;

    // Avoid redundant callbacks if week hasn't changed
    if (currentWeekRef.current !== weekKey) {
      if (onWeekChanged) {
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
  }, [weeks, numDaysInWeek, onWeekChanged, updateMonthYear, contentWidthRef]);

  // Imperative methods
  React.useImperativeHandle(calendarRef, () => {
    const handleScrollToDate = (date) => {
      setActiveDate(date);

      // Rebuild carousel around new date
      didInitialCenterRef.current = false; // allow next layout effect to recenter
      const newWeeks = initCarousel();
      setWeeks(newWeeks);
      // Ensure re-center after new data applied (next frame)
      InteractionManager.runAfterInteractions(reCenter);

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
    
    const dateObj = dayjs(date);
    if (minDate && dateObj.isBefore(dayjs(minDate), 'day')) {
      return;
    }
    if (maxDate && dateObj.isAfter(dayjs(maxDate), 'day')) {
      return;
    }

    setActiveDate(dateObj);

    if (onDateSelected) {
      onDateSelected(dateObj);
    }
  }, [onDateSelected, minDate, maxDate]);

  // Layout handlers
  const onLayout = useCallback(event => {
    const { width } = event.nativeEvent.layout;
    setViewWidth(width);
  }, []);

  const onLeftLayout = useCallback(e => {
    setLeftWidth(e.nativeEvent.layout.width);
    requestAnimationFrame(flushCompensation);
  }, [flushCompensation]);

  const onRightLayout = useCallback(e => {
    setRightWidth(e.nativeEvent.layout.width);
    requestAnimationFrame(flushCompensation);
  }, [flushCompensation]);

  const contentWidth = Math.max(viewWidth - leftWidth - rightWidth, 0);

  const prevContentWidthRef = useRef(0);

  // keep width ref updated and fix offset drift when width changes
  useEffect(() => {
    contentWidthRef.current = contentWidth;

    const newWidth = contentWidth;
    const prevWidth = prevContentWidthRef.current;

    if (newWidth > 0 && prevWidth > 0 &&
       newWidth !== prevWidth &&
       pendingDeltaRef.current === 0
     ) {
      const page = prevWidth > 0 ? Math.round(lastOffsetRef.current / prevWidth) : 0;
      const corrected = page * newWidth;

      if (Math.abs(corrected - lastOffsetRef.current) > 1) {
        lastOffsetRef.current = corrected;
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToOffset({ offset: corrected, animated: false });
        });
      }

      prevContentWidthRef.current = newWidth;
    }
  }, [contentWidth]);

  // Render week
  const renderWeek = useCallback(({ item: week }) => {
    return (
      <View style={[styles.week, { width: contentWidth }]}>
        {week.days.map(day => (
          <CalendarDateItem
            key={day.dateString + (dayjs(day.date).isSame(dayjs(activeDate), 'day') ? '-active' : '')}
            date={day.date}
            dateNumber={day.dayOfMonth}
            dayName={upperCaseDays ? day.dayNameUpper : day.dayName}
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

  const keyExtractor = useCallback(
    week => (week.startDate && week.startDate.format ? week.startDate.format('YYYY-MM-DD') : String(week.epochStart || '')),
    []
  );

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

  // Lightweight logger wrapper – disabled unless `debug` prop is true in dev
  const log = (__DEV__ && debug) ? logger.debug : () => {};

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
            // extraData={activeDate} // force re-render on active date change
            horizontal
            pagingEnabled={scrollerPaging}
            showsHorizontalScrollIndicator={false}
            getItemLayout={getItemLayout}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={onScrollEnd}
            onScrollEndDrag={onScrollEnd}
            viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
            initialScrollIndex={CENTER_INDEX}
            {...(!useFlashList
              ? {
                  maintainVisibleContentPosition: {
                    // keep at least the first half of buffer in view before auto-shift triggers
                    minIndexForVisible: Math.floor(weekBuffer / 2),
                  },
                }
              : {})}
            {...(useFlashList && flashListEstimatedItemSize
              ? { estimatedItemSize: flashListEstimatedItemSize }
              : {})}
          />
        ) : (
          <View style={[styles.week, { width: contentWidth }]}>
            {weeks[CENTER_INDEX]?.days.map(day => (
              <CalendarDateItem
                key={day.dateString + (dayjs(day.date).isSame(dayjs(activeDate), 'day') ? '-active' : '')}
                date={day.date}
                dateNumber={day.dayOfMonth}
                dayName={upperCaseDays ? day.dayNameUpper : day.dayName}
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
});

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
  ]),
  debug: PropTypes.bool,
};

CalendarStrip.defaultProps = {
  selectedDate: dayjs(),
  startingDate: dayjs(),
  minDate: dayjs('2022-01-01'),
  maxDate: undefined,
  useIsoWeekday: false,
  numDaysInWeek: 7,
  scrollable: true,
  scrollerPaging: true,
  weekBuffer: 3,
  useFlashList: true,
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
  calendarRef: undefined,
  debug: false,
};

export default CalendarStrip;
