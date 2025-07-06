/* eslint-disable no-console */
/* global __DEV__ */
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
const isoWeekday = (option, DayjsClass) => { 
  DayjsClass.prototype.isoWeekday = function(input) {
    const current = this.day() === 0 ? 7 : this.day();
    if (input == null) return current;
    return this.add(input - current, 'day');
  };
};

dayjs.extend(isoWeekday);

// Attempt to load a locale in React-Native (Metro bundler doesn't support dynamic requires).
// Maintain a small static map for commonly used locales. Extend this list as needed.
const localeLoaders = {
  ko: () => require('dayjs/locale/ko'),
  en: () => require('dayjs/locale/en'),
  ja: () => require('dayjs/locale/ja'),
  zh: () => require('dayjs/locale/zh'),
};

export const loadLocale = (name) => {
  if (!name) return;
  // Normalise: e.g. 'ko-KR' -> 'ko'
  const key = String(name).toLowerCase().split(/[-_]/)[0];
  const loader = localeLoaders[key];
  if (loader) {
    try {
      loader();
      // Override locale week start to Sunday (dow:0) so that non-ISO weeks
      // are consistent regardless of locale (e.g., Korean locale defaults to Monday).
      try {
        dayjs.updateLocale(key, { week: { dow: 0 } });
      } catch (e) {
        /* ignore */
      }
    } catch (err) {
      if (__DEV__) console.warn(`Failed to load dayjs locale '${key}': ${err.message}`);
    }
  } else if (__DEV__) {
    console.warn(`dayjs locale '${key}' is not registered in localeLoaders map.`);
  }
};

export const startOfISOWeek = (date) => date.isoWeekday(1).startOf('day');

export default dayjs;
