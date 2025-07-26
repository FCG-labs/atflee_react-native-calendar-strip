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
import PropTypes from 'prop-types';
import dayjs from 'dayjs';

// Components
import CalendarHeader from '../CalendarHeader';

// Controller
import CalendarController from '../controllers/CalendarController';
import CalendarDateItem from './CalendarDateItem';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  // Set up controller
  const controllerRef = useRef(new CalendarController({
    initialDate: selectedDate || startingDate || new Date(),
    useIsoWeekday,
    numDaysInWeek,
    minDate,
    maxDate
  }));
  const controller = controllerRef.current;
  
  // FlatList reference
  const flatListRef = useRef(null);
  
  // State
  const [currentWeek, setCurrentWeek] = useState(controller.getCurrentWeek());
  const [weekIndex, setWeekIndex] = useState(controller.getCurrentWeekIndex());
  const [weeks, setWeeks] = useState(controller.getWeeks());
  const [viewWidth, setViewWidth] = useState(Dimensions.get('window').width);
  const [visibleStartDate, setVisibleStartDate] = useState(null);
  const [visibleEndDate, setVisibleEndDate] = useState(null);
  const [activeDate, setActiveDate] = useState(
    controller.getSelectedDate()
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
    const removeListener = controller.addListener(updatedController => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      setCurrentWeek(updatedController.getCurrentWeek());
      setWeekIndex(updatedController.getCurrentWeekIndex());
      setWeeks(updatedController.getWeeks());
      setActiveDate(updatedController.getSelectedDate());
      
      // Scroll FlatList to the new week index
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: updatedController.getCurrentWeekIndex(),
          animated: true
        });
      }
    });
    
    // Cleanup listener when component unmounts
    return removeListener;
  }, []);
  
  // Expose methods via ref
  React.useImperativeHandle(calendarRef, () => ({
    jumpToDate: (date) => controller.jumpToDate(date),
    scrollToDate: (date) => controller.jumpToDate(date),
    getSelectedDate: () => controller.getSelectedDate(),
    goToNextWeek: () => controller.goToNextWeek(),
    goToPreviousWeek: () => controller.goToPreviousWeek()
  }));
  
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
    setVisibleStartDate(startDate);
    setVisibleEndDate(endDate);
    
    if (onWeekChanged) {
      onWeekChanged(startDate, endDate);
    }
    
    if (updateMonthYear) {
      // Use the middle date of the week for the header
      const middleDate = dayjs(startDate)
        .add(Math.floor(numDaysInWeek / 2), 'day');
      updateMonthYear(middleDate);
    }
  }, [onWeekChanged, updateMonthYear, numDaysInWeek]);
  
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
          onScrollToIndexFailed={info => {
            // Handle scroll to index failures gracefully
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToIndex({
                  index: Math.min(weeks.length - 1, Math.max(0, info.index)),
                  animated: false
                });
              }
            });
          }}
          contentContainerStyle={calendarColor ? { backgroundColor: calendarColor } : undefined}
          style={styles.flatList}
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
