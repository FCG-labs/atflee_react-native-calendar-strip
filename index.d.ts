import { Component, ReactNode, ComponentProps, RefObject } from "react";
import { Dayjs } from "dayjs";
import {
  StyleProp,
  ViewStyle,
  TextStyle,
  GestureResponderEvent
} from "react-native";
import { RecyclerListView } from 'recyclerlistview';

interface IDaySelectionAnimationBorder {
  type: "border";
  duration: number;
  borderWidth: number;
  borderHighlightColor: string;
  animType?: any;
  animUpdateType?: any;
  animProperty?: any;
  animSpringDamping?: any;
}

interface IDaySelectionAnimationBackground {
  type: "background";
  duration: number;
  highlightColor: string;
  animType?: any;
  animUpdateType?: any;
  animProperty?: any;
  animSpringDamping?: any;
}

interface IDayComponentProps {
  date: Dayjs;
  marking?: any;
  selected?: boolean;
  enabled: boolean;
  showDayName?: boolean;
  showDayNumber?: boolean;
  onDateSelected?: (event: GestureResponderEvent) => void;
  calendarColor?: string;
  dateNameStyle?: string;
  dateNumberStyle?: string;
  dayContainerStyle?: StyleProp<ViewStyle>;
  weekendDateNameStyle?: TextStyle;
  weekendDateNumberStyle?: TextStyle;
  highlightDateContainerStyle?: StyleProp<ViewStyle>;
  highlightDateNameStyle?: TextStyle;
  highlightDateNumberStyle?: TextStyle;
  disabledDateNameStyle?: TextStyle;
  disabledDateNumberStyle?: TextStyle;
  styleWeekend?: boolean;
  daySelectionAnimation?: TDaySelectionAnimation;
  customStyle?: ViewStyle;
  size: number;
  allowDayTextScaling?: boolean;
  markedDatesStyle?: TextStyle;
  markedDates?: any[] | ((date: Dayjs) => void);
  upperCaseDays?: boolean;
}

type TDaySelectionAnimation =
  | IDaySelectionAnimationBorder
  | IDaySelectionAnimationBackground;

type TDateRange = {
  start: Dayjs;
  end: Dayjs;
};

interface CalendarStripProps {
  style: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  calendarColor?: string;

  numDaysInWeek?: number;
  scrollable?: boolean;
  scrollerPaging?: boolean;
  externalScrollView?: ComponentProps<typeof RecyclerListView>['externalScrollView'];
  startingDate?: Dayjs | Date;
  selectedDate?: Dayjs | Date;
  onDateSelected?: ((date: Dayjs) => void);
  onWeekChanged?: ((start: Dayjs, end: Dayjs) => void);
  onWeekScrollStart?: ((start: Dayjs, end: Dayjs) => void);
  onWeekScrollEnd?: ((start: Dayjs, end: Dayjs) => void);
  onHeaderSelected?: ((dates: {weekStartDate: Dayjs, weekEndDate: Dayjs}) => void);
  updateWeek?: boolean;
  useIsoWeekday?: boolean;
  minDate?: Dayjs | Date;
  maxDate?: Dayjs | Date;
  datesWhitelist?: TDateRange[] | ((date: Dayjs) => void);
  datesBlacklist?: TDateRange[] | ((date: Dayjs) => void);
  markedDates?: any[] | ((date: Dayjs) => void);
  scrollToOnSetSelectedDate?: boolean;

  showMonth?: boolean;
  showDayName?: boolean;
  showDayNumber?: boolean;
  showDate?: boolean;

  leftSelector?: any;
  rightSelector?: any;
  iconLeft?: any;
  iconRight?: any;
  iconStyle?: any;
  iconLeftStyle?: any;
  iconRightStyle?: any;
  iconContainer?: any;

  maxDayComponentSize?: number;
  minDayComponentSize?: number;
  responsiveSizingOffset?: number;
  dayComponentHeight?: number;

  calendarHeaderContainerStyle?: StyleProp<ViewStyle>;
  calendarHeaderStyle?: StyleProp<TextStyle>;
  calendarHeaderFormat?: string;
  calendarHeaderPosition?: "below" | "above";

  calendarAnimation?: {
    duration: number;
    type: "sequence" | "parallel";
  };
  daySelectionAnimation?: TDaySelectionAnimation;

  customDatesStyles?: any[] | ((date: Dayjs) => void);

  dayComponent?: (props: IDayComponentProps) => ReactNode;

  dateNameStyle?: StyleProp<TextStyle>;
  dateNumberStyle?: StyleProp<TextStyle>;
  dayContainerStyle?: StyleProp<ViewStyle>;
  weekendDateNameStyle?: StyleProp<TextStyle>;
  weekendDateNumberStyle?: StyleProp<TextStyle>;
  highlightDateContainerStyle?: StyleProp<ViewStyle>;
  highlightDateNameStyle?: StyleProp<TextStyle>;
  highlightDateNumberStyle?: StyleProp<TextStyle>;
  highlightDateNumberContainerStyle?: StyleProp<ViewStyle>;
  disabledDateNameStyle?: StyleProp<TextStyle>;
  disabledDateNumberStyle?: StyleProp<TextStyle>;
  markedDatesStyle?: StyleProp<TextStyle>;
  disabledDateOpacity?: number;
  styleWeekend?: boolean;
  upperCaseDays?: boolean;

  locale?: object;
  shouldAllowFontScaling?: boolean;
  useNativeDriver?: boolean;

  headerText?: string;

  ref?: RefObject<any>;
}

export default class ReactNativeCalendarStrip extends Component<CalendarStripProps> {
  getSelectedDate: () => undefined | Date | string;
  setSelectedDate: (date: Dayjs | string) => void;
  getNextWeek: () => void;
  getPreviousWeek: () => void;
  updateWeekView: (date: Dayjs | string) => void;
}
