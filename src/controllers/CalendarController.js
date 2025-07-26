import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

// Initialize dayjs plugins
dayjs.extend(isoWeek);

/**
 * CalendarController
 * 
 * Responsible for managing calendar state, date calculations,
 * and providing an interface for date navigation
 */
class CalendarController {
  /**
   * Create a new CalendarController
   * @param {Object} options - Configuration options
   * @param {Date|string} options.initialDate - Initial selected date
   * @param {boolean} options.useIsoWeekday - Use ISO weekday (Monday as first day)
   * @param {number} options.numDaysInWeek - Number of days in a week (7 or 14)
   */
  constructor(options = {}) {
    // Initialize options with defaults
    this._options = {
      initialDate: new Date(),
      useIsoWeekday: false,
      numDaysInWeek: 7,
      ...options
    };

    // Current state
    this._today = dayjs();
    this._selectedDate = dayjs(this._options.initialDate);
    this._visibleStartDate = null;
    this._visibleEndDate = null;
    this._currentWeekIndex = 0;

    // Week data management
    this._visibleWeeks = {}; // Currently visible weeks (for efficient rendering)
    this._weeks = []; // Array of week objects in display order
    
    // Change listeners
    this._listeners = new Set();
    
    // Initialize calendar data
    this._initialize();
  }

  /**
   * Initialize the calendar data
   * @private
   */
  _initialize() {
    // Generate initial set of weeks (previous, current, next)
    const initialWeekStart = this._getWeekStart(this._selectedDate);
    
    // Pre-generate a few weeks for smooth initial rendering
    this._prepareWeeks(initialWeekStart, 3);
    
    // Set current week index
    this._currentWeekIndex = 1; // Middle week of the 3 initially generated
  }

  /**
   * Add a change listener to be notified of calendar state changes
   * @param {Function} listener - Callback function
   * @returns {Function} Function to remove the listener
   */
  addListener(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Notify all listeners of state changes
   * @private
   */
  _notifyListeners() {
    this._listeners.forEach(listener => listener(this));
  }

  /**
   * Get the start date of the week containing the given date
   * @param {dayjs.Dayjs} date - Date to get week start for
   * @returns {dayjs.Dayjs} Week start date
   * @private
   */
  _getWeekStart(date) {
    if (this._options.useIsoWeekday) {
      // ISO week starts on Monday (1)
      return date.isoWeekday(1).startOf('day');
    } else {
      // Regular week starts on Sunday (0)
      return date.day(0).startOf('day');
    }
  }
  
  /**
   * Generate a day object from a date
   * @param {dayjs.Dayjs|Date|string} date - Date to generate day object for
   * @returns {Object|null} Day object or null if date is invalid
   * @private
   */
  _generateDay(date) {
    // Ensure date is a dayjs object
    const safeDate = dayjs.isDayjs(date) ? date : dayjs(date);
    
    // Only proceed if we have a valid date
    if (!safeDate || !safeDate.isValid()) {
      // 로깅 대신 정적 null 반환으로 변경
      return null;
    }
    
    return {
      date: safeDate, // dayjs 객체를 그대로 유지
      dateString: safeDate.format('YYYY-MM-DD'),
      dayOfWeek: safeDate.day(),
      dayOfMonth: safeDate.date(),
      month: safeDate.month(),
      year: safeDate.year(),
      isToday: safeDate.isSame(this._today, 'day'),
      isCurrentMonth: safeDate.month() === this._today.month()
    };
  }

  /**
   * Generate a week of days starting from a given date
   * @param {dayjs.Dayjs} startDate - Start date of the week
   * @returns {Array<Object>} Array of day objects for the week
   * @private
   */
  _generateWeek(startDate) {
    const days = [];
    const numDays = this._options.numDaysInWeek;
    
    // Handle 2-week view special case
    const is2WeekView = numDays === 14;
    let actualStartDate = startDate;
    
    // For 2-week view, ensure we start on the correct week based on pattern
    if (is2WeekView) {
      if (this._options.useIsoWeekday) {
        // Ensure we start on even ISO week numbers for consistency
        const weekNumber = startDate.isoWeek();
        if (weekNumber % 2 === 1) {
          actualStartDate = startDate.subtract(1, 'week');
        }
      } else {
        // For regular weeks, check if we're on an odd or even week from the year start
        const startOfYear = startDate.startOf('year');
        const dayOfYear = startDate.diff(startOfYear, 'days');
        const weekNumber = Math.floor(dayOfYear / 7);
        if (weekNumber % 2 === 1) {
          actualStartDate = startDate.subtract(1, 'week');
        }
      }
    }
    
    // Generate day objects for the week
    for (let i = 0; i < numDays; i++) {
      const date = actualStartDate.add(i, 'day');
      const day = this._generateDay(date);
      if (day) {
        days.push(day);
      }
    }
    
    return {
      id: actualStartDate.format('YYYY-MM-DD'),
      startDate: actualStartDate,
      endDate: actualStartDate.add(numDays - 1, 'day'),
      days
    };
  }

  /**
   * Prepare a set of weeks around a center date
   * @param {dayjs.Dayjs} centerDate - Center date to prepare weeks around
   * @param {number} count - Number of weeks to prepare (odd number recommended)
   * @private
   */
  _prepareWeeks(centerDate, count = 3) {
    const weekStart = this._getWeekStart(centerDate);
    const weeks = [];
    
    // Generate weeks before, current, and after
    const halfCount = Math.floor(count / 2);
    
    for (let i = -halfCount; i <= halfCount; i++) {
      const startDate = weekStart.add(i * this._options.numDaysInWeek, 'day');
      const weekId = startDate.format('YYYY-MM-DD');
      
      // Check if week is already cached
      if (!this._visibleWeeks[weekId]) {
        const week = this._generateWeek(startDate);
        weeks.push(week);
        this._visibleWeeks[weekId] = week; // Store week object instead of just true
      } else {
        // Get the existing week from _weeks if it exists
        const existingWeekIndex = this._weeks.findIndex(w => w.id === weekId);
        if (existingWeekIndex >= 0) {
          weeks.push(this._weeks[existingWeekIndex]);
        }
      }
    }
    
    // Reset and rebuild _weeks array with newly ordered weeks
    this._weeks = weeks;
  }

  /**
   * Find the index of a week that contains the given date
   * @param {dayjs.Dayjs|Date|string} date - Date to find
   * @returns {number} Index of the week containing the date or -1 if not found
   */
  findWeekIndexByDate(date) {
    const targetDate = dayjs(date);
    return this._weeks.findIndex(week => {
      return targetDate.isAfter(week.startDate.subtract(1, 'day')) &&
             targetDate.isBefore(week.endDate.add(1, 'day'));
    });
  }

  /**
   * Jump to a specific date
   * @param {Date|string} date - Date to jump to
   */
  jumpToDate(date) {
    const targetDate = dayjs(date);
    
    // Find if the week containing this date is already loaded
    const weekIndex = this.findWeekIndexByDate(targetDate);
    
    if (weekIndex !== -1) {
      // Week is already loaded, just update current index
      this._currentWeekIndex = weekIndex;
      this._selectedDate = targetDate;
      
      // Notify listeners of the change
      this._notifyListeners();
    } else {
      // Week is not loaded, need to generate it and surrounding weeks
      this._selectedDate = targetDate;
      
      // Prepare weeks around the new date
      this._prepareWeeks(targetDate, 3);
      
      // Find the new current week index
      const newWeekIndex = this.findWeekIndexByDate(targetDate);
      if (newWeekIndex !== -1) {
        this._currentWeekIndex = newWeekIndex;
      }
      
      // Notify listeners of the change
      this._notifyListeners();
    }
  }

  /**
   * Navigate to the previous week
   */
  goToPreviousWeek() {
    if (this._weeks.length === 0) {
      return; // No weeks available yet
    }
    
    if (this._currentWeekIndex > 0) {
      // We already have the previous week loaded
      this._currentWeekIndex--;
      this._selectedDate = this._weeks[this._currentWeekIndex].days[0].date;
    } else {
      // Need to generate a new previous week
      const previousWeekStart = this._weeks[0].startDate
        .subtract(this._options.numDaysInWeek, 'day');
      
      // Prepare the previous week
      const newWeek = this._generateWeek(previousWeekStart);
      this._visibleWeeks[newWeek.id] = newWeek;
      
      // Insert at beginning of weeks array
      this._weeks.unshift(newWeek);
      
      // Keep the current index at 0 but update selected date
      this._selectedDate = newWeek.days[0].date;
    }
    
    // Notify listeners of the change
    this._notifyListeners();
  }

  /**
   * Navigate to the next week
   */
  goToNextWeek() {
    if (this._weeks.length === 0) {
      return; // No weeks available yet
    }
    
    if (this._currentWeekIndex < this._weeks.length - 1) {
      // We already have the next week loaded
      this._currentWeekIndex++;
      this._selectedDate = this._weeks[this._currentWeekIndex].days[0].date;
    } else {
      // Need to generate a new next week
      const lastWeek = this._weeks[this._weeks.length - 1];
      const nextWeekStart = lastWeek.startDate
        .add(this._options.numDaysInWeek, 'day');
      
      // Prepare the next week
      const newWeek = this._generateWeek(nextWeekStart);
      this._visibleWeeks[newWeek.id] = newWeek;
      
      // Add to end of weeks array
      this._weeks.push(newWeek);
      this._currentWeekIndex++;
      
      // Update selected date
      this._selectedDate = newWeek.days[0].date;
    }
    
    // Notify listeners of the change
    this._notifyListeners();
  }

  /**
   * Update the visible date range
   * @param {dayjs.Dayjs} startDate - Start date of visible range
   * @param {dayjs.Dayjs} endDate - End date of visible range
   */
  updateVisibleDates(startDate, endDate) {
    this._visibleStartDate = startDate;
    this._visibleEndDate = endDate;
    
    // Check if we need to load more weeks
    const startWeekStart = this._getWeekStart(startDate);
    const endWeekStart = this._getWeekStart(endDate);
    
    // Check if we have these weeks loaded
    const hasStartWeek = Object.values(this._visibleWeeks).some(
      week => week.startDate.isSame(startWeekStart, 'day')
    );
    const hasEndWeek = Object.values(this._visibleWeeks).some(
      week => week.startDate.isSame(endWeekStart, 'day')
    );
    
    // Load missing weeks if needed
    if (!hasStartWeek || !hasEndWeek) {
      this._prepareWeeks(startDate, 3);
    }
  }

  /**
   * Select a specific date
   * @param {Date|string} date - Date to select
   */
  selectDate(date) {
    this._selectedDate = dayjs(date);
    this._notifyListeners();
  }

  /**
   * Get the currently selected date
   * @returns {dayjs.Dayjs} Currently selected date
   */
  getSelectedDate() {
    return this._selectedDate;
  }

  /**
   * Get the currently selected date as a native Date object
   * @returns {Date} Currently selected date as a native Date object
   */
  getSelectedDateNative() {
    return this._selectedDate.toDate();
  }

  /**
   * Get the current week data
   * @returns {Object} Current week data
   */
  getCurrentWeek() {
    if (this._currentWeekIndex >= 0 && this._currentWeekIndex < this._weeks.length) {
      return this._weeks[this._currentWeekIndex];
    }
    return null;
  }

  /**
   * Get all loaded weeks data
   * @returns {Array} Array of week data objects
   */
  getWeeks() {
    return [...this._weeks];
  }

  /**
   * Get current week index
   * @returns {number} Current week index
   */
  getCurrentWeekIndex() {
    return this._currentWeekIndex;
  }
  
  /**
   * Get days in the currently selected week
   * @returns {Array} Array of day objects for the current week
   */
  getCurrentWeekDays() {
    const currentWeek = this.getCurrentWeek();
    return currentWeek ? [...currentWeek.days] : [];
  }

  /**
   * Get a flattened array of all days in all loaded weeks
   * @returns {Array} Flattened array of day objects
   */
  getAllDays() {
    return this._weeks.flatMap(week => week.days);
  }
}

export default CalendarController;
