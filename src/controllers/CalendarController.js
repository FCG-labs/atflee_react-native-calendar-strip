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
      minDate: null,  // 최소 날짜 제한 (선택 가능한 가장 이른 날짜)
      maxDate: null,  // 최대 날짜 제한 (선택 가능한 가장 늘은 날짜)
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
    // Generate initial set of weeks with reasonable range
    const initialWeekStart = this._getWeekStart(this._selectedDate);
    
    // Pre-generate weeks for smooth scrolling (9주 = 현재 주 기준 앞뒤로 4주씩)
    const INITIAL_WEEKS = 9;
    this._prepareWeeks(initialWeekStart, INITIAL_WEEKS);
    
    // Set current week index to the middle
    this._currentWeekIndex = Math.floor(INITIAL_WEEKS / 2); // 중간 주차 인덱스
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
    
    // dayjs 객체는 불변이므로 endDate를 별도 변수에 저장
    const endDate = actualStartDate.add(numDays - 1, 'day');
    
    return {
      id: actualStartDate.format('YYYY-MM-DD'),
      startDate: actualStartDate,
      endDate: endDate,
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
   * Scroll to a specific date
   * @param {Date|string} date - Date to scroll to
   */
  scrollToDate(date) {
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
      // dayjs 객체는 불변이므로 별도 변수에 저장
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
      // dayjs 객체는 불변이므로 별도 변수에 저장
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
    
    // 새로운 주차 동적 로딩 기능 구현
    // 기본값으로 한 번에 5주차씩 로드
    const LOAD_BATCH_SIZE = 5;   // 한 번에 로딩할 주차 수
    
    // 현재 보이는 주차의 시작과 끝
    const visibleStartWeekStart = this._getWeekStart(startDate);
    const visibleEndWeekStart = this._getWeekStart(endDate);
    
    // 현재 로드된 주차 중 가장 이른 주차와 가장 늦은 주차 찾기
    let earliestWeek = null;
    let latestWeek = null;
    
    Object.values(this._visibleWeeks).forEach(week => {
      if (!earliestWeek || week.startDate.isBefore(earliestWeek.startDate)) {
        earliestWeek = week;
      }
      if (!latestWeek || week.startDate.isAfter(latestWeek.startDate)) {
        latestWeek = week;
      }
    });
    
    // 앞쪽(과거) 방향으로 더 많은 주차 로드 필요한지 확인
    if (earliestWeek && visibleStartWeekStart.isBefore(earliestWeek.startDate)) {
      // 스크롤이 이미 로드된 가장 이른 주차보다 더 앞으로 나가갔을 때
      const weeksToLoad = [];
      let weekStart = earliestWeek.startDate.subtract(this._options.numDaysInWeek, 'day');
      
      // LOAD_BATCH_SIZE만큼 앞쪽으로 주차 추가 로드
      for (let i = 0; i < LOAD_BATCH_SIZE; i++) {
        // minDate 제약 검사 - 주차의 마지막 날짜가 minDate보다 이전이면 중단
        if (this._options.minDate && weekStart.isBefore(dayjs(this._options.minDate), 'day')) {
          break;
        }
        
        const weekId = weekStart.format('YYYY-MM-DD');
        if (!this._visibleWeeks[weekId]) {
          const week = this._generateWeek(weekStart);
          this._visibleWeeks[weekId] = week;
          weeksToLoad.unshift(week); // 앞쪽부터 추가
        }
        weekStart = weekStart.subtract(this._options.numDaysInWeek, 'day');
      }
      
      // 새로 로드된 주차 앞쪽에 추가
      if (weeksToLoad.length > 0) {
        this._weeks = [...weeksToLoad, ...this._weeks];
        // 현재 주차 인덱스 조정
        this._currentWeekIndex += weeksToLoad.length;
      }
    }
    
    // 뒤쪽(미래) 방향으로 더 많은 주차 로드 필요한지 확인
    if (latestWeek && visibleEndWeekStart.isAfter(latestWeek.startDate)) {
      // 스크롤이 이미 로드된 가장 늦은 주차보다 더 뒤로 나가갔을 때
      const weeksToLoad = [];
      let weekStart = latestWeek.startDate.add(this._options.numDaysInWeek, 'day');
      
      // LOAD_BATCH_SIZE만큼 뒤쪽으로 주차 추가 로드
      for (let i = 0; i < LOAD_BATCH_SIZE; i++) {
        // maxDate 제약 검사 - 주차의 첫 날짜가 maxDate보다 이후면 중단
        if (this._options.maxDate && weekStart.isAfter(dayjs(this._options.maxDate), 'day')) {
          break;
        }
        
        const weekId = weekStart.format('YYYY-MM-DD');
        if (!this._visibleWeeks[weekId]) {
          const week = this._generateWeek(weekStart);
          this._visibleWeeks[weekId] = week;
          weeksToLoad.push(week); // 뒤쪽부터 추가
        }
        weekStart = weekStart.add(this._options.numDaysInWeek, 'day');
      }
      
      // 새로 로드된 주차 뒤쪽에 추가
      if (weeksToLoad.length > 0) {
        this._weeks = [...this._weeks, ...weeksToLoad];
      }
    }
    
    // 새로운 주차 로딩 후 리스너에게 알림
    this._notifyListeners();
  }

  /**
   * Select a specific date
   * @param {Date|string} date - Date to select
   */
  selectDate(date) {
    this._selectedDate = dayjs(date);
    
    // 선택한 날짜가 있는 주차 인덱스로 업데이트 (현재 표시된 주차 유지)
    const weekIndex = this.findWeekIndexByDate(this._selectedDate);
    if (weekIndex !== -1) {
      this._currentWeekIndex = weekIndex;
    }
    
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
   * Get the currently selected date (originally returned native Date, now returns dayjs for consistency)
   * @returns {dayjs.Dayjs} Currently selected date as a dayjs object
   */
  getSelectedDateNative() {
    return this._selectedDate;
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
