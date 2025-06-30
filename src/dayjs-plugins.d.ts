import 'dayjs';
import { Dayjs } from 'dayjs';

declare module 'dayjs' {
  interface Dayjs {
    /**
     * ISO weekday getter/setter. When no argument provided returns 1-7 (Mon-Sun).
     * If a number is provided, returns a new Dayjs object with that ISO weekday.
     */
    isoWeekday(input?: number): Dayjs | number;
  }
}

export {};
