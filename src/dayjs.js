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

export const startOfISOWeek = (date) => date.isoWeekday(1).startOf('day');

export default dayjs;
