/**
 * Advanced React Native Calendar Strip Demo App
 * Showcases optimized controller-based architecture
 * https://github.com/atflee/react-native-calendar-strip
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  FlatList,
  Switch,
  TextInput,
  Alert,
  Slider
} from 'react-native';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import updateLocale from 'dayjs/plugin/updateLocale';

import CalendarStrip from '../src/components/CalendarStrip';

// Initialize dayjs plugins
dayjs.extend(isoWeek);
dayjs.extend(updateLocale);

// Configuration options for demo
const THEMES = {
  light: {
    primary: '#3343CE',
    secondary: '#4CAF50',
    accent: '#FF5722',
    background: '#FFFFFF',
    card: '#F5F5F5',
    text: '#212121',
    border: '#E0E0E0',
    highlight: '#BBDEFB',
  },
  dark: {
    primary: '#1A237E',
    secondary: '#1B5E20',
    accent: '#BF360C',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#333333',
    highlight: '#0D47A1',
  },
};

export default function App() {
  // Calendar refs and state
  const calendarRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [formattedDate, setFormattedDate] = useState(dayjs().format('YYYY-MM-DD'));
  
  // Configuration state
  const [theme, setTheme] = useState('light');
  const [useIsoWeek, setUseIsoWeek] = useState(false);
  const [showDayName, setShowDayName] = useState(true);
  const [showDayNumber, setShowDayNumber] = useState(true);
  const [scrollable, setScrollable] = useState(true);
  const [numVisibleDays, setNumVisibleDays] = useState(7);
  
  // Calendar performance metrics
  const [weekLoadTime, setWeekLoadTime] = useState(0);
  const [renderTime, setRenderTime] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  
  // Events management
  const [events, setEvents] = useState([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  
  // Generate sample events for the calendar
  useEffect(() => {
    generateSampleEvents();
  }, []);
  
  // Update formatted date whenever selected date changes
  useEffect(() => {
    if (selectedDate) {
      setFormattedDate(dayjs(selectedDate).format('YYYY-MM-DD'));
    }
  }, [selectedDate]);

  // Generate sample events for the calendar
  const generateSampleEvents = () => {
    const startDate = dayjs().subtract(3, 'day');
    const newEvents = [];
    
    for (let i = 0; i < 14; i++) {
      const date = startDate.add(i, 'day');
      const eventCount = Math.floor(Math.random() * 3) + (i % 3 === 0 ? 1 : 0);
      
      for (let j = 0; j < eventCount; j++) {
        newEvents.push({
          id: `event_${i}_${j}`,
          date: date,
          title: `Event ${j + 1} on ${date.format('MMM D')}`,
          color: j % 2 === 0 ? THEMES[theme].secondary : THEMES[theme].accent
        });
      }
    }
    
    setEvents(newEvents);
    setTotalEvents(newEvents.length);
  };
  
  // Add a new event to the selected date
  const addEvent = () => {
    if (!newEventTitle.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    
    const newEvent = {
      id: `event_${Date.now()}`,
      date: selectedDate,
      title: newEventTitle,
      color: THEMES[theme].secondary
    };
    
    setEvents([...events, newEvent]);
    setTotalEvents(prev => prev + 1);
    setNewEventTitle('');
  };
  
  // Get events for a specific date
  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    return events.filter(event => dayjs(event.date).format('YYYY-MM-DD') === dateStr);
  };
  
  // Convert events to marked dates format
  const getMarkedDates = useCallback(() => {
    const markedDates = [];
    const uniqueDates = {};
    
    events.forEach(event => {
      const dateStr = dayjs(event.date).format('YYYY-MM-DD');
      if (!uniqueDates[dateStr]) {
        uniqueDates[dateStr] = true;
        markedDates.push({
          date: event.date,
          color: event.color
        });
      }
    });
    
    return markedDates;
  }, [events]);
  
  // Handle date selection
  const onDateSelected = (date) => {
    setSelectedDate(date);
  };
  
  // Handle week change
  const onWeekChanged = (startDate, endDate, loadTimeMs) => {
    setWeekLoadTime(loadTimeMs);
  };
  
  // Handle render complete
  const onRenderComplete = (renderTimeMs) => {
    setRenderTime(renderTimeMs);
  };
  
  // Navigate to next/previous week
  const goToNextWeek = () => {
    if (calendarRef.current) {
      calendarRef.current.goToNextWeek();
    }
  };
  
  const goToPreviousWeek = () => {
    if (calendarRef.current) {
      calendarRef.current.goToPreviousWeek();
    }
  };
  
  // Jump to specific date
  const jumpToToday = () => {
    if (calendarRef.current) {
      calendarRef.current.jumpToDate(new Date());
    }
  };
  
  // Jump to a date 3 months ahead
  const jumpToFuture = () => {
    if (calendarRef.current) {
      const futureDate = dayjs().add(3, 'month');
      calendarRef.current.jumpToDate(futureDate);
    }
  };
  
  // Toggle between themes
  const toggleTheme = () => {
    setTheme(current => current === 'light' ? 'dark' : 'light');
  };
  
  // Current theme colors
  const colors = THEMES[theme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>ATFlee CalendarStrip</Text>
          <Text style={styles.headerSubtitle}>Controller-Based Architecture Demo</Text>
        </View>
        
        <View style={[styles.calendarContainer, { backgroundColor: colors.card }]}>
          <CalendarStrip
            ref={calendarRef}
            style={styles.calendarStrip}
            calendarColor={colors.primary}
            calendarHeaderStyle={styles.calendarHeader}
            dateNameStyle={[styles.dateName, { color: colors.text }]}
            dateNumberStyle={[styles.dateNumber, { color: colors.text }]}
            highlightDateNameStyle={[styles.highlightName, { color: colors.primary }]}
            highlightDateNumberStyle={[styles.highlightNumber, { color: colors.primary }]}
            dayContainerStyle={[styles.dayContainer, { borderColor: colors.border }]}
            showDayName={showDayName}
            showDayNumber={showDayNumber}
            scrollable={scrollable}
            useIsoWeekday={useIsoWeek}
            numDaysInWeek={numVisibleDays}
            onDateSelected={onDateSelected}
            onWeekChanged={onWeekChanged}
            onRenderComplete={onRenderComplete}
            selectedDate={selectedDate}
            markedDates={getMarkedDates()}
          />
        </View>
        
        <View style={[styles.navigationContainer, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            style={[styles.navButton, { backgroundColor: colors.primary }]}
            onPress={goToPreviousWeek}
          >
            <Text style={styles.navButtonText}>← Prev</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, { backgroundColor: colors.primary }]}
            onPress={jumpToToday}
          >
            <Text style={styles.navButtonText}>Today</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, { backgroundColor: colors.primary }]}
            onPress={goToNextWeek}
          >
            <Text style={styles.navButtonText}>Next →</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, { backgroundColor: colors.accent }]}
            onPress={jumpToFuture}
          >
            <Text style={styles.navButtonText}>+3 Months</Text>
          </TouchableOpacity>
        </View>
        
        {/* Performance Metrics Section */}
        <View style={[styles.metricsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance Metrics</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.text }]}>Week Load Time</Text>
              <Text style={[styles.metricValue, { color: colors.primary }]}>{weekLoadTime}ms</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.text }]}>Render Time</Text>
              <Text style={[styles.metricValue, { color: colors.primary }]}>{renderTime}ms</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.text }]}>Total Events</Text>
              <Text style={[styles.metricValue, { color: colors.primary }]}>{totalEvents}</Text>
            </View>
          </View>
        </View>
        
        {/* Events Section */}
        <View style={[styles.eventsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Events for {formattedDate}</Text>
          
          <View style={styles.addEventContainer}>
            <TextInput
              style={[styles.eventInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Add new event..."
              placeholderTextColor={colors.border}
              value={newEventTitle}
              onChangeText={setNewEventTitle}
            />
            <TouchableOpacity 
              style={[styles.addEventButton, { backgroundColor: colors.secondary }]}
              onPress={addEvent}
            >
              <Text style={styles.addEventButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={getEventsForDate(selectedDate)}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={[styles.eventItem, { borderLeftColor: item.color, backgroundColor: colors.background }]}>
                <Text style={[styles.eventTitle, { color: colors.text }]}>{item.title}</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.border }]}>No events for this date</Text>
            }
            style={styles.eventsList}
          />
        </View>
        
        {/* Settings Section */}
        <View style={[styles.settingsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Calendar Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Theme</Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Use ISO Weekday</Text>
            <Switch
              value={useIsoWeek}
              onValueChange={setUseIsoWeek}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Show Day Names</Text>
            <Switch
              value={showDayName}
              onValueChange={setShowDayName}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Show Day Numbers</Text>
            <Switch
              value={showDayNumber}
              onValueChange={setShowDayNumber}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Enable Scrolling</Text>
            <Switch
              value={scrollable}
              onValueChange={setScrollable}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <View style={styles.settingSliderRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Days in Week: {numVisibleDays}</Text>
            <View style={styles.sliderContainer}>
              <Text style={{ color: colors.text }}>5</Text>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={14}
                step={1}
                value={numVisibleDays}
                onValueChange={setNumVisibleDays}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
              />
              <Text style={{ color: colors.text }}>14</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({  
  // Container and layout styles
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    margin: 8,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  calendarContainer: {
    margin: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  calendarStrip: {
    height: 100,
    paddingBottom: 10,
  },
  calendarHeader: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dateName: {
    fontSize: 12,
  },
  dateNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  highlightName: {
    fontSize: 12,
    fontWeight: '600',
  },
  highlightNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dayContainer: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    margin: 8,
    borderRadius: 8,
  },
  navButton: {
    padding: 10,
    borderRadius: 4,
    flex: 1,
    margin: 4,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Metrics section styles
  metricsContainer: {
    margin: 8,
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Events section styles
  eventsContainer: {
    margin: 8,
    borderRadius: 8,
    padding: 16,
  },
  addEventContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  eventInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 8,
  },
  addEventButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  addEventButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  eventsList: {
    maxHeight: 200,
  },
  eventItem: {
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderRadius: 4,
  },
  eventTitle: {
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  
  // Settings section styles
  settingsContainer: {
    margin: 8,
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  settingSliderRow: {
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
    height: 40,
  },
  infoContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 10,
    width: '100%',
  },
});
