/**
 * Week-offset SSOT scroller — replaces RLV buffer-shift (Scroller.js).
 * anchorWeekSunday is the single source of truth; 3-page PagerView for swipe.
 */

import React, { Component } from "react";
import { View, Platform } from "react-native";
import PropTypes from "prop-types";
import PagerView from "react-native-pager-view";
import dayjs from "./dayjs";
import { getSundayWeekStart } from "./scrollContracts";
import {
  buildWeekRowData,
  clampAnchorWeekSunday,
  shiftAnchorWeek,
} from "./weekScrollerModel";
import {
  describeWeekRange,
  formatDiagDate,
  logCalendarDiag,
} from "./calendarDiag";

const CENTER_PAGE = 1;

export default class ScrollerPager extends Component {
  static propTypes = {
    initialWeekSunday: PropTypes.any,
    renderDay: PropTypes.func,
    renderDayParams: PropTypes.object.isRequired,
    minDate: PropTypes.any,
    maxDate: PropTypes.any,
    numVisibleDays: PropTypes.number.isRequired,
    updateMonthYear: PropTypes.func,
    onWeekChanged: PropTypes.func,
    onWeekScrollStart: PropTypes.func,
    onWeekScrollEnd: PropTypes.func,
  };

  static defaultProps = {
    renderDayParams: {},
  };

  constructor(props) {
    super(props);
    const initial = clampAnchorWeekSunday(
      getSundayWeekStart(props.initialWeekSunday || dayjs()),
      props.minDate,
      props.maxDate
    );
    this.anchorWeekSunday = initial;
    this.isRecentering = false;
    this.state = {
      anchorWeekSunday: initial,
      containerWidth: 0,
      ...this.updateLayout(props.renderDayParams),
    };
  }

  componentDidUpdate(prevProps) {
    const { width, height } = this.props.renderDayParams;
    if (
      width !== prevProps.renderDayParams.width ||
      height !== prevProps.renderDayParams.height
    ) {
      this.setState(this.updateLayout(this.props.renderDayParams));
    }

    const prevInitial = prevProps.initialWeekSunday
      ? getSundayWeekStart(prevProps.initialWeekSunday).format("YYYY-MM-DD")
      : null;
    const nextInitial = this.props.initialWeekSunday
      ? getSundayWeekStart(this.props.initialWeekSunday).format("YYYY-MM-DD")
      : null;
    if (prevInitial && nextInitial && prevInitial !== nextInitial) {
      const next = clampAnchorWeekSunday(
        getSundayWeekStart(this.props.initialWeekSunday),
        this.props.minDate,
        this.props.maxDate
      );
      if (!next.isSame(this.anchorWeekSunday, "day")) {
        this.anchorWeekSunday = next;
        this.setState({ anchorWeekSunday: next }, () => {
          this.pagerRef?.setPageWithoutAnimation?.(CENTER_PAGE);
        });
      }
    }
  }

  updateLayout = (renderDayParams) => {
    const itemHeight = renderDayParams.height;
    const itemWidth =
      renderDayParams.width + renderDayParams.marginHorizontal * 2;
    return { itemHeight, itemWidth };
  };

  getWeekRange = (anchor = this.anchorWeekSunday) => {
    const { numVisibleDays } = this.props;
    const { weekStart, weekEnd } = buildWeekRowData(
      anchor,
      numVisibleDays,
      this.props.minDate,
      this.props.maxDate
    );
    return { weekStart, weekEnd };
  };

  getVisibleWeek = () => {
    const { weekStart, weekEnd } = this.getWeekRange();
    return {
      start: weekStart,
      end: weekEnd,
      startIndex: 0,
      endIndex: this.props.numVisibleDays - 1,
    };
  };

  setAnchorWeek = (date, options = {}) => {
    const { emitSettled = true } = options;
    const next = clampAnchorWeekSunday(
      getSundayWeekStart(date),
      this.props.minDate,
      this.props.maxDate
    );
    if (this.anchorWeekSunday.isSame(next, "day")) {
      return;
    }
    logCalendarDiag("ScrollerPager", "setAnchorWeek", {
      from: formatDiagDate(this.anchorWeekSunday),
      to: formatDiagDate(next),
    }, "WEEK_OFFSET_SET");
    this.anchorWeekSunday = next;
    this.setState({ anchorWeekSunday: next }, () => {
      this.pagerRef?.setPageWithoutAnimation?.(CENTER_PAGE);
      this.emitWeekPreview(next);
      if (emitSettled) {
        this.emitWeekSettled(next);
      }
    });
  };

  scrollToDate = (date) => {
    this.setAnchorWeek(date, { emitSettled: false });
  };

  scrollLeft = () => {
    this.applyWeekDelta(-1, "arrow");
  };

  scrollRight = () => {
    this.applyWeekDelta(1, "arrow");
  };

  applyWeekDelta = (deltaWeeks, source) => {
    const prev = this.anchorWeekSunday;
    const next = shiftAnchorWeek(
      prev,
      deltaWeeks,
      this.props.minDate,
      this.props.maxDate
    );
    if (next.isSame(prev, "day")) {
      return;
    }
    logCalendarDiag("ScrollerPager", "applyWeekDelta", {
      source,
      deltaWeeks,
      from: formatDiagDate(prev),
      to: formatDiagDate(next),
    }, "WEEK_OFFSET_SET");
    this.anchorWeekSunday = next;
    this.setState({ anchorWeekSunday: next }, () => {
      this.pagerRef?.setPageWithoutAnimation?.(CENTER_PAGE);
      this.emitWeekPreview(next);
      this.emitWeekSettled(next);
    });
  };

  emitWeekPreview = (anchor = this.anchorWeekSunday) => {
    const { onWeekChanged, updateMonthYear } = this.props;
    const { weekStart, weekEnd } = this.getWeekRange(anchor);
    updateMonthYear && updateMonthYear(weekStart, weekEnd);
    if (onWeekChanged) {
      onWeekChanged(weekStart.clone(), weekEnd.clone());
    }
  };

  emitWeekSettled = (anchor = this.anchorWeekSunday) => {
    const { onWeekScrollEnd } = this.props;
    const { weekStart, weekEnd } = this.getWeekRange(anchor);
    const week = describeWeekRange(weekStart, weekEnd);
    logCalendarDiag("ScrollerPager", "onWeekSettled", {
      week,
      anchorSunday: formatDiagDate(anchor),
    }, week.contractOk ? undefined : "WEEK_CONTRACT_BREAK");
    onWeekScrollEnd && onWeekScrollEnd(weekStart.clone(), weekEnd.clone());
  };

  onPageScrollStateChanged = (event) => {
    const state = event.nativeEvent.pageScrollState;
    if (state === "dragging") {
      const { onWeekScrollStart } = this.props;
      const { weekStart, weekEnd } = this.getWeekRange();
      onWeekScrollStart &&
        onWeekScrollStart(weekStart.clone(), weekEnd.clone());
    }
  };

  onPageSelected = (event) => {
    if (this.isRecentering) {
      return;
    }
    const position = event.nativeEvent.position;
    if (position === CENTER_PAGE) {
      this.emitWeekSettled();
      return;
    }
    const delta = position < CENTER_PAGE ? -1 : 1;
    const prev = this.anchorWeekSunday;
    const next = shiftAnchorWeek(
      prev,
      delta,
      this.props.minDate,
      this.props.maxDate
    );
    if (next.isSame(prev, "day")) {
      this.isRecentering = true;
      this.pagerRef?.setPageWithoutAnimation?.(CENTER_PAGE);
      this.isRecentering = false;
      return;
    }
    this.isRecentering = true;
    this.anchorWeekSunday = next;
    this.setState({ anchorWeekSunday: next }, () => {
      this.pagerRef?.setPageWithoutAnimation?.(CENTER_PAGE);
      this.isRecentering = false;
      this.emitWeekPreview(next);
      this.emitWeekSettled(next);
    });
  };

  renderWeekPage = (weekSunday) => {
    const { renderDay, renderDayParams, numVisibleDays } = this.props;
    const { itemWidth, containerWidth } = this.state;
    const { data } = buildWeekRowData(
      weekSunday,
      numVisibleDays,
      this.props.minDate,
      this.props.maxDate
    );
    const totalContentWidth = itemWidth * numVisibleDays;
    const remainder = containerWidth - totalContentWidth;
    const horizontalPadding = remainder > 0 ? remainder / 2 : 0;

    return (
      <View
        style={{
          width: containerWidth || totalContentWidth,
          flexDirection: "row",
          paddingHorizontal: horizontalPadding,
          height: this.state.itemHeight,
        }}
      >
        {data.map((entry) => (
          <View
            key={entry.date.format("YYYY-MM-DD")}
            style={{
              width: renderDayParams.width,
              marginHorizontal: renderDayParams.marginHorizontal,
              height: this.state.itemHeight,
            }}
          >
            {renderDay && renderDay({ ...entry, ...renderDayParams })}
          </View>
        ))}
      </View>
    );
  };

  onLayout = (event) => {
    const width = event.nativeEvent.layout.width;
    if (this.state.containerWidth !== width) {
      this.setState({ containerWidth: width });
    }
  };

  render() {
    const { numVisibleDays } = this.props;
    const { anchorWeekSunday, itemHeight } = this.state;
    if (!itemHeight) {
      return null;
    }

    const prevWeek = shiftAnchorWeek(
      anchorWeekSunday,
      -1,
      this.props.minDate,
      this.props.maxDate
    );
    const nextWeek = shiftAnchorWeek(
      anchorWeekSunday,
      1,
      this.props.minDate,
      this.props.maxDate
    );

    return (
      <View
        style={{ height: itemHeight, flex: 1 }}
        onLayout={this.onLayout}
      >
        <PagerView
          ref={(ref) => {
            this.pagerRef = ref;
          }}
          style={{ flex: 1 }}
          initialPage={CENTER_PAGE}
          overdrag={Platform.OS === "ios"}
          onPageSelected={this.onPageSelected}
          onPageScrollStateChanged={this.onPageScrollStateChanged}
        >
          <View key="prev-week">{this.renderWeekPage(prevWeek)}</View>
          <View key="anchor-week">{this.renderWeekPage(anchorWeekSunday)}</View>
          <View key="next-week">{this.renderWeekPage(nextWeek)}</View>
        </PagerView>
      </View>
    );
  }
}
