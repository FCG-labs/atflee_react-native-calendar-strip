import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  UIManager
} from 'react-native';
import PagerView from 'react-native-pager-view';
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

  // PagerView reference
  const pagerRef = useRef(null);

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
    console.log('[INIT] Creating carousel window');
    const currentDate = selectedDate || startingDate || new Date();
    console.log('[INIT] Current date:', dayjs(currentDate).format('YYYY-MM-DD'));
    
    const weekStart = getWeekStart(currentDate);
    console.log('[INIT] Week start:', weekStart.format('YYYY-MM-DD'));
    
    const weeks = [];
    
    // Generate 3 weeks: 1 before, current, 1 after
    for (let i = -1; i <= 1; i++) {
      const start = weekStart.add(i * numDaysInWeek, 'day');
      const week = generateWeek(start);
      console.log(`[INIT] Week ${i + 1}:`, dayjs(week.startDate).format('YYYY-MM-DD'), 'to', dayjs(week.endDate).format('YYYY-MM-DD'));
      weeks.push(week);
    }
    
    console.log('[INIT] Created', weeks.length, 'weeks');
    return weeks;
  }, [selectedDate, startingDate, getWeekStart, generateWeek, numDaysInWeek]);

  // State - Fixed carousel window
  const [weeks, setWeeks] = useState(() => {
    console.log('[STATE] Initializing weeks state');
    return initCarousel();
  });
  const [activeDate, setActiveDate] = useState(() => {
    const date = selectedDate || startingDate || new Date();
    console.log('[STATE] Initial active date:', dayjs(date).format('YYYY-MM-DD'));
    return date;
  });
  const [viewWidth, setViewWidth] = useState(Dimensions.get('window').width);
  const [leftWidth, setLeftWidth] = useState(0);

  // Handle selectedDate changes
  useEffect(() => {
    console.log('[EFFECT] selectedDate changed:', selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : 'null');
    console.log('[EFFECT] activeDate:', dayjs(activeDate).format('YYYY-MM-DD'));
    
    if (selectedDate && !dayjs(selectedDate).isSame(dayjs(activeDate), 'day')) {
      console.log('[EFFECT] Setting new active date');
      setActiveDate(selectedDate);
      
      // Check if selectedDate is in current window
      const targetWeekStart = getWeekStart(selectedDate);
      console.log('[EFFECT] Target week start:', targetWeekStart.format('YYYY-MM-DD'));
      
      const isInWindow = weeks.some(week => {
        const weekStart = getWeekStart(week.startDate);
        const match = weekStart.isSame(targetWeekStart, 'day');
        console.log('[EFFECT] Checking week:', weekStart.format('YYYY-MM-DD'), 'matches:', match);
        return match;
      });
      
      console.log('[EFFECT] Is in current window:', isInWindow);
      
      if (!isInWindow) {
        console.log('[EFFECT] Rebuilding carousel around selected date');
        const newWeeks = initCarousel();
        setWeeks(newWeeks);
      }
      
      // Always scroll to center
      console.log('[EFFECT] Scrolling to center index:', CENTER_INDEX);
      setTimeout(() => {
        if (pagerRef.current) {
          pagerRef.current.setPage(CENTER_INDEX);
        }
      }, 100);
    }
  }, [selectedDate, activeDate, weeks, getWeekStart, initCarousel]);

  // True Carousel: Real-time scroll threshold detection
  const scrollOffsetRef = useRef(0);
  const isShiftingRef = useRef(false);
  
  // PagerView page selection handler
  const onPageSelected = useCallback((event) => {
    const position = event.nativeEvent.position;
    console.log('[PAGER] Page selected:', position);
    
    if (isShiftingRef.current) {
      // Reset flag when we return to center
      if (position === CENTER_INDEX) {
        isShiftingRef.current = false;
      }
      return;
    }
    
    if (position < CENTER_INDEX) {
      console.log('[PAGER] Swiped left - add previous week');
      isShiftingRef.current = true;
      setWeeks(currentWeeks => {
        const firstWeek = currentWeeks[0];
        const prevWeekStart = getWeekStart(firstWeek.startDate).subtract(numDaysInWeek, 'day');
        const newWeek = generateWeek(prevWeekStart);
        return [newWeek, ...currentWeeks.slice(0, WINDOW_SIZE - 1)];
      });
      pagerRef.current?.setPageWithoutAnimation(CENTER_INDEX);
    } else if (position > CENTER_INDEX) {
      console.log('[PAGER] Swiped right - add next week');
      isShiftingRef.current = true;
      setWeeks(currentWeeks => {
        const lastWeek = currentWeeks[currentWeeks.length - 1];
        const nextWeekStart = getWeekStart(lastWeek.startDate).add(numDaysInWeek, 'day');
        const newWeek = generateWeek(nextWeekStart);
        return [...currentWeeks.slice(1), newWeek];
      });
      pagerRef.current?.setPageWithoutAnimation(CENTER_INDEX);
    }
  }, [generateWeek, getWeekStart, numDaysInWeek, WINDOW_SIZE, CENTER_INDEX]);
  
  const contentWidth = Math.max(viewWidth - leftWidth, 0);

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
            isSelected={dayjs(day.date).isSame(dayjs(activeDate), 'day')}
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

  // Date selection handler
  const handleDateSelection = useCallback(date => {
    console.log('[DATE] Date selected:', dayjs(date).format('YYYY-MM-DD'));
    
    const dateObj = dayjs(date);
    if (minDate && dateObj.isBefore(dayjs(minDate), 'day')) {
      console.log('[DATE] Date before minDate, ignoring');
      return;
    }
    if (maxDate && dateObj.isAfter(dayjs(maxDate), 'day')) {
      console.log('[DATE] Date after maxDate, ignoring');
      return;
    }

    console.log('[DATE] Setting active date to:', dayjs(date).format('YYYY-MM-DD'));
    setActiveDate(date);
    
    if (onDateSelected) {
      console.log('[DATE] Calling onDateSelected callback');
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

  // Imperative methods
  React.useImperativeHandle(calendarRef, () => ({
    scrollToDate: (date) => {
      setActiveDate(date);
      
      // Rebuild carousel around new date
      const newWeeks = initCarousel();
      setWeeks(newWeeks);
      
      setTimeout(() => {
        if (pagerRef.current) {
          pagerRef.current.setPage(CENTER_INDEX);
        }
      }, 100);
    },
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
    }
  }));

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
          <PagerView
            ref={pagerRef}
            style={{ width: contentWidth, flex: 1 }}
            initialPage={CENTER_INDEX}
            onPageSelected={onPageSelected}
            scrollEnabled={scrollerPaging}
          >
            {weeks.map((week) => (
              <View key={week.startDate.toISOString()} style={[styles.week, { width: contentWidth }]}> 
                {week.days.map(day => (
                  <CalendarDateItem
                    key={day.dateString}
                    date={day.date}
                    dateNumber={day.dayOfMonth}
                    dayName={upperCaseDays ? day.date.format('ddd').toUpperCase() : day.date.format('ddd')}
                    isToday={day.isToday}
                    isSelected={dayjs(day.date).isSame(dayjs(activeDate), 'day')}
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
            ))}
          </PagerView>
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
                isSelected={dayjs(day.date).isSame(dayjs(activeDate), 'day')}
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
        
        <View>{rightSelector}</View>
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
