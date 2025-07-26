import { NativeModules } from 'react-native';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

// Initialize dayjs plugins
dayjs.extend(isoWeek);

/**
 * Interface for native calendar operations
 * Falls back to JS implementation if native module is not available
 */
class CalendarNativeModule {
  constructor() {
    this._nativeModule = NativeModules.ATFCalendarModule;
    this._hasNativeModule = !!this._nativeModule;
  }

  /**
   * Check if the native module is available
   * @returns {boolean} True if native module is available
   */
  isNativeAvailable() {
    return this._hasNativeModule;
  }

  /**
   * Initialize the native calendar module
   * @param {Object} options - Calendar configuration options
   * @returns {Promise<boolean>} Promise resolving to true if successful
   */
  async initialize(options = {}) {
    if (!this._hasNativeModule) {
      // Native module not available, resolve immediately
      return true;
    }

    try {
      return await this._nativeModule.initialize({
        startDate: options.startDate?.toISOString(),
        useIsoWeek: options.useIsoWeek || false,
        weekLength: options.numDaysInWeek || 7,
      });
    } catch (error) {
      // Silently fail and continue with JS implementation
      return true;
    }
  }

  /**
   * Calculate week data for a reference date
   * @param {dayjs.Dayjs} referenceDate - Reference date
   * @param {Object} options - Calendar configuration options
   * @returns {Promise<Object>} Promise resolving to week data
   */
  async calculateWeekData(referenceDate, options = {}) {
    if (!this._hasNativeModule) {
      return this._fallbackCalcWeekData(referenceDate, options);
    }
    
    const isoDateString = referenceDate.toISOString();
    
    try {
      return await this._nativeModule.calculateWeekData(isoDateString, {
        useIsoWeek: options.useIsoWeek || false,
        weekStartsOn: options.weekStartsOn || 0,
        weekLength: options.numDaysInWeek || 7,
      });
    } catch (error) {
      // Fallback to JS implementation
      return this._fallbackCalcWeekData(referenceDate, options);
    }
  }

  /**
   * Get the week start date for a given date
   * @param {string} isoDateString - ISO date string
   * @param {boolean} useIsoWeek - Use ISO week definition (Monday as first day)
   * @returns {Promise<string>} Promise resolving to ISO date string of week start
   */
  async getWeekStart(isoDateString, useIsoWeek) {
    if (!this._hasNativeModule) {
      return this._fallbackGetWeekStart(isoDateString, useIsoWeek);
    }
    
    try {
      return await this._nativeModule.getWeekStart(isoDateString, useIsoWeek);
    } catch (error) {
      // Fallback to JS implementation
      return this._fallbackGetWeekStart(isoDateString, useIsoWeek);
    }
  }

  /**
   * Check if a date is within a range
   * @param {dayjs.Dayjs} date - Date to check
   * @param {dayjs.Dayjs} startDate - Start date of the range
   * @param {dayjs.Dayjs} endDate - End date of the range
   * @returns {Promise<boolean>} Promise resolving to true if date is within range
   */
  async isDateInRange(date, startDate, endDate) {
    if (!this._hasNativeModule) {
      return this._fallbackIsDateInRange(date, startDate, endDate);
    }
    
    try {
      return await this._nativeModule.isDateInRange(
        date.toISOString(),
        startDate.toISOString(),
        endDate.toISOString()
      );
    } catch (error) {
      // Fallback to JS implementation
      return this._fallbackIsDateInRange(date, startDate, endDate);
    }
  }

  /**
   * Generate a range of dates starting from a specific date
   * @param {dayjs.Dayjs} startDate - Start date of the range
   * @param {dayjs.Dayjs} endDate - End date of the range
   * @param {Object} options - Options for date generation
   * @returns {Promise<Array>} Promise resolving to array of day objects
   */
  async generateDatesInRange(startDate, endDate, options = {}) {
    if (!this._hasNativeModule) {
      return this._fallbackGenerateDatesInRange(startDate, endDate, options);
    }
    
    const startIsoDate = startDate.toISOString();
    const dayCount = endDate.diff(startDate, 'day') + 1;
    
    try {
      return await this._nativeModule.generateDatesRange(startIsoDate, dayCount);
    } catch (error) {
      // Fallback to JS implementation
      return this._fallbackGenerateDatesInRange(startDate, endDate, options);
    }
  }

  /**
   * JS fallback implementation for calculating week data
   * @param {dayjs.Dayjs} referenceDate - Reference date
   * @param {Object} options - Calendar configuration options
   * @returns {Object} Week data object
   * @private
   */
  _fallbackCalcWeekData(referenceDate, options = {}) {
    const useIsoWeek = options.useIsoWeek || false;
    const weekStartsOn = options.weekStartsOn || (useIsoWeek ? 1 : 0); // ISO week starts on Monday (1)
    const numDaysInWeek = options.numDaysInWeek || 7;
    
    // Calculate week start date
    let weekStart;
    if (useIsoWeek) {
      weekStart = referenceDate.startOf('isoWeek');
    } else {
      const day = referenceDate.day();
      const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
      weekStart = referenceDate.subtract(diff, 'day').startOf('day');
    }
    
    // Generate days in the week
    const days = [];
    for (let i = 0; i < numDaysInWeek; i++) {
      const date = weekStart.add(i, 'day');
      days.push({
        date: date.toDate(),
        dateString: date.format('YYYY-MM-DD'),
        dayOfWeek: date.day(),
        dayOfMonth: date.date(),
        month: date.month(),
        year: date.year(),
        timestamp: date.valueOf()
      });
    }
    
    return {
      weekId: weekStart.format('YYYY-MM-DD'),
      startDate: weekStart.toDate(),
      endDate: weekStart.add(numDaysInWeek - 1, 'day').toDate(),
      days
    };
  }

  /**
   * JS fallback implementation for getting week start
   * @param {string} isoDateString - ISO date string
   * @param {boolean} useIsoWeek - Use ISO week definition
   * @returns {string} ISO date string of week start
   * @private
   */
  _fallbackGetWeekStart(isoDateString, useIsoWeek) {
    const date = dayjs(isoDateString);
    if (useIsoWeek) {
      return date.startOf('isoWeek').toISOString();
    } else {
      return date.startOf('week').toISOString();
    }
  }

  /**
   * JS fallback implementation for checking if date is in range
   * @param {dayjs.Dayjs} date - Date to check
   * @param {dayjs.Dayjs} startDate - Start date of range
   * @param {dayjs.Dayjs} endDate - End date of range
   * @returns {boolean} True if date is within range
   * @private
   */
  _fallbackIsDateInRange(date, startDate, endDate) {
    return date.isAfter(startDate.subtract(1, 'day')) && 
           date.isBefore(endDate.add(1, 'day'));
  }

  /**
   * JS fallback implementation for generating dates in range
   * @param {dayjs.Dayjs} startDate - Start date of range
   * @param {dayjs.Dayjs} endDate - End date of range
   * @param {Object} options - Options for generation
   * @returns {Array} Array of day objects
   * @private
   */
  _fallbackGenerateDatesInRange(startDate, endDate, options = {}) {
    const days = [];
    const dayCount = endDate.diff(startDate, 'day') + 1;
    
    for (let i = 0; i < dayCount; i++) {
      const date = startDate.add(i, 'day');
      days.push({
        date: date.toDate(),
        dateString: date.format('YYYY-MM-DD'),
        dayOfWeek: date.day(),
        dayOfMonth: date.date(),
        month: date.month(),
        year: date.year(),
        timestamp: date.valueOf()
      });
    }
    
    return days;
  }

}

// Export singleton instance
export default new CalendarNativeModule();
