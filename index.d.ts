import { ReactNode, RefObject } from "react";
import { Dayjs } from "dayjs";
import {
  StyleProp,
  ViewStyle,
  TextStyle
} from "react-native";

/**
 * Single day data structure as returned by CalendarController
 */
export interface CalendarDay {
  /** Dayjs object for this day */
  date: Dayjs;
  /** String representation of date in YYYY-MM-DD format */
  dateString: string;
  /** Day of week (0-6, 0 is Sunday) */
  dayOfWeek: number;
  /** Day of month (1-31) */
  dayOfMonth: number;
  /** Month (0-11) */
  month: number;
  /** Year */
  year: number;
  /** Whether this date is today */
  isToday: boolean;
  /** Whether this date is in the current month */
  isCurrentMonth: boolean;
}

/**
 * Week data structure as returned by CalendarController
 */
export interface CalendarWeek {
  /** Unique ID of the week (first day's date string) */
  id: string;
  /** Start date of week as dayjs object */
  startDate: Dayjs;
  /** End date of week as dayjs object */
  endDate: Dayjs;
  /** Array of day objects in this week */
  days: CalendarDay[];
}

/**
 * Props for custom day component - exact match to what's passed in CalendarDateItem.js
 */
export interface IDayComponentProps {
  /**
   * The dayjs date object for this day
   */
  date: Dayjs;
  
  /**
   * Whether this date is currently selected
   */
  isActive: boolean;
  
  /**
   * Whether this date is today
   */
  isToday: boolean;
  
  /**
   * Whether this date is a weekend day
   */
  isWeekend: boolean;
  
  /**
   * Whether this date is disabled (outside of min/max range)
   */
  isDisabled?: boolean;
  
  /**
   * If this date has a marker, it will be provided here
   */
  markedDate?: any;
  
  /**
   * Callback to select this date
   * @param date The selected dayjs date
   */
  onDateSelected: (date: Dayjs) => void;
}

/**
 * Date range type
 */
export interface DateRange {
  start: Dayjs;
  end: Dayjs;
}

/**
 * Marker date format used in the markedDates array
 */
export interface MarkedDate {
  /** Date to mark - can be Dayjs object, or date string */
  date: Dayjs | string;
  /** Optional dots to display for the marker */
  dots?: Array<{color?: string; [key: string]: any}>;
  /** Any additional custom properties */
  [key: string]: any;
}

/**
 * CalendarStrip component props
 */
export interface CalendarStripProps {
  // Calendar configuration
  /**
   * Initial selected date
   */
  selectedDate?: Dayjs;
  
  /**
   * Date to start the calendar at
   */
  startingDate?: Dayjs;
  
  /**
   * Minimum selectable date
   */
  minDate?: Dayjs;
  
  /**
   * Maximum selectable date
   */
  maxDate?: Dayjs;
  
  /**
   * Use ISO weekday (Monday as first day)
   */
  useIsoWeekday?: boolean;
  
  /**
   * Number of days to show in a week
   * @default 7
   */
  numDaysInWeek?: number;
  
  /**
   * Whether the calendar is scrollable
   */
  scrollable?: boolean;
  
  /**
   * Whether to use paged scrolling
   */
  scrollerPaging?: boolean;

  /**
   * Number of weeks kept in memory when scrollable.
   * Visible week plus this many weeks before and after will be rendered.
   * @default 3
   */
  weekBuffer?: number;

  /**
   * Use FlashList instead of FlatList for large buffers.
   * Requires '@shopify/flash-list' dependency.
   * @default false
   */
  useFlashList?: boolean;
  
  // Header configuration
  /**
   * Whether to show the month header
   * @default true
   */
  showMonth?: boolean;
  
  /**
   * Format string for the calendar header
   */
  calendarHeaderFormat?: string;
  
  /**
   * Position of the calendar header
   */
  calendarHeaderPosition?: "left" | "center" | "right";
  
  /**
   * Style for the calendar header
   */
  calendarHeaderStyle?: StyleProp<TextStyle>;
  
  // Styling
  /**
   * Container style for the calendar
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Style for the inner container view
   */
  innerStyle?: StyleProp<ViewStyle>;
  
  /**
   * Background color of the calendar
   */
  calendarColor?: string;
  
  /**
   * Background color for selected date
   */
  highlightColor?: string;
  
  /**
   * Style for the day name
   */
  dateNameStyle?: StyleProp<TextStyle>;
  
  /**
   * Style for the day number
   */
  dateNumberStyle?: StyleProp<TextStyle>;
  
  /**
   * Style for the day name when selected
   */
  highlightDateNameStyle?: StyleProp<TextStyle>;
  
  /**
   * Style for the day number when selected
   */
  highlightDateNumberStyle?: StyleProp<TextStyle>;
  
  /**
   * Style for the day container
   */
  dayContainerStyle?: StyleProp<ViewStyle>;
  
  /**
   * Opacity for disabled dates
   */
  disabledDateOpacity?: number;
  
  /**
   * Whether to apply different styling to weekend days
   */
  styleWeekend?: boolean;
  
  // Display options
  /**
   * Whether to show day names
   * @default true
   */
  showDayName?: boolean;
  
  /**
   * Whether to show day numbers
   * @default true
   */
  showDayNumber?: boolean;
  
  /**
   * Whether to display day names in uppercase
   */
  upperCaseDays?: boolean;
  
  /**
   * Whether to allow text scaling on days
   */
  allowDayTextScaling?: boolean;
  
  // Events and callbacks
  /**
   * Callback when a date is selected
   * @param date The selected date
   */
  onDateSelected?: (date: Dayjs) => void;
  
  /**
   * Callback when the visible week changes
   * @param startDate First day of the new visible week
   * @param endDate Last day of the new visible week
   */
  onWeekChanged?: (startDate: Dayjs, endDate: Dayjs) => void;
  
  /**
   * Callback when the header is selected
   */
  onHeaderSelected?: () => void;
  
  /**
   * Callback to update month/year in parent component
   * @param month Two-digit month string ('MM')
   * @param year Four-digit year string ('YYYY')
   */
  updateMonthYear?: (month: string, year: string) => void;

  /**
   * Callback invoked after initial render is complete
   * and the list has been centered. Receives the render time in ms.
   */
  onRenderComplete?: (renderTimeMs: number) => void;
  
  // Custom components
  /**
   * Custom day component renderer
   */
  dayComponent?: (props: IDayComponentProps) => ReactNode;
  
  /**
   * Custom left selector component
   */
  leftSelector?: ReactNode;
  
  /**
   * Custom right selector component
   */
  rightSelector?: ReactNode;
  
  // Markers
  /**
   * Array of dates to mark
   */
  markedDates?: MarkedDate[];
  
  /**
   * Style for the marked dates
   */
  markedDatesStyle?: StyleProp<ViewStyle>;
  
  /**
   * Custom marker component renderer
   */
  markerComponent?: (props: { date: Dayjs; dots: any[] }) => ReactNode;
  
  // Reference
  /**
   * Ref to access calendar methods
   * @example
   * const calendarRef = useRef<CalendarStripMethods>(null);
   * // Later access methods like:
   * // calendarRef.current?.jumpToDate(date);
   * // calendarRef.current?.getCurrentWeek();
   */
  calendarRef?: RefObject<CalendarStripMethods>;
}

/**
 * Methods exposed by the CalendarStrip component through refs
 * These match exactly what's implemented in useImperativeHandle in CalendarStrip.js
 */
export interface CalendarStripMethods {
  /**
   * Jump to specific date
   * @param date The date to jump to
   */
  jumpToDate(date: Dayjs): void;
  
  /**
   * Scroll to specific date (alias for jumpToDate)
   * @param date The date to scroll to
   */
  scrollToDate(date: Dayjs): void;
  
  /**
   * Get the currently selected date
   * @returns Native Date object of the selected date
   */
  getSelectedDate(): Dayjs;
  
  /**
   * Navigate to the next week
   */
  goToNextWeek(): void;
  
  /**
   * Navigate to the previous week
   */
  goToPreviousWeek(): void;
  
  /**
   * Get the current week's data including days and date range
   * @returns Current week data or null if not available
   */
  getCurrentWeek(): CalendarWeek | null;
  
  /**
   * Get all loaded weeks data
   * @returns Array of week data objects
   */
  getWeeks(): CalendarWeek[];
  
  /**
   * Get current week index
   * @returns Current week index number
   */
  getCurrentWeekIndex(): number;
}

/**
 * CalendarStrip component
 * A high-performance calendar strip with infinite bi-directional scrolling
 * 
 * @example
 * // Basic usage
 * <CalendarStrip
 *   selectedDate={new Date()}
 *   onDateSelected={(date) => console.log('Selected:', date)}
 *   markedDates={[
 *     { date: new Date(), dots: [{ color: 'red' }] }
 *   ]}
 * />
 *
 * @example
 * // With ref methods
 * const calendarRef = useRef<CalendarStripMethods>(null);
 * // Later: calendarRef.current?.jumpToDate(new Date());
 */
declare function CalendarStrip(props: CalendarStripProps): JSX.Element;

export default CalendarStrip;

export class CalendarController {
  constructor(options?: {
    initialDate?: Date;
    useIsoWeekday?: boolean;
    numDaysInWeek?: number;
    /**
     * Number of weeks prepared around the selected date.
     * @default 3
     */
    weekBuffer?: number;
    minDate?: Date;
    maxDate?: Date;
  });
  addListener(listener: Function): () => void;
  jumpToDate(date: Date): void;
  goToNextWeek(): void;
  goToPreviousWeek(): void;
  getCurrentWeek(): CalendarWeek | null;
  getCurrentWeekIndex(): number;
  getWeeks(): CalendarWeek[];
  getSelectedDateNative(): Date | null;
  getSelectedDate(): Dayjs;
  selectDate(date: Date): void;
  findWeekIndexByDate(date: Dayjs | Date | string): number;
}

export function WeekSelector(props: any): JSX.Element;
export function Scroller(props: any): JSX.Element;

export { CalendarStrip };
