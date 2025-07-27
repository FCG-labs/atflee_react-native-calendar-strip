import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Platform,
  LayoutAnimation,
  UIManager
} from 'react-native';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

// Initialize dayjs plugins
dayjs.extend(isoWeek);

// Components
import CalendarHeader from '../CalendarHeader';
import CalendarDateItem from './CalendarDateItem';

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
  
  // Header configuration
  showMonth,
  calendarHeaderFormat,
  calendarHeaderPosition,
  calendarHeaderStyle,
  
  // Styling
  style,
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
  // Carousel constants - 3 items: [prev, current, next]
  const WINDOW_SIZE = 3;
  const CENTER_INDEX = 1;

  // FlatList reference
  const flatListRef = useRef(null);

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
        isCurrentMonth: date.month() === today.month()
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

  // Initialize carousel window
  const initCarousel = useCallback(() => {
    if (__DEV__) {
      console.log('[INIT] Creating carousel window');
    }
    const currentDate = selectedDate || startingDate || new Date();
    if (__DEV__) {
      console.log('[INIT] Current date:', dayjs(currentDate).format('YYYY-MM-DD'));
    }
    
    const weekStart = getWeekStart(currentDate);
    if (__DEV__) {
      console.log('[INIT] Week start:', weekStart.format('YYYY-MM-DD'));
    }
    
    const weeks = [];
    
    // Generate 3 weeks: 1 before, current, 1 after
    for (let i = -1; i <= 1; i++) {
      const start = weekStart.add(i * numDaysInWeek, 'day');
      const week = generateWeek(start);
      if (__DEV__) {
        console.log(`[INIT] Week ${i + 1}:`, dayjs(week.startDate).format('YYYY-MM-DD'), 'to', dayjs(week.endDate).format('YYYY-MM-DD'));
      }
      weeks.push(week);
    }
    
    if (__DEV__) {
      console.log('[INIT] Created', weeks.length, 'weeks');
    }
    return weeks;
  }, [selectedDate, startingDate, getWeekStart, generateWeek, numDaysInWeek]);

  // State - Fixed carousel window
  const [weeks, setWeeks] = useState(() => {
    if (__DEV__) {
      console.log('[STATE] Initializing weeks state');
    }
    return initCarousel();
  });
  const [activeDate, setActiveDate] = useState(() => {
    const date = selectedDate || startingDate || new Date();
    if (__DEV__) {
      console.log('[STATE] Initial active date:', dayjs(date).format('YYYY-MM-DD'));
    }
    return date;
  });
  const [viewWidth, setViewWidth] = useState(Dimensions.get('window').width);
  const [leftWidth, setLeftWidth] = useState(0);
  const [rightWidth, setRightWidth] = useState(0);

  // Handle selectedDate changes
  useEffect(() => {
    if (__DEV__) {
      console.log('[EFFECT] selectedDate changed:', selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : 'null');
      console.log('[EFFECT] activeDate:', dayjs(activeDate).format('YYYY-MM-DD'));
    }
    
    if (selectedDate && !dayjs(selectedDate).isSame(dayjs(activeDate), 'day')) {
      if (__DEV__) {
        console.log('[EFFECT] Setting new active date');
      }
      setActiveDate(selectedDate);
      
      // Check if selectedDate is in current window
      const targetWeekStart = getWeekStart(selectedDate);
      if (__DEV__) {
        console.log('[EFFECT] Target week start:', targetWeekStart.format('YYYY-MM-DD'));
      }
      
      const isInWindow = weeks.some(week => {
        const weekStart = getWeekStart(week.startDate);
        const match = weekStart.isSame(targetWeekStart, 'day');
        if (__DEV__) {
          console.log('[EFFECT] Checking week:', weekStart.format('YYYY-MM-DD'), 'matches:', match);
        }
        return match;
      });
      
      if (__DEV__) {
        console.log('[EFFECT] Is in current window:', isInWindow);
      }
      
      if (!isInWindow) {
        if (__DEV__) {
          console.log('[EFFECT] Rebuilding carousel around selected date');
        }
        const newWeeks = initCarousel();
        setWeeks(newWeeks);
      }
      
      // Always scroll to center
      if (__DEV__) {
        console.log('[EFFECT] Scrolling to center index:', CENTER_INDEX);
      }
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: CENTER_INDEX, animated: true });
        }
      }, 100);
    }
  }, [selectedDate, activeDate, weeks, getWeekStart, initCarousel]);

  // True Carousel: Real-time scroll threshold detection
  const isShiftingRef = useRef(false);
  
  const shiftLeft = useCallback(() => {
    if (isShiftingRef.current) return false;
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
      const newWeek = generateWeek(prevWeekStart);
      return [newWeek, ...currentWeeks.slice(0, WINDOW_SIZE - 1)];
    });

    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: CENTER_INDEX, animated: false });
      isShiftingRef.current = false;
    }, 0);

    return shifted;
  }, [generateWeek, getWeekStart, numDaysInWeek, minDate, WINDOW_SIZE]);

  const shiftRight = useCallback(() => {
    if (isShiftingRef.current) return false;
    isShiftingRef.current = true;

    let shifted = false;
    setWeeks(currentWeeks => {
      const lastWeek = currentWeeks[currentWeeks.length - 1];
      const nextWeekStart = getWeekStart(lastWeek.startDate).add(numDaysInWeek, 'day');

      if (maxDate && dayjs(nextWeekStart).isAfter(dayjs(maxDate), 'day')) {
        return currentWeeks;
      }

      shifted = true;
      const newWeek = generateWeek(nextWeekStart);
      return [...currentWeeks.slice(1), newWeek];
    });

    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: CENTER_INDEX, animated: false });
      isShiftingRef.current = false;
    }, 0);

    return shifted;
  }, [generateWeek, getWeekStart, numDaysInWeek, maxDate, WINDOW_SIZE]);

  const onScroll = useCallback((event) => {
    const currentOffset = event.nativeEvent.contentOffset.x;
    const itemWidth = contentWidth;
    const threshold = itemWidth * 0.3; // 30% threshold for instant response
    if (__DEV__) {
      console.log('[CAROUSEL] Scroll offset:', currentOffset, 'Threshold:', threshold);
    }

    // Left threshold: user scrolled 30% into previous week
    if (currentOffset < threshold) {
      if (__DEV__) {
        console.log('[CAROUSEL] Left threshold reached - instant shift');
      }
      shiftLeft();
    }
    // Right threshold: user scrolled 30% into next week
    else if (currentOffset > itemWidth * 2 - threshold) {
      if (__DEV__) {
        console.log('[CAROUSEL] Right threshold reached - instant shift');
      }
      shiftRight();
    }
  }, [contentWidth, shiftLeft, shiftRight]);

  
  // Simplified viewable items handler - just for callbacks
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    const centerWeek = weeks[CENTER_INDEX];
    if (centerWeek && onWeekChanged) {
      onWeekChanged(centerWeek.startDate, centerWeek.endDate);
    }
    
    if (centerWeek && updateMonthYear) {
      const middleDate = dayjs(centerWeek.startDate).add(Math.floor(numDaysInWeek / 2), 'day');
      updateMonthYear(middleDate);
    }
  }, [weeks, onWeekChanged, updateMonthYear, numDaysInWeek, CENTER_INDEX]);

  // Imperative methods
  React.useImperativeHandle(calendarRef, () => ({
    scrollToDate: (date) => {
      setActiveDate(date);
      
      // Rebuild carousel around new date
      const newWeeks = initCarousel();
      setWeeks(newWeeks);
      
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: CENTER_INDEX, animated: true });
        }
      }, 100);
    },
    getSelectedDate: () => activeDate,
    goToNextWeek: () => {
      const centerWeek = weeks[CENTER_INDEX];
      if (centerWeek) {
        const nextWeekStart = getWeekStart(centerWeek.startDate).add(numDaysInWeek, 'day');
        if (shiftRight()) {
          setActiveDate(nextWeekStart.toDate());
        }
      }
    },
    goToPreviousWeek: () => {
      const centerWeek = weeks[CENTER_INDEX];
      if (centerWeek) {
        const prevWeekStart = getWeekStart(centerWeek.startDate).subtract(numDaysInWeek, 'day');
        if (shiftLeft()) {
          setActiveDate(prevWeekStart.toDate());
        }
      }
    }
  }));

  // Date selection handler
  const handleDateSelection = useCallback(date => {
    if (__DEV__) {
      console.log('[DATE] Date selected:', dayjs(date).format('YYYY-MM-DD'));
    }
    
    const dateObj = dayjs(date);
    if (minDate && dateObj.isBefore(dayjs(minDate), 'day')) {
      if (__DEV__) {
        console.log('[DATE] Date before minDate, ignoring');
      }
      return;
    }
    if (maxDate && dateObj.isAfter(dayjs(maxDate), 'day')) {
      if (__DEV__) {
        console.log('[DATE] Date after maxDate, ignoring');
      }
      return;
    }

    if (__DEV__) {
      console.log('[DATE] Setting active date to:', dayjs(date).format('YYYY-MM-DD'));
    }
    setActiveDate(date);
    
    if (onDateSelected) {
      if (__DEV__) {
        console.log('[DATE] Calling onDateSelected callback');
      }
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

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50
  };

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged }
  ]);

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
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
          <FlatList
            ref={flatListRef}
            data={weeks}
            renderItem={renderWeek}
            keyExtractor={keyExtractor}
            horizontal
            pagingEnabled={scrollerPaging}
            showsHorizontalScrollIndicator={false}
            getItemLayout={getItemLayout}
            onScroll={onScroll}
            viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
            initialScrollIndex={CENTER_INDEX}
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
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
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

export default CalendarStrip;
