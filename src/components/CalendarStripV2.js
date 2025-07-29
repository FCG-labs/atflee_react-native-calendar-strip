import React, { forwardRef, useCallback, useMemo, useRef, useState, useEffect, useLayoutEffect, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Platform,
  UIManager,
  LayoutAnimation,
  InteractionManager,
} from 'react-native';
import dayjs from '../dayjs';
// Fix import path to match the actual file location
import CalendarHeader from '../CalendarHeader';
import CalendarDateItem from './CalendarDateItem';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * CalendarStripV2 - Performance optimized version using stable props and memoization
 * 
 * Key optimizations over V1:
 * - Stable props references with useMemo/useCallback to prevent unnecessary renders
 * - More granular memoization of sub-components and functions
 * - Direct dayjs usage without intermediate state where possible
 * - Cleaner separation of concerns between data, UI, and callbacks
 */
const CalendarStripV2 = forwardRef(function CalendarStripV2(
  props,
  ref
) {
  // Extract all props with defaults to avoid undefined checks later
  const {
    selectedDate,
    startingDate,
    minDate,
    maxDate,
    useIsoWeekday = false,
    numDaysInWeek = 7,
    scrollable = true,
    scrollerPaging = true,
    weekBuffer = 3,
    debug = false,
    // header
    showMonth = true,
    calendarHeaderFormat = 'MMMM YYYY',
    calendarHeaderPosition = 'top',
    calendarHeaderStyle = {},
    // styling
    style = {},
    innerStyle = {},
    calendarColor = '#fff',
    highlightColor = '#000',
    dateNameStyle = {},
    dateNumberStyle = {},
    highlightDateNameStyle = {},
    highlightDateNumberStyle = {},
    dayContainerStyle = {},
    disabledDateOpacity = 0.3,
    styleWeekend = false,
    // display
    showDayName = true,
    showDayNumber = true,
    upperCaseDays = false,
    allowDayTextScaling = true,
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
    markedDates = [],
    markedDatesStyle = {},
    markerComponent,
    // @ts-ignore - flashlist support
    useFlashList = false,
    flashListEstimatedItemSize,
  } = props;
  
  // Performance tracking
  const renderStartTime = useRef(Date.now());
  const isInitialRender = useRef(true);
  
  // Refs for FlatList and tracking
  const listRef = useRef(null);
  const currentIndexRef = useRef(null);
  const visibleWeekRef = useRef(null);
  const userScrollingRef = useRef(false);
  const isScrollingRef = useRef(false);
  const scrollPosRef = useRef(0);
  const isMountedRef = useRef(true);

  // Weekly data generation and caching
  const weekCacheRef = useRef(new Map());

  // -- DATE UTILITIES --
  
  // Generate a week's data starting from a date
  const generateWeek = useCallback((startDate) => {
    const start = dayjs(startDate);
    const today = dayjs();
    const days = [];
    
    for (let i = 0; i < numDaysInWeek; i++) {
      const d = start.add(i, 'day');
      const epoch = d.valueOf();
      const dayName = d.format('ddd');
      const dateObj = new Date(epoch);
      const dateString = d.format('YYYY-MM-DD');
      
      // Check if date is disabled (outside min/max range)
      const isDisabled = 
        (minDate && d.isBefore(dayjs(minDate), 'day')) || 
        (maxDate && d.isAfter(dayjs(maxDate), 'day'));
      
      days.push({
        date: dateObj,
        epoch,
        dateString,
        dayName,
        dayNameUpper: dayName.toUpperCase(),
        dayOfWeek: d.day(),
        dayOfMonth: d.date(),
        month: d.month(),
        year: d.year(),
        isToday: d.isSame(today, 'day'),
        isCurrentMonth: d.month() === today.month() && d.year() === today.year(),
        isDisabled,
      });
    }
    
    return {
      id: start.format('YYYY-MM-DD'),
      startDate: start.clone(),
      endDate: start.add(numDaysInWeek - 1, 'day').clone(),
      days,
    };
  }, [numDaysInWeek, minDate, maxDate]);

  // Get the start date of a week containing the given date
  const getWeekStart = useCallback((date) => {
    const d = dayjs(date);
    return useIsoWeekday ? d.startOf('isoWeek') : d.startOf('week');
  }, [useIsoWeekday]);

  // Get a week from cache or generate if not cached
  const getCachedWeek = useCallback((startDate) => {
    const key = dayjs(startDate).startOf('day').format('YYYY-MM-DD');
    const cached = weekCacheRef.current.get(key);
    if (cached) return cached;
    
    const week = generateWeek(startDate);
    weekCacheRef.current.set(key, week);
    return week;
  }, [generateWeek]);

  // Initialize carousel weeks around a target date
  const initCarousel = useCallback((targetDate = null) => {
    const currentDate = targetDate || selectedDate || startingDate || new Date();
    const weekStart = getWeekStart(currentDate);
    const carouselWeeks = [];
    
    if (!scrollable) {
      carouselWeeks.push(getCachedWeek(weekStart));
    } else {
      // Generate weeks around the current date based on buffer
      for (let i = -weekBuffer; i <= weekBuffer; i++) {
        const start = weekStart.add(i * numDaysInWeek, 'day');
        carouselWeeks.push(getCachedWeek(start));
      }
    }
    
    if (debug) {
      console.log('[CalendarStripV2] Initialized carousel with', carouselWeeks.length, 'weeks');
    }
    
    return carouselWeeks;
  }, [selectedDate, startingDate, getWeekStart, getCachedWeek, numDaysInWeek, weekBuffer, scrollable, debug])

  // Core state - initialized once and updated only when necessary
  const [activeDate, setActiveDate] = useState(() => dayjs(selectedDate || startingDate || new Date()));
  const [weeks, setWeeks] = useState(() => initCarousel());
  const [viewWidth, setViewWidth] = useState(() => Dimensions.get('window').width);
  const [leftWidth, setLeftWidth] = useState(0);
  const [rightWidth, setRightWidth] = useState(0);
  
  // Derived state - computed from core state
  const contentWidth = useMemo(() => 
    Math.max(viewWidth - leftWidth - rightWidth, 1), 
    [viewWidth, leftWidth, rightWidth]
  );
  
  // Center index is the middle of the buffer for scrolling
  const centerIndex = useMemo(() => 
    Math.floor(weeks.length / 2), 
    [weeks.length]
  );
  
  // Generate keys for optimal rendering
  const weekKeys = useMemo(() => 
    weeks.map(week => week.startDate.format('YYYY-MM-DD')),
    [weeks]
  );

  // -- LAYOUT HANDLERS --

  // Main container layout handler
  const onLayout = useCallback(event => {
    const { width } = event.nativeEvent.layout;
    setViewWidth(width);
    if (debug) {
      console.log('[CalendarStripV2] Container width:', width);
    }
  }, [debug]);
  
  // Layout handlers for selector elements
  const onLeftLayout = useCallback(e => {
    setLeftWidth(e.nativeEvent.layout.width);
  }, []);
  
  const onRightLayout = useCallback(e => {
    setRightWidth(e.nativeEvent.layout.width);
  }, []);
  
  // Get item dimensions for FlatList optimization
  const getItemLayout = useCallback((data, index) => ({
    length: contentWidth,
    offset: contentWidth * index,
    index,
  }), [contentWidth]);
  
  // -- SCROLL AND SELECTION HANDLERS --
  
  // Handler for date selection - validates against min/max range
  const handleDateSelection = useCallback(date => {
    // Defensive check for null, undefined or invalid date
    if (!date) {
      if (debug) console.log('[CalendarStripV2] Invalid date provided:', date);
      return;
    }
    
    // Safely convert to dayjs object with validation
    const d = dayjs(date);
    if (!d.isValid()) {
      if (debug) console.log('[CalendarStripV2] Invalid date format:', date);
      return;
    }
    
    // Validate date range
    if (minDate && d.isBefore(dayjs(minDate), 'day')) {
      if (debug) console.log('[CalendarStripV2] Date before min range:', d.format('YYYY-MM-DD'));
      return;
    }
    
    if (maxDate && d.isAfter(dayjs(maxDate), 'day')) {
      if (debug) console.log('[CalendarStripV2] Date after max range:', d.format('YYYY-MM-DD'));
      return;
    }
    
    // Update active date and notify parent
    setActiveDate(d);
    if (onDateSelected) {
      onDateSelected(d);
    }
    
    // If date is outside current visible weeks, re-center calendar
    const weekStart = getWeekStart(d);
    const weekId = weekStart.format('YYYY-MM-DD');
    const weekIndex = weeks.findIndex(w => w.id === weekId);
    
    if (weekIndex === -1) {
      // Date not in current weeks, reinitialize carousel
      const newWeeks = initCarousel(d);
      setWeeks(newWeeks);
      // Will auto-center in useLayoutEffect
    } else if (weekIndex !== currentIndexRef.current) {
      // Week is in carousel but not centered, scroll to it
      if (listRef.current && scrollerPaging) {
        listRef.current.scrollToIndex({ 
          index: weekIndex, 
          animated: true 
        });
      }
    }
  }, [minDate, maxDate, onDateSelected, getWeekStart, weeks, initCarousel, scrollerPaging, debug]);
  
  // Handle scroll events to determine which week is visible
  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (!viewableItems || viewableItems.length === 0 || !isMountedRef.current) return;
    
    const item = viewableItems[0];
    const idx = item?.index;
    if (idx == null) return;
    
    // Update refs to track currently visible week
    currentIndexRef.current = idx;
    const week = weeks[idx];
    const weekId = week?.id;
    
    // Don't trigger callbacks if it's the same week
    if (weekId === visibleWeekRef.current) return;
    visibleWeekRef.current = weekId;
    
    // Notify parent components of week change
    if (onWeekChanged && week) {
      onWeekChanged(week.startDate, week.endDate);
    }
    
    // Update month/year in parent if needed
    if (updateMonthYear && week) {
      // Use middle day of week for month/year
      const midWeekDay = week.startDate.add(Math.floor(numDaysInWeek/2), 'day');
      updateMonthYear(midWeekDay.format('MM'), midWeekDay.format('YYYY'));
    }
    
    // Debug log
    if (debug) {
      console.log('[CalendarStripV2] Week changed:', weekId, 'at index', idx);
    }
  }, [weeks, onWeekChanged, updateMonthYear, numDaysInWeek, debug]);
  
  // Configure when items are considered viewable
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50, // Item is considered visible when 50% or more is visible
    minimumViewTime: 10, // Must be visible for at least 10ms
  }), []);
  
  // Load more weeks when nearing the end of the carousel
  const handleMomentumScrollEnd = useCallback((event) => {
    if (!scrollable || !isMountedRef.current) return;
    
    const { contentOffset, contentSize } = event.nativeEvent;
    const currentX = contentOffset.x;
    scrollPosRef.current = currentX;
    
    const currentIndex = Math.floor(currentX / contentWidth);
    if (currentIndex === currentIndexRef.current) return;
    
    // Check if we're near the beginning or end of the carousel
    const isNearStart = currentIndex <= weekBuffer;
    const isNearEnd = currentIndex >= weeks.length - weekBuffer - 1;
    
    if (isNearStart || isNearEnd) {
      const currentWeek = weeks[currentIndex];
      if (!currentWeek) return;
      
      // Generate new weeks to add to appropriate end
      const newWeeks = [...weeks];
      
      if (isNearStart) {
        // Add weeks to the beginning
        const firstWeekStart = dayjs(weeks[0].startDate);
        for (let i = 1; i <= weekBuffer; i++) {
          const start = firstWeekStart.subtract(i * numDaysInWeek, 'day');
          newWeeks.unshift(getCachedWeek(start));
        }
        
        // Adjust scroll position to maintain the same week in view
        const adjustmentIndex = weekBuffer;
        currentIndexRef.current = currentIndex + adjustmentIndex;
        
        // Update state and handle scroll compensation
        setWeeks(newWeeks);
        setTimeout(() => {
          if (listRef.current && isMountedRef.current) {
            // Scroll to maintain visual position
            listRef.current.scrollToIndex({
              index: currentIndex + adjustmentIndex,
              animated: false
            });
          }
        }, 10);
      } 
      
      if (isNearEnd) {
        // Add weeks to the end
        const lastWeekStart = dayjs(weeks[weeks.length - 1].startDate);
        for (let i = 1; i <= weekBuffer; i++) {
          const start = lastWeekStart.add(i * numDaysInWeek, 'day');
          newWeeks.push(getCachedWeek(start));
        }
        
        // Just update state, no need to adjust scroll
        setWeeks(newWeeks);
      }
      
      if (debug) {
        console.log('[CalendarStripV2] Added weeks, now at', newWeeks.length, 'weeks');
      }
    }
    
    // Update current index
    currentIndexRef.current = currentIndex;
    isScrollingRef.current = false;
  }, [weeks, weekBuffer, contentWidth, scrollable, numDaysInWeek, getCachedWeek, debug]);
  
  // Track when user starts scrolling
  const handleScrollBeginDrag = useCallback(() => {
    userScrollingRef.current = true;
    isScrollingRef.current = true;
  }, []);
  
  // Track when user ends scrolling
  const handleScrollEndDrag = useCallback((event) => {
    userScrollingRef.current = false;
    
    // Only handle momentum scroll end if paging is disabled
    if (!scrollerPaging) {
      handleMomentumScrollEnd(event);
    }
  }, [handleMomentumScrollEnd, scrollerPaging]);

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

// Center initial week function
const reCenter = useCallback(() => {
  if (listRef.current && scrollerPaging) {
    listRef.current.scrollToIndex({ index: centerIndex, animated: false });
  }
}, [centerIndex, scrollerPaging]);

useLayoutEffect(() => {
  reCenter();
  visibleWeekRef.current = weeks[centerIndex]?.startDate.format('YYYY-MM-DD');
  if (onRenderComplete) onRenderComplete();
  
  // Enable Android layout animation
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
  
  return () => {
    isMountedRef.current = false;
  };
}, [weeks, reCenter, centerIndex, onRenderComplete]);

// Handle external selectedDate changes
useEffect(() => {
  if (selectedDate && !dayjs(selectedDate).isSame(activeDate, 'day')) {
    handleDateSelection(selectedDate);
  }
}, [selectedDate, activeDate, handleDateSelection]);

// Initial setup effect
useEffect(() => {
  const initialSetup = () => {
    // Ensure we start with the user-specified active date
    if (isInitialRender.current) {
      isInitialRender.current = false;
      
      // If user provided a specific date, scroll to it
      if (selectedDate || startingDate) {
        InteractionManager.runAfterInteractions(() => {
          if (isMountedRef.current && listRef.current) {
            reCenter();
          }
        });
      }
    }
  };
  
  initialSetup();
}, []);

// Imperative methods
useImperativeHandle(ref, () => ({
  jumpToDate: date => {
    handleDateSelection(date);
  },
  scrollToDate: date => {
    handleDateSelection(date);
  },
  getSelectedDate: () => activeDate.toDate(),
  goToNextWeek: () => {
    const nextDate = dayjs(activeDate).add(numDaysInWeek, 'day');
    handleDateSelection(nextDate);
  },
  goToPreviousWeek: () => {
    const prevDate = dayjs(activeDate).subtract(numDaysInWeek, 'day');
    handleDateSelection(prevDate);
  },
  getCurrentWeek: () => weeks[currentIndexRef.current || centerIndex],
  getWeeks: () => weeks,
  getCurrentWeekIndex: () => currentIndexRef.current || centerIndex,
}), [activeDate, weeks, numDaysInWeek, centerIndex, handleDateSelection]);

// We're now using only the standard React forwardRef pattern for exposing methods

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
            ref={listRef}
            initialScrollIndex={centerIndex}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={handleViewableItemsChanged}
            data={weeks}
            horizontal
            pagingEnabled={scrollerPaging}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(week) => week.id}
            renderItem={renderWeek}
            extraData={dayjs(activeDate).valueOf()}
            getItemLayout={getItemLayout}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            scrollEnabled={scrollable}
            testID="calendar_strip_flatlist"
            scrollEventThrottle={16}
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
