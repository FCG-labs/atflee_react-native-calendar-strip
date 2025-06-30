/**
 * Created by bogdanbegovic on 8/20/16.
 */

import React, { Component } from "react";
import PropTypes from "prop-types";
import { View, Animated, PixelRatio } from "react-native";

import dayjs, { startOfISOWeek, loadLocale } from "./dayjs";

import CalendarHeader from "./CalendarHeader";
import CalendarDay from "./CalendarDay";
import WeekSelector from "./WeekSelector";
import Scroller from "./Scroller";
import styles from "./Calendar.style";

/*
 * Class CalendarStrip that is representing the whole calendar strip and contains CalendarDay elements
 *
 */
class CalendarStrip extends Component<any, any> {
  private scroller: any;
  private onLayoutTimer: any;
  private layout: any;
  private numDaysScroll = 800;
  private animations: any[] = [];
  static propTypes = {
    style: PropTypes.any,
    innerStyle: PropTypes.any,
    calendarColor: PropTypes.string,

    numDaysInWeek: PropTypes.number,
    scrollable: PropTypes.bool,
    scrollerPaging: PropTypes.bool,
    externalScrollView: PropTypes.func,
    startingDate: PropTypes.any,
    selectedDate: PropTypes.any,
    onDateSelected: PropTypes.func,
    onWeekChanged: PropTypes.func,
    onWeekScrollStart: PropTypes.func,
    onWeekScrollEnd: PropTypes.func,
    onHeaderSelected: PropTypes.func,
    updateWeek: PropTypes.bool,
    useIsoWeekday: PropTypes.bool,
    minDate: PropTypes.any,
    maxDate: PropTypes.any,
    datesWhitelist: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
    datesBlacklist: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
    headerText: PropTypes.string,

    markedDates: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
    scrollToOnSetSelectedDate: PropTypes.bool,

    showMonth: PropTypes.bool,
    showDayName: PropTypes.bool,
    showDayNumber: PropTypes.bool,
    showDate: PropTypes.bool,

    dayComponent: PropTypes.any,
    leftSelector: PropTypes.any,
    rightSelector: PropTypes.any,
    iconLeft: PropTypes.any,
    iconRight: PropTypes.any,
    iconStyle: PropTypes.any,
    iconLeftStyle: PropTypes.any,
    iconRightStyle: PropTypes.any,
    iconContainer: PropTypes.any,

    maxDayComponentSize: PropTypes.number,
    minDayComponentSize: PropTypes.number,
    dayComponentHeight: PropTypes.number,
    responsiveSizingOffset: PropTypes.number,

    calendarHeaderContainerStyle: PropTypes.any,
    calendarHeaderStyle: PropTypes.any,
    calendarHeaderFormat: PropTypes.string,
    calendarHeaderPosition: PropTypes.oneOf(["above", "below"]),

    calendarAnimation: PropTypes.object,
    daySelectionAnimation: PropTypes.object,

    customDatesStyles: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),

    dateNameStyle: PropTypes.any,
    dateNumberStyle: PropTypes.any,
    dayContainerStyle: PropTypes.any,
    weekendDateNameStyle: PropTypes.any,
    weekendDateNumberStyle: PropTypes.any,
    highlightDateNameStyle: PropTypes.any,
    highlightDateNumberStyle: PropTypes.any,
    highlightDateNumberContainerStyle: PropTypes.any,
    highlightDateContainerStyle: PropTypes.any,
    disabledDateNameStyle: PropTypes.any,
    disabledDateNumberStyle: PropTypes.any,
    markedDatesStyle: PropTypes.object,
    disabledDateOpacity: PropTypes.number,
    styleWeekend: PropTypes.bool,

    locale: PropTypes.object,
    shouldAllowFontScaling: PropTypes.bool,
    useNativeDriver: PropTypes.bool,
    upperCaseDays: PropTypes.bool,
  };

  static defaultProps = {
    numDaysInWeek: 7,
    useIsoWeekday: true,
    showMonth: true,
    showDate: true,
    updateWeek: true,
    iconLeft: require("./img/left-arrow-black.png"),
    iconRight: require("./img/right-arrow-black.png"),
    calendarHeaderFormat: "MMMM YYYY",
    calendarHeaderPosition: "above",
    datesWhitelist: undefined,
    datesBlacklist: undefined,
    disabledDateOpacity: 0.3,
    customDatesStyles: [],
    responsiveSizingOffset: 0,
    innerStyle: { flex: 1 },
    maxDayComponentSize: 80,
    minDayComponentSize: 10,
    shouldAllowFontScaling: false,
    markedDates: [],
    useNativeDriver: true,
    scrollToOnSetSelectedDate: true,
    upperCaseDays: true,
  };

  constructor(props) {
    super(props);
    this.numDaysScroll = 800; // prefer even number divisible by 3

    const startingDate = this.getInitialStartingDate();
    const selectedDate = this.setLocale(this.props.selectedDate);

    this.state = {
      startingDate,
      selectedDate,
      datesList: [],
      dayComponentWidth: 0,
      height: 0,
      monthFontSize: 0,
      selectorSize: 0,
      numVisibleDays: props.numDaysInWeek,
    };

    this.animations = [];
    this.layout = {};
  }

  //Receiving props and set date states, minimizing state updates.
  componentDidUpdate(prevProps, prevState) {
    let startingDate: any = {};
    let selectedDate: any = {};
    let days: any = {};
    let updateState = false;

    if (
      !this.compareDates(prevProps.startingDate, this.props.startingDate) ||
      !this.compareDates(prevProps.selectedDate, this.props.selectedDate) ||
      prevProps.datesBlacklist !== this.props.datesBlacklist ||
      prevProps.datesWhitelist !== this.props.datesWhitelist ||
      prevProps.markedDates !== this.props.markedDates ||
      prevProps.customDatesStyles !== this.props.customDatesStyles
    ) {
      // Protect against undefined startingDate prop
      const _startingDate = this.props.startingDate || this.state.startingDate;

      startingDate = { startingDate: this.setLocale(_startingDate) };
      selectedDate = { selectedDate: this.setLocale(this.props.selectedDate) };
      days = this.createDays(
        startingDate.startingDate,
        selectedDate.selectedDate
      );
      updateState = true;
    }

    if (updateState) {
      this.setState({ ...startingDate, ...selectedDate, ...days });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Helper to safely stringify avoiding circular references
    const safeStringify = (obj: any) => {
      const seen = new WeakSet();
      return JSON.stringify(obj, function (key, value) {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return; // Discard duplicate reference
          }
          seen.add(value);
        }
        // Skip functions and React elements (identified by $$typeof)
        if (typeof value === "function" || (value && value.$$typeof)) {
          return undefined;
        }
        return value;
      });
    };
    // Extract selector icons since JSON.stringify fails on React component circular refs
    const _nextProps: any = Object.assign({}, nextProps);
    const _props: any = Object.assign({}, this.props);

    delete _nextProps.leftSelector;
    delete _nextProps.rightSelector;
    delete _props.leftSelector;
    delete _props.rightSelector;

    let stateChanged = true;
    let propsChanged = true;
    try {
      stateChanged = safeStringify(this.state) !== safeStringify(nextState);
      propsChanged = safeStringify(_props) !== safeStringify(_nextProps);
    } catch (e) {
      // Fallback to updating if serialization fails
      stateChanged = true;
      propsChanged = true;
    }
    return (
      stateChanged ||
      propsChanged ||
      this.props.leftSelector !== nextProps.leftSelector ||
      this.props.rightSelector !== nextProps.rightSelector
    );
  }

  // Check whether two datetimes are of the same value.  Supports Moment date,
  // JS date, or ISO 8601 strings.
  // Returns true if the datetimes values are the same; false otherwise.
  compareDates = (date1, date2) => {
    if (date1 && date1.valueOf && date2 && date2.valueOf) {
      return dayjs(date1).isSame(date2, "day");
    } else {
      return JSON.stringify(date1) === JSON.stringify(date2);
    }
  };

  //Function that checks if the locale is passed to the component and sets it to the passed date
  setLocale = (date) => {
    let _date = date && dayjs(date);
    if (_date) {
      _date = _date.set('hour', 12); // keep date the same regardless of timezone shifts
      if (this.props.locale) {
        loadLocale(this.props.locale.name);
        _date = _date.locale(this.props.locale.name);
      }
    }
    return _date;
  };

  getInitialStartingDate = () => {
    if (this.props.startingDate) {
      return this.setLocale(this.props.startingDate);
    } else {
      // Fallback when startingDate isn't provided. However selectedDate
      // may also be undefined, defaulting to today's date.
      const date = this.setLocale(dayjs(this.props.selectedDate));
      return this.props.useIsoWeekday ? startOfISOWeek(date) : date;
    }
  };

  //Set startingDate to the previous week
  getPreviousWeek = () => {
    if (this.props.scrollable) {
      this.scroller.scrollLeft();
      return;
    }
    this.animations = [];
    const previousWeekStartDate = this.state.startingDate
      .clone()
      .subtract(1, "w");
    const days = this.createDays(previousWeekStartDate);
    this.setState({ startingDate: previousWeekStartDate, ...days });
  };

  //Set startingDate to the next week
  getNextWeek = () => {
    if (this.props.scrollable) {
      this.scroller.scrollRight();
      return;
    }
    this.animations = [];
    const nextWeekStartDate = this.state.startingDate.clone().add(1, "w");
    const days = this.createDays(nextWeekStartDate);
    this.setState({ startingDate: nextWeekStartDate, ...days });
  };

  // Set the current visible week to the selectedDate
  // When date param is undefined, an update always occurs (e.g. initialize)
  updateWeekStart = (
    newStartDate,
    originalStartDate = this.state.startingDate
  ) => {
    if (!this.props.updateWeek) {
      return originalStartDate;
    }
    let startingDate = dayjs(newStartDate).startOf("day");
    const daysDiff = startingDate.diff(originalStartDate.startOf("day"), "days");
    if (daysDiff === 0) {
      return originalStartDate;
    }
    const addOrSubtract = daysDiff > 0 ? "add" : "subtract";
    let adjustWeeks = daysDiff / 7;
    adjustWeeks =
      adjustWeeks > 0
        ? Math.floor(adjustWeeks)
        : Math.ceil(Math.abs(adjustWeeks));
    startingDate = originalStartDate[addOrSubtract](adjustWeeks, "w");

    return this.setLocale(startingDate);
  };

  // updateWeekView allows external callers to update the visible week.
  updateWeekView = (date) => {
    if (this.props.scrollable) {
      this.scroller.scrollToDate(date);
      return;
    }

    this.animations = [];
    let startingDate = dayjs(date);
    startingDate = this.props.useIsoWeekday
      ? startOfISOWeek(startingDate)
      : startingDate;
    const days = this.createDays(startingDate);
    this.setState({ startingDate, ...days });
  };

  //Handling press on date/selecting date
  onDateSelected = (selectedDate) => {
    let newState;
    if (this.props.scrollable) {
      newState = { selectedDate };
    } else {
      newState = {
        selectedDate,
        ...this.createDays(this.state.startingDate, selectedDate),
      };
    }
    this.setState(() => newState);

    let _selectedDate: ReturnType<typeof dayjs> | undefined;
    if (selectedDate) {
      const wrapped = dayjs(selectedDate);
      _selectedDate = wrapped.isValid() ? wrapped : undefined;
    } else {
      _selectedDate = undefined;
    }

    // Only propagate the callback if the date is valid, otherwise send undefined to signal error.
    if (this.props.onDateSelected) {
      this.props.onDateSelected(_selectedDate);
    }
  };

  // Get the currently selected date (Moment JS object)
  getSelectedDate = () => {
    if (!this.state.selectedDate || this.state.selectedDate.valueOf() === 0) {
      return; // undefined (no date has been selected yet)
    }
    return this.state.selectedDate;
  };

  // Set the selected date.  To clear the currently selected date, pass in 0.
  setSelectedDate = (date: string | number | Date | dayjs.Dayjs | null | undefined) => {
    const mDate = date ? dayjs(date) : undefined;
    if (mDate && mDate.isValid()) {
      this.onDateSelected(mDate);
      if (this.props.scrollToOnSetSelectedDate) {
        // Scroll to selected date, centered in the week
        const scrolledDate = dayjs(mDate);
        scrolledDate.subtract(Math.floor(this.props.numDaysInWeek / 2), "days");
        this.scroller.scrollToDate(scrolledDate);
      }
    } else {
      // Invalid date provided – propagate undefined so consumers can handle gracefully.
      this.onDateSelected(undefined);
    }
  };


  // Gather animations from each day. Sequence animations must be started
  // together to work around bug in RN Animated with individual starts.
  registerAnimation = (animation) => {
    this.animations.push(animation);
    if (this.animations.length >= this.state.days.length) {
      if (this.props.calendarAnimation?.type.toLowerCase() === "sequence") {
        Animated.sequence(this.animations).start();
      } else {
        Animated.parallel(this.animations).start();
      }
    }
  };

  // Responsive sizing based on container width.
  // Debounce to prevent rapid succession of onLayout calls from thrashing.
  onLayout = (event) => {
    if (event.nativeEvent.layout.width === this.layout.width) {
      return;
    }
    if (this.onLayoutTimer) {
      clearTimeout(this.onLayoutTimer);
    }
    this.layout = event.nativeEvent.layout;
    this.onLayoutTimer = setTimeout(() => {
      this.onLayoutDebounce(this.layout);
      this.onLayoutTimer = null;
    }, 100);
  };

  onLayoutDebounce = (layout) => {
    const {
      numDaysInWeek,
      responsiveSizingOffset,
      maxDayComponentSize,
      minDayComponentSize,
      showMonth,
      showDate,
      scrollable,
      dayComponentHeight,
    } = this.props;
    const csWidth = PixelRatio.roundToNearestPixel(layout.width);
    let dayComponentWidth = csWidth / numDaysInWeek + responsiveSizingOffset;
    dayComponentWidth = Math.min(dayComponentWidth, maxDayComponentSize);
    dayComponentWidth = Math.max(dayComponentWidth, minDayComponentSize);
    let numVisibleDays = numDaysInWeek;
    let marginHorizontal;
    if (scrollable) {
      numVisibleDays = Math.floor(csWidth / dayComponentWidth);
      // Scroller requires spacing between days
      marginHorizontal = Math.round(dayComponentWidth * 0.05);
      dayComponentWidth = Math.round(dayComponentWidth * 0.9);
    }
    const monthFontSize = Math.round(dayComponentWidth / 3.2);
    let selectorSize = Math.round(dayComponentWidth / 2.5);
    let height = showMonth ? monthFontSize : 0;
    height += showDate ? dayComponentHeight || dayComponentWidth : 0;
    selectorSize = Math.min(selectorSize, height);

    this.setState(
      {
        dayComponentWidth,
        dayComponentHeight: dayComponentHeight || dayComponentWidth,
        height,
        monthFontSize,
        selectorSize,
        marginHorizontal,
        numVisibleDays,
      },
      () => this.setState({ ...this.createDays(this.state.startingDate) })
    );
  };

  getItemLayout = (data, index) => {
    const length = this.state.height * 1.05; //include margin
    return { length, offset: length * index, index };
  };

  updateMonthYear = (weekStartDate, weekEndDate) => {
    this.setState({
      weekStartDate,
      weekEndDate,
    });
  };

  createDayProps = (selectedDate) => {
    return {
      selectedDate,
      onDateSelected: this.onDateSelected,
      scrollable: this.props.scrollable,
      datesWhitelist: this.props.datesWhitelist,
      datesBlacklist: this.props.datesBlacklist,
      showDayName: this.props.showDayName,
      showDayNumber: this.props.showDayNumber,
      dayComponent: this.props.dayComponent,
      calendarColor: this.props.calendarColor,
      dateNameStyle: this.props.dateNameStyle,
      dateNumberStyle: this.props.dateNumberStyle,
      dayContainerStyle: this.props.dayContainerStyle,
      weekendDateNameStyle: this.props.weekendDateNameStyle,
      weekendDateNumberStyle: this.props.weekendDateNumberStyle,
      highlightDateNameStyle: this.props.highlightDateNameStyle,
      highlightDateNumberStyle: this.props.highlightDateNumberStyle,
      highlightDateNumberContainerStyle:
        this.props.highlightDateNumberContainerStyle,
      highlightDateContainerStyle: this.props.highlightDateContainerStyle,
      disabledDateNameStyle: this.props.disabledDateNameStyle,
      disabledDateNumberStyle: this.props.disabledDateNumberStyle,
      markedDatesStyle: this.props.markedDatesStyle,
      disabledDateOpacity: this.props.disabledDateOpacity,
      styleWeekend: this.props.styleWeekend,
      calendarAnimation: this.props.calendarAnimation,
      registerAnimation: this.registerAnimation,
      daySelectionAnimation: this.props.daySelectionAnimation,
      useNativeDriver: this.props.useNativeDriver,
      customDatesStyles: this.props.customDatesStyles,
      markedDates: this.props.markedDates,
      height: this.state.dayComponentHeight,
      width: this.state.dayComponentWidth,
      marginHorizontal: this.state.marginHorizontal,
      allowDayTextScaling: this.props.shouldAllowFontScaling,
      upperCaseDays: this.props.upperCaseDays,
    };
  };

  createDays = (startingDate, selectedDate = this.state.selectedDate) => {
    const {
      numDaysInWeek,
      useIsoWeekday,
      scrollable,
      minDate,
      maxDate,
      onWeekChanged,
    } = this.props;
    let _startingDate = startingDate;
    const days = [];
    const datesList = [];
    let numDays = numDaysInWeek;
    let initialScrollerIndex;

    if (scrollable) {
      numDays = this.numDaysScroll;
      // Center start date in scroller.
      _startingDate = startingDate.clone().subtract(numDays / 2, "days");
      if (minDate && _startingDate.isBefore(minDate, "day")) {
        _startingDate = dayjs(minDate);
      }
    }

    for (let i = 0; i < numDays; i++) {
      let date;
      if (useIsoWeekday) {
        // isoWeekday starts from Monday
        date = this.setLocale(_startingDate.clone().isoWeekday(i + 1));
      } else {
        date = this.setLocale(_startingDate.clone().add(i, "days"));
      }
      if (scrollable) {
        if (maxDate && date.isAfter(maxDate, "day")) {
          break;
        }
        if (date.isSame(startingDate, "day")) {
          initialScrollerIndex = i;
        }
        datesList.push({ date });
      } else {
        days.push(
          this.renderDay({
            date,
            key: date.format("YYYY-MM-DD"),
            ...this.createDayProps(selectedDate),
          })
        );
        datesList.push({ date });
      }
    }

    const newState: any = {
      days,
      datesList,
      initialScrollerIndex,
    };

    if (!scrollable) {
      const weekStartDate = datesList[0].date;
      const weekEndDate = datesList[this.state.numVisibleDays - 1].date;
      newState.weekStartDate = weekStartDate;
      newState.weekEndDate = weekEndDate;

      const _weekStartDate = weekStartDate ? dayjs(weekStartDate) : undefined;
      const _weekEndDate = weekEndDate ? dayjs(weekEndDate) : undefined;
      onWeekChanged && onWeekChanged(_weekStartDate, _weekEndDate);
    }
    // else Scroller sets weekStart/EndDate and fires onWeekChanged.

    return newState;
  };

  renderDay(props) {
    return <CalendarDay {...props} />;
  }

  renderHeader() {
    return (
      this.props.showMonth && (
        <CalendarHeader
          calendarHeaderFormat={this.props.calendarHeaderFormat}
          calendarHeaderContainerStyle={this.props.calendarHeaderContainerStyle}
          calendarHeaderStyle={this.props.calendarHeaderStyle}
          onHeaderSelected={this.props.onHeaderSelected}
          weekStartDate={this.state.weekStartDate}
          weekEndDate={this.state.weekEndDate}
          fontSize={this.state.monthFontSize}
          allowHeaderTextScaling={this.props.shouldAllowFontScaling}
          headerText={this.props.headerText}
        />
      )
    );
  }

  renderWeekView(days) {
    if (this.props.scrollable && this.state.datesList.length) {
      return (
        <Scroller
          ref={(scroller) => (this.scroller = scroller)}
          data={this.state.datesList}
          pagingEnabled={this.props.scrollerPaging}
          renderDay={this.renderDay}
          renderDayParams={{ ...this.createDayProps(this.state.selectedDate) }}
          maxSimultaneousDays={this.numDaysScroll}
          initialRenderIndex={this.state.initialScrollerIndex}
          minDate={this.props.minDate}
          maxDate={this.props.maxDate}
          updateMonthYear={this.updateMonthYear}
          onWeekChanged={this.props.onWeekChanged}
          onWeekScrollStart={this.props.onWeekScrollStart}
          onWeekScrollEnd={this.props.onWeekScrollEnd}
          externalScrollView={this.props.externalScrollView}
        />
      );
    }

    return days;
  }

  render() {
    // calendarHeader renders above or below of the dates & left/right selectors if dates are shown.
    // However if dates are hidden, the header shows between the left/right selectors.
    return (
      <View
        style={[
          styles.calendarContainer,
          { backgroundColor: this.props.calendarColor },
          this.props.style,
        ]}
      >
        <View style={[this.props.innerStyle, { height: this.state.height }]}>
          {this.props.showDate &&
            this.props.calendarHeaderPosition === "above" &&
            this.renderHeader()}

          <View style={styles.datesStrip}>
            <WeekSelector
              controlDate={this.props.minDate}
              iconComponent={this.props.leftSelector}
              iconContainerStyle={this.props.iconContainer}
              iconInstanceStyle={this.props.iconLeftStyle}
              iconStyle={this.props.iconStyle}
              imageSource={this.props.iconLeft}
              onPress={this.getPreviousWeek}
              weekStartDate={this.state.weekStartDate}
              weekEndDate={this.state.weekEndDate}
              size={this.state.selectorSize}
            />

            <View onLayout={this.onLayout} style={styles.calendarDates}>
              {this.props.showDate
                ? this.renderWeekView(this.state.days)
                : this.renderHeader()}
            </View>

            <WeekSelector
              controlDate={this.props.maxDate}
              iconComponent={this.props.rightSelector}
              iconContainerStyle={this.props.iconContainer}
              iconInstanceStyle={this.props.iconRightStyle}
              iconStyle={this.props.iconStyle}
              imageSource={this.props.iconRight}
              onPress={this.getNextWeek}
              weekStartDate={this.state.weekStartDate}
              weekEndDate={this.state.weekEndDate}
              size={this.state.selectorSize}
            />
          </View>

          {this.props.showDate &&
            this.props.calendarHeaderPosition === "below" &&
            this.renderHeader()}
        </View>
      </View>
    );
  }
}

export default CalendarStrip;
