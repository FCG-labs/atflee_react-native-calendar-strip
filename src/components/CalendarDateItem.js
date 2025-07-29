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
  isActive,
  isToday,
  isWeekend,
  showDayName,
  showDayNumber,
  dateNameStyle,
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
  markedDatesStyle,
  markerComponent,
  dayContainerStyle,
  activeDate,
  highlightColor,
  calendarColor,
  styleWeekend,
  isDisabled
}) => {
  // Generate accessibility label for the date
  const accessibilityLabel = dayjs(date).format('dddd, MMMM D, YYYY');
  
  // --- Detect if this date is marked -------------------------
  const hasMarker = markedDates && markedDates.find(m => {
    // Accept raw string/Date/Dayjs, or object with `.date`
    let d;
    if (typeof m === 'string' || m instanceof Date || dayjs.isDayjs(m)) {
      d = m;
    } else if (m && 'date' in m) {
      d = m.date;
    }
    return d ? dayjs(d).isSame(dayjs(date), 'day') : false;
  });
  
  // Apply custom styling for weekend if enabled
  const isStyledWeekend = styleWeekend && isWeekend;

  // Determine styles based on active/today state
  const containerStyle = [
    styles.dateContainer,
    isActive ? {
      backgroundColor: highlightColor || styles.activeDate.backgroundColor
    } : null,
    dayContainerStyle,
    calendarColor ? { backgroundColor: isActive ? highlightColor : calendarColor } : null
  ];
  
  const dayStyle = [
    styles.dayText,
    dateNameStyle,
    isActive ? highlightDateNameStyle : null,
    isStyledWeekend && !isActive ? { color: '#999' } : null,
    isDisabled ? { opacity: disabledDateOpacity } : null
  ];
  
  const dateStyle = [
    styles.dateText,
    dateNumberStyle,
    isActive ? highlightDateNumberStyle : null,
    isStyledWeekend && !isActive ? { color: '#999' } : null,
    isDisabled ? { opacity: disabledDateOpacity } : null
  ];
  
  // Use custom day component if provided, otherwise render default
  if (dayComponent) {
    return dayComponent({
      date,
      isActive,
      isToday,
      isWeekend,
      isDisabled,
      markedDate: hasMarker,
      onDateSelected: () => isDisabled ? null : onDateSelected(date)
    });
  }
  
  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={() => isDisabled ? null : onDateSelected(date)}
      activeOpacity={isDisabled ? 1 : activeOpacity}
      disabled={isDisabled}
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
        
        {hasMarker && markerComponent ? (
          markerComponent(hasMarker)
        ) : (
          hasMarker && (
            <View
              style={[
                styles.marker,
                {
                  backgroundColor:
                    typeof hasMarker === 'object' && hasMarker?.dots?.[0]?.color
                      ? hasMarker.dots[0].color
                      : (typeof hasMarker === 'object' && hasMarker.color)
                        ? hasMarker.color
                        : '#4296F0',
                },
                markedDatesStyle,
              ]}
            />
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
  // Accept JavaScript Date or dayjs object
  date: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.object]).isRequired,
  dateNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  dayName: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  isToday: PropTypes.bool,
  isWeekend: PropTypes.bool,
  showDayName: PropTypes.bool,
  showDayNumber: PropTypes.bool,
  dateNameStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
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
  // Accept array of objects or array of raw date strings / Date objects
  markedDates: PropTypes.array,
  markedDatesStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  markerComponent: PropTypes.func,
  dayContainerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  activeDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.object]),
  highlightColor: PropTypes.string,
  calendarColor: PropTypes.string,
  styleWeekend: PropTypes.bool,
  isDisabled: PropTypes.bool
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
