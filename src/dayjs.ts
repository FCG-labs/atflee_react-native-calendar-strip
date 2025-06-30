import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import updateLocale from 'dayjs/plugin/updateLocale';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(isBetween);
dayjs.extend(updateLocale);
dayjs.extend(advancedFormat);
dayjs.extend(weekday);

// Plugin to provide Moment-like isoWeekday functionality
// The `option` argument is ignored but kept for plugin compatibility.
const isoWeekday = (_option: unknown, DayjsClass: any) => {
  DayjsClass.prototype.isoWeekday = function(input?: number) {
    const current = this.day() === 0 ? 7 : this.day();
    if (input == null) return current;
    return this.add(input - current, 'day');
  };
};

dayjs.extend(isoWeekday);

// Attempt to load a locale dynamically. Fail silently if locale is unavailable.
export const loadLocale = (name?: string): void => {
  if (!name) return;
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(`dayjs/locale/${name}`);
  } catch (err: any) {
    console.warn(`Could not load dayjs locale '${name}':`, err.message);
  }
};

export const startOfISOWeek = (date: dayjs.Dayjs): dayjs.Dayjs =>
  (date.isoWeekday(1) as dayjs.Dayjs).startOf('day');

export default dayjs;
