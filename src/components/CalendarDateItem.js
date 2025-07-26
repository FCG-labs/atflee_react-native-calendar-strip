import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';

/**
 * CalendarDateItem component
 * Renders a single date item in the calendar strip
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const CalendarDateItem = memo(({
  date,
  dateNumber,
  dayName,
  month,
  isActive,
  isToday,
  isWeekend,
  showDayName,
  showDayNumber,
  dayTextStyle,
  dateNumberStyle,
  highlightDateNumberStyle,
  highlightDateNameStyle,
  activeOpacity,
  disabledDateOpacity,
  upperDayText,
  lowerDayText,
  allowDayTextScaling,
  dayComponent,
  onDateSelected,
  markedDates,
  markerComponent,
  dayContainerStyle,
  activeDate
}) => {
  // Generate accessibility label for the date
  const accessibilityLabel = dayjs(date).format('dddd, MMMM D, YYYY');
  
  // Check if this date has a marker
  const hasMarker = markedDates && markedDates.find(markedDate => 
    dayjs(markedDate.date).isSame(dayjs(date), 'day')
  );
  
  // Determine styles based on active/today state
  const containerStyle = [
    styles.dateContainer,
    isActive ? styles.activeDate : null,
    dayContainerStyle
  ];
  
  const dayStyle = [
    styles.dayText,
    dayTextStyle,
    isActive ? highlightDateNameStyle : null
  ];
  
  const dateStyle = [
    styles.dateText,
    dateNumberStyle,
    isActive ? highlightDateNumberStyle : null
  ];
  
  // Use custom day component if provided, otherwise render default
  if (dayComponent) {
    return dayComponent({
      date,
      isActive,
      isToday,
      isWeekend,
      onDateSelected: () => onDateSelected(date)
    });
  }
  
  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={() => onDateSelected(date)}
      activeOpacity={activeOpacity}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <View style={styles.dateWrapper}>
        {showDayName && (
          <Text 
            style={dayStyle}
            allowFontScaling={allowDayTextScaling}
            numberOfLines={1}
          >
            {upperDayText || dayName}
          </Text>
        )}
        
        {showDayNumber && (
          <Text 
            style={dateStyle}
            allowFontScaling={allowDayTextScaling}
            numberOfLines={1}
          >
            {dateNumber}
          </Text>
        )}
        
        {lowerDayText && (
          <Text 
            style={dayStyle}
            allowFontScaling={allowDayTextScaling}
            numberOfLines={1}
          >
            {lowerDayText}
          </Text>
        )}
        
        {/* Render marker if this date is marked */}
        {hasMarker && markerComponent ? markerComponent(hasMarker) : (
          hasMarker && (
            <View style={[
              styles.marker,
              { backgroundColor: hasMarker.color || '#4296F0' }
            ]} />
          )
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  dateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeDate: {
    backgroundColor: '#E6F0FB',
    borderRadius: 8,
  },
  dateWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  dayText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#000000',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000000',
  },
  marker: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
});

CalendarDateItem.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
  dateNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  dayName: PropTypes.string.isRequired,
  month: PropTypes.number.isRequired,
  isActive: PropTypes.bool,
  isToday: PropTypes.bool,
  isWeekend: PropTypes.bool,
  showDayName: PropTypes.bool,
  showDayNumber: PropTypes.bool,
  dayTextStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  dateNumberStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  highlightDateNumberStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  highlightDateNameStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  activeOpacity: PropTypes.number,
  disabledDateOpacity: PropTypes.number,
  upperDayText: PropTypes.string,
  lowerDayText: PropTypes.string,
  allowDayTextScaling: PropTypes.bool,
  dayComponent: PropTypes.func,
  onDateSelected: PropTypes.func.isRequired,
  markedDates: PropTypes.array,
  markerComponent: PropTypes.func,
  dayContainerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  activeDate: PropTypes.instanceOf(Date)
};

CalendarDateItem.defaultProps = {
  isActive: false,
  isToday: false,
  isWeekend: false,
  showDayName: true,
  showDayNumber: true,
  activeOpacity: 0.6,
  disabledDateOpacity: 0.3,
  allowDayTextScaling: true
};

// Set displayName property to fix ESLint warning
CalendarDateItem.displayName = 'CalendarDateItem';

export default CalendarDateItem;
