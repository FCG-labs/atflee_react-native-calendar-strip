import dayjs from '../dayjs';

class CalendarController {
  constructor(options = {}) {
    this._options = {
      initialDate: options.initialDate || new Date(),
      useIsoWeekday: options.useIsoWeekday || false,
      numDaysInWeek: options.numDaysInWeek || 7,
      minDate: options.minDate ? dayjs(options.minDate) : undefined,
      maxDate: options.maxDate ? dayjs(options.maxDate) : undefined,
      is2WeekView: options.is2WeekView || false,
    };

    this._listeners = new Set();
    this._weeks = [];
    this._selectedDate = dayjs(this._options.initialDate);
    this._currentWeekIndex = 0;

    this._initialize();
  }

  _initialize() {
    this._prepareWeeks(this._selectedDate, 3);
  }

  _getWeekStart(date) {
    const d = dayjs(date);
    return this._options.useIsoWeekday ? d.startOf('isoWeek') : d.startOf('week');
  }

  _generateDay(dateInput) {
    const d = dayjs(dateInput);
    if (!d.isValid()) return null;
    const today = dayjs();
    return {
      date: d.toDate(),
      dateString: d.format('YYYY-MM-DD'),
      dayOfWeek: d.day(),
      dayOfMonth: d.date(),
      month: d.month(),
      year: d.year(),
      isToday: d.isSame(today, 'day'),
      isCurrentMonth: d.month() === today.month() && d.year() === today.year(),
    };
  }

  _generateWeek(startDate) {
    const start = dayjs(startDate);
    const days = [];
    for (let i = 0; i < this._options.numDaysInWeek; i++) {
      const day = this._generateDay(start.add(i, 'day'));
      if (day) days.push(day);
    }
    return {
      id: start.format('YYYY-MM-DD'),
      startDate: start,
      endDate: start.add(this._options.numDaysInWeek - 1, 'day'),
      days,
    };
  }

  _prepareWeeks(centerDate, count = 3) {
    this._weeks = [];
    const centerStart = this._getWeekStart(centerDate);
    const half = Math.floor(count / 2);
    for (let i = -half; i <= half; i++) {
      const weekStart = centerStart.add(i * this._options.numDaysInWeek, 'day');
      this._weeks.push(this._generateWeek(weekStart));
    }
    this._currentWeekIndex = half;
  }

  addListener(listener) {
    if (typeof listener === 'function') {
      this._listeners.add(listener);
      return () => this._listeners.delete(listener);
    }
    return () => {};
  }

  _notify() {
    this._listeners.forEach((fn) => fn(this));
  }

  selectDate(date) {
    this._selectedDate = dayjs(date);
    this._notify();
  }

  jumpToDate(date) {
    this.selectDate(date);
    this._prepareWeeks(dayjs(date), this._weeks.length || 3);
  }

  goToNextWeek() {
    const lastWeek = this._weeks[this._weeks.length - 1];
    const nextStart = this._getWeekStart(lastWeek.startDate).add(this._options.numDaysInWeek, 'day');
    if (this._options.maxDate && nextStart.isAfter(this._options.maxDate, 'day')) {
      return;
    }
    this._currentWeekIndex += 1;
    this._weeks.push(this._generateWeek(nextStart));
    this._notify();
  }

  goToPreviousWeek() {
    const firstWeek = this._weeks[0];
    const prevStart = this._getWeekStart(firstWeek.startDate).subtract(this._options.numDaysInWeek, 'day');
    const prevEnd = prevStart.add(this._options.numDaysInWeek - 1, 'day');
    if (this._options.minDate && prevEnd.isBefore(this._options.minDate, 'day')) {
      return;
    }
    this._currentWeekIndex -= 1;
    this._weeks.unshift(this._generateWeek(prevStart));
    this._notify();
  }

  findWeekIndexByDate(date) {
    const target = dayjs(date);
    for (let i = 0; i < this._weeks.length; i++) {
      const w = this._weeks[i];
      if (target.isSameOrAfter(w.startDate, 'day') && target.isSameOrBefore(w.endDate, 'day')) {
        return i;
      }
    }
    return -1;
  }

  getCurrentWeek() {
    return this._weeks[this._currentWeekIndex] || null;
  }

  getCurrentWeekIndex() {
    return this._currentWeekIndex;
  }

  getWeeks() {
    return this._weeks;
  }

  getSelectedDate() {
    return this._selectedDate;
  }

  getSelectedDateNative() {
    return this._selectedDate ? this._selectedDate.toDate() : null;
  }
}

export default CalendarController;
