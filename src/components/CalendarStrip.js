import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';

// Components
import CalendarHeader from '../CalendarHeader';

// Controller
import CalendarController from '../controllers/CalendarController';
import CalendarDateItem from './CalendarDateItem';

// No longer using LayoutAnimation for smoother scroll synchronization

/**
 * CalendarStrip Component
 * A high-performance calendar strip with infinite bi-directional scrolling
 */
const CalendarStrip = ({
  // Calendar configuration
  selectedDate,
  startingDate,
  minDate,
  maxDate,
  useIsoWeekday,
  numDaysInWeek,
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
  // Initialize calendar controller
  const [controller, setController] = useState(null);
  useEffect(() => {
    if (!controller) {
      const newController = new CalendarController({
        initialDate: startingDate || selectedDate,
        minDate,
        maxDate,
        useIsoWeekday: useIsoWeekday !== undefined ? useIsoWeekday : false,
        numDaysInWeek: numDaysInWeek || 7
      });
      
      newController.addListener(onControllerUpdate);
      setController(newController);
      
      // Forward ref to parent
      if (calendarRef) {
        calendarRef.current = newController;
      }
    }
    
    return () => {
      if (controller) {
        controller.removeListener(onControllerUpdate);
      }
    };
  }, []);

  // FlatList reference
  const flatListRef = useRef(null);
  
  // State
  const [weeks, setWeeks] = useState([]);
  const [weekIndex, setWeekIndex] = useState(0);
  const [prevWeeksLength, setPrevWeeksLength] = useState(0);
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [viewWidth, setViewWidth] = useState(Dimensions.get('window').width);
  const [activeDate, setActiveDate] = useState(
    controller ? controller.getSelectedDate() : null
  );
  
  // Handle external updates to selectedDate
  useEffect(() => {
    if (selectedDate && !dayjs(selectedDate).isSame(dayjs(activeDate), 'day')) {
      controller.jumpToDate(selectedDate);
      setActiveDate(controller.getSelectedDate());
    }
  }, [selectedDate, activeDate]);
  
  // Listen to controller updates
  useEffect(() => {
    if (!controller) return;
    
    // 초기 상태 설정
    setWeekIndex(controller.getCurrentWeekIndex());
    setWeeks(controller.getWeeks());
    setActiveDate(controller.getSelectedDate());
  }, [controller]);
  
  // Expose methods via ref
  React.useImperativeHandle(calendarRef, () => ({
    scrollToDate: (date) => controller.scrollToDate(date),
    getSelectedDate: () => controller.getSelectedDate(),
    goToNextWeek: () => controller.goToNextWeek(),
    goToPreviousWeek: () => controller.goToPreviousWeek()
  }));
  
  // Controller update handler
  const onControllerUpdate = useCallback(state => {
    // 이전 주차 길이 저장
    setPrevWeeksLength(weeks.length);
    setWeeks(state.weeks || []);
    setWeekIndex(state.currentWeekIndex);
    setActiveDate(dayjs(state.selectedDate));
    
    // 스크롤 위치 조정
    updateScrollPosition(state.weeks, state.currentWeekIndex, weeks.length);
  }, [weeks.length]);
  
  // 스크롤 위치 업데이트 함수
  const updateScrollPosition = useCallback((newWeeks, newIndex, oldWeeksLength) => {
    if (!flatListRef.current || !newWeeks || newWeeks.length === 0) return;
    
    // 처음 렌더링 시에는 애니메이션 없이 스크롤
    if (isInitialRender) {
      flatListRef.current.scrollToIndex({
        animated: false,
        index: newIndex
      });
      setIsInitialRender(false);
      return;
    }
    
    // 주차가 추가된 경우
    if (newWeeks.length > oldWeeksLength) {
      // 앞쪽에 주차가 추가된 경우 (currentWeekIndex가 증가했다면)
      const weekDiff = newWeeks.length - oldWeeksLength;
      
      if (newIndex >= weekDiff) {
        // 스크롤 위치 유지를 위해 애니메이션 없이 이동
        flatListRef.current.scrollToIndex({
          animated: false,
          index: newIndex
        });
      } else {
        // 일반적인 경우
        flatListRef.current.scrollToIndex({
          animated: false,
          index: newIndex
        });
      }
    } else {
      // 주차 개수에 변화가 없는 경우
      flatListRef.current.scrollToIndex({
        animated: false,
        index: newIndex
      });
    }
  }, [isInitialRender]);
  
  useEffect(() => {
    if (flatListRef.current && weekIndex !== undefined && weeks.length > 0) {
      updateScrollPosition(weeks, weekIndex, prevWeeksLength);
    }
  }, [weekIndex, weeks, prevWeeksLength, updateScrollPosition]);
  
  // Handle layout changes
  const onLayout = useCallback(event => {
    const { width } = event.nativeEvent.layout;
    setViewWidth(width);
  }, []);
  
  // Handle date selection
  const handleDateSelection = useCallback(date => {
    // Check if date is within min/max range
    const dateObj = dayjs(date);
    if (minDate && dateObj.isBefore(dayjs(minDate), 'day')) {
      return;
    }
    if (maxDate && dateObj.isAfter(dayjs(maxDate), 'day')) {
      return;
    }

    controller.selectDate(date);
    setActiveDate(controller.getSelectedDate());
    
    if (onDateSelected) {
      onDateSelected(controller.getSelectedDate());
    }
  }, [onDateSelected, minDate, maxDate]);
  
  // Handle week changed event
  const handleWeekChanged = useCallback((startDate, endDate) => {
    // Update controller
    if (controller) {
      controller.updateVisibleDates(startDate, endDate);
    }
    
    if (onWeekChanged) {
      onWeekChanged(startDate, endDate);
    }
    
    if (updateMonthYear) {
      // Use the middle date of the week for the header
      const middleDate = dayjs(startDate)
        .add(Math.floor(numDaysInWeek / 2), 'day');
      updateMonthYear(middleDate);
    }
  }, [controller, onWeekChanged, updateMonthYear, numDaysInWeek]);
  
  // Handle scroll events
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const firstVisibleItem = viewableItems[0];
      const visibleWeek = firstVisibleItem.item;
      
      if (visibleWeek) {
        handleWeekChanged(
          visibleWeek.startDate,
          visibleWeek.endDate
        );
      }
    }
  }, [handleWeekChanged]);
  
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50
  };
  
  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged }
  ]);
  
  // Render week
  const renderWeek = useCallback(({ item: week }) => {
    return (
      <View style={[styles.week, { width: viewWidth }]}>
        {week.days.map(day => (
          <CalendarDateItem
            key={day.dateString}
            date={day.date}
            dateNumber={day.dayOfMonth}
            dayName={upperCaseDays
              ? day.date.format('ddd').toUpperCase()
              : day.date.format('ddd')
            }
            month={day.month}
            isActive={dayjs(activeDate).isSame(day.date, 'day')}
            isToday={day.isToday}
            isWeekend={day.dayOfWeek === 0 || day.dayOfWeek === 6}
            showDayName={showDayName}
            showDayNumber={showDayNumber}
            onDateSelected={handleDateSelection}
            dayTextStyle={dateNameStyle}
            dateNumberStyle={dateNumberStyle}
            highlightDateNameStyle={highlightDateNameStyle}
            highlightDateNumberStyle={highlightDateNumberStyle}
            dayContainerStyle={dayContainerStyle}
            highlightColor={highlightColor}
            calendarColor={calendarColor}
            disabledDateOpacity={disabledDateOpacity}
            allowDayTextScaling={allowDayTextScaling}
            dayComponent={dayComponent}
            markedDates={markedDates}
            markedDatesStyle={markedDatesStyle}
            markerComponent={markerComponent}
            activeDate={activeDate}
            styleWeekend={styleWeekend}
            isDisabled={
              (minDate && day.date.isBefore(dayjs(minDate), 'day')) ||
              (maxDate && day.date.isAfter(dayjs(maxDate), 'day'))
            }
          />
        ))}
      </View>
    );
  }, [
    viewWidth,
    activeDate,
    dateNameStyle,
    dateNumberStyle,
    highlightDateNameStyle,
    highlightDateNumberStyle,
    showDayName,
    showDayNumber,
    upperCaseDays,
    dayContainerStyle,
    disabledDateOpacity,
    allowDayTextScaling,
    dayComponent,
    markedDates,
    markedDatesStyle,
    markerComponent,
    handleDateSelection,
    calendarColor,
    highlightColor,
    styleWeekend,
    minDate,
    maxDate
  ]);
  
  // Key extractor for FlatList
  const keyExtractor = useCallback(week => week.id, []);
  
  // Get item layout for FlatList optimization
  const getItemLayout = useCallback((data, index) => ({
    length: viewWidth,
    offset: viewWidth * index,
    index,
  }), [viewWidth]);
  
  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {showMonth && (
        <CalendarHeader
          calendarHeaderFormat={calendarHeaderFormat}
          calendarHeaderPosition={calendarHeaderPosition}
          calendarHeaderStyle={calendarHeaderStyle}
          dateForHeader={activeDate}
          updateMonthYear={updateMonthYear}
          onHeaderSelected={onHeaderSelected}
          shouldAllowFontScaling={allowDayTextScaling}
        />
      )}
      
      <View style={styles.calendarContainer}>
        {leftSelector}
        
        <FlatList
          ref={flatListRef}
          data={weeks}
          renderItem={renderWeek}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled={scrollerPaging}
          initialScrollIndex={weekIndex}
          getItemLayout={getItemLayout}
          showsHorizontalScrollIndicator={false}
          scrollEnabled={scrollable}
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          // extraData를 추가하여 주차 데이터가 변경될 때 확실히 리렌더링되도록 함
          extraData={{ weeksLength: weeks.length, weekIndex }}
          onScrollToIndexFailed={info => {
            // Handle scroll to index failures gracefully
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              if (flatListRef.current) {
                const safeIndex = Math.min(weeks.length - 1, Math.max(0, info.index));
                flatListRef.current.scrollToIndex({
                  index: safeIndex,
                  animated: false,
                  viewPosition: 0.5 // 가운데 정렬
                });
              }
            });
          }}
          contentContainerStyle={calendarColor ? { backgroundColor: calendarColor } : undefined}
          style={styles.flatList}
          maintainVisibleContentPosition={{
            // 콘텐츠 위치 유지 옵션 (iOS만 지원)
            minIndexForVisible: 0
          }}
        />
        
        {rightSelector}
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
  flatList: {
    flexGrow: 1,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});

CalendarStrip.propTypes = {
  // Calendar configuration
  selectedDate: PropTypes.instanceOf(Date),
  startingDate: PropTypes.instanceOf(Date),
  minDate: PropTypes.instanceOf(Date),
  maxDate: PropTypes.instanceOf(Date),
  useIsoWeekday: PropTypes.bool,
  numDaysInWeek: PropTypes.number,
  scrollable: PropTypes.bool,
  scrollerPaging: PropTypes.bool,
  
  // Header configuration
  showMonth: PropTypes.bool,
  calendarHeaderFormat: PropTypes.string,
  calendarHeaderPosition: PropTypes.oneOf(['above', 'below']),
  calendarHeaderStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  
  // Styling
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
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
  
  // Custom components
  dayComponent: PropTypes.func,
  leftSelector: PropTypes.element,
  rightSelector: PropTypes.element,
  
  // Markers
  markedDates: PropTypes.array,
  markedDatesStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  markerComponent: PropTypes.func,
  
  // Reference
  calendarRef: PropTypes.object
};

CalendarStrip.defaultProps = {
  useIsoWeekday: false,
  numDaysInWeek: 7,
  showMonth: true,
  showDayName: true,
  showDayNumber: true,
  scrollable: true,
  scrollerPaging: true,
  upperCaseDays: true,
  allowDayTextScaling: true,
  disabledDateOpacity: 0.3,
  calendarHeaderPosition: 'above'
};

export default CalendarStrip;
