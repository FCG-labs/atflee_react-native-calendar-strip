// This is a bi-directional infinite scroller.
// As the beginning & end are reached, the dates are recalculated and the current
// index adjusted to match the previous visible date.
// RecyclerListView helps to efficiently recycle instances, but the data that
// it's fed is finite. Hence the data must be shifted at the ends to appear as
// an infinite scroller.

import React, { Component } from "react";
import { View, Platform } from "react-native";
import PropTypes from "prop-types";
import {
  RecyclerListView,
  DataProvider,
  LayoutProvider,
} from "recyclerlistview";
import dayjs from "./dayjs";
import {
  alignWeekStartIndex,
  buildScrollBufferData,
  getSundayWeekStart,
  getVisibleRangeAtIndex,
  isPlausibleSettledWeek,
  resolveVisibleStartIndex,
  shouldRebuildBufferBackward,
  shouldRebuildBufferForward,
} from "./scrollContracts";

export default class CalendarScroller extends Component {
  static propTypes = {
    data: PropTypes.array.isRequired,
    initialRenderIndex: PropTypes.number,
    renderDay: PropTypes.func,
    renderDayParams: PropTypes.object.isRequired,
    minDate: PropTypes.any,
    maxDate: PropTypes.any,
    maxSimultaneousDays: PropTypes.number,
    numVisibleDays: PropTypes.number.isRequired,
    updateMonthYear: PropTypes.func,
    onWeekChanged: PropTypes.func,
    onWeekScrollStart: PropTypes.func,
    onWeekScrollEnd: PropTypes.func,
    externalScrollView: PropTypes.func,
    pagingEnabled: PropTypes.bool,
    renderAheadOffset: PropTypes.number,
  };

  static defaultProps = {
    data: [],
    renderDayParams: {},
  };

  constructor(props) {
    super(props);

    this.timeoutResetPositionId = null;

    this.updateLayout = (renderDayParams) => {
      const itemHeight = renderDayParams.height;
      const itemWidth =
        renderDayParams.width + renderDayParams.marginHorizontal * 2;

      const layoutProvider = new LayoutProvider(
        (index) => 0, // only 1 view type
        (type, dim) => {
          dim.width = itemWidth;
          dim.height = itemHeight;
        }
      );

      return { layoutProvider, itemHeight, itemWidth };
    };

    this.dataProvider = new DataProvider((r1, r2) => {
      return r1 !== r2;
    });

    this.updateDaysData = (data) => {
      return {
        data,
        numDays: data.length,
        dataProvider: this.dataProvider.cloneWithRows(data),
      };
    };

    this.state = {
      ...this.updateLayout(props.renderDayParams),
      ...this.updateDaysData(props.data),
      numVisibleItems: props.numVisibleDays,
      containerWidth: 0,
    };
  }

  componentWillUnmount() {
    if (this.timeoutResetPositionId !== null) {
      clearTimeout(this.timeoutResetPositionId);
      this.timeoutResetPositionId = null;
    }
  }

  componentDidUpdate(prevProps, prevState) {
    let newState = {};
    let updateState = false;

    const { width, height } = this.props.renderDayParams;
    if (
      width !== prevProps.renderDayParams.width ||
      height !== prevProps.renderDayParams.height
    ) {
      updateState = true;
      newState = this.updateLayout(this.props.renderDayParams);
    }

    // selectedDate highlight is applied via extendedState — do not auto-scroll on tap.

    if (this.props.data !== prevProps.data) {
      updateState = true;
      newState = { ...newState, ...this.updateDaysData(this.props.data) };
    }

    if (this.props.numVisibleDays !== prevProps.numVisibleDays) {
      updateState = true;
      newState = { ...newState, numVisibleItems: this.props.numVisibleDays };
    }

    if (updateState) {
      this.setState(newState);
    }
  }

  // Scroll left, guarding against start index.
  scrollLeft = () => {
    if (this.state.visibleStartIndex === 0) {
      return;
    }
    const newIndex = Math.max(
      this.state.visibleStartIndex - this.state.numVisibleItems,
      0
    );
    this.rlv.scrollToIndex(newIndex, true);
  };

  // Scroll right, guarding against end index.
  scrollRight = () => {
    const newIndex = this.state.visibleStartIndex + this.state.numVisibleItems;
    if (newIndex >= this.state.numDays - 1) {
      this.rlv.scrollToEnd(true); // scroll to the very end, including padding
      return;
    }
    this.rlv.scrollToIndex(newIndex, true);
  };

  resolveVisibleStartIndex = () => {
    const { data, visibleStartIndex } = this.state;
    return resolveVisibleStartIndex(
      this.rlv,
      visibleStartIndex,
      data.length,
      data
    );
  };

  getVisibleWeek = () => {
    const { data, numVisibleItems } = this.state;
    const startIndex = this.resolveVisibleStartIndex();
    const range = getVisibleRangeAtIndex(data, startIndex, numVisibleItems);
    if (!range) {
      return null;
    }
    return {
      start: range.visibleStartDate,
      end: range.visibleEndDate,
      startIndex: range.visibleStartIndex,
      endIndex: range.visibleEndIndex,
    };
  };

  scrollToDate = (date) => {
    const target = dayjs(date).startOf("day");
    const { minDate, maxDate } = this.props;

    let scrollTarget = target;
    if (minDate && scrollTarget.isBefore(minDate, "day")) {
      scrollTarget = dayjs(minDate);
    } else if (maxDate && scrollTarget.isAfter(maxDate, "day")) {
      scrollTarget = dayjs(maxDate);
    }

    for (let i = 0; i < this.state.data.length; i++) {
      if (this.state.data[i].date.isSame(scrollTarget, "day")) {
        this.rlv?.scrollToIndex(i, true);
        return;
      }
    }

    // Fallback: align to week start (Sunday) when exact date is not in buffer.
    const weekStart = scrollTarget.clone().day(0).startOf("day");
    for (let i = 0; i < this.state.data.length; i++) {
      if (this.state.data[i].date.isSame(weekStart, "day")) {
        this.rlv?.scrollToIndex(i, true);
        break;
      }
    }
  };

  // Rebuild 3-window buffer (prev | current | next) centered on visible week.
  rebuildBufferAroundWeek = (visibleWeekSunday) => {
    if (this.shifting) {
      return;
    }

    const { minDate, maxDate } = this.props;
    const { numVisibleItems } = this.state;
    const { data, anchorIndex } = buildScrollBufferData({
      visibleWeekSunday: getSundayWeekStart(visibleWeekSunday),
      numVisibleDays: numVisibleItems,
      minDate,
      maxDate,
    });

    if (data.length < numVisibleItems * 2) {
      return;
    }

    this.shifting = true;
    this.rlv.scrollToIndex(anchorIndex, false);
    this.timeoutResetPositionId = setTimeout(() => {
      this.timeoutResetPositionId = null;
      this.rlv.scrollToIndex(anchorIndex, false);
      this.shifting = false;
    }, 400);

    this.setState({
      data,
      dataProvider: this.dataProvider.cloneWithRows(data),
    });
  };

  onVisibleIndicesChanged = (all, now, notNow) => {
    const {
      data,
      numDays,
      numVisibleItems,
      visibleStartDate: _visStartDate,
      visibleEndDate: _visEndDate,
    } = this.state;
    const visibleStartIndex = all[0];
    const alignedStartIndex = alignWeekStartIndex(data, visibleStartIndex);
    const alignedRange = getVisibleRangeAtIndex(
      data,
      alignedStartIndex,
      numVisibleItems
    );
    const visibleStartDate = alignedRange
      ? alignedRange.visibleStartDate
      : data[visibleStartIndex]
      ? data[visibleStartIndex].date
      : dayjs();
    const visibleEndDate = alignedRange
      ? alignedRange.visibleEndDate
      : data[Math.min(visibleStartIndex + numVisibleItems - 1, data.length - 1)]
      ? data[Math.min(visibleStartIndex + numVisibleItems - 1, data.length - 1)]
          .date
      : dayjs();
    const settledStartIndex = alignedRange
      ? alignedRange.visibleStartIndex
      : visibleStartIndex;

    const { updateMonthYear, onWeekChanged } = this.props;

    // During infinite-scroll data shift, transient indices emit ghost weeks — skip preview.
    if (
      !this.shifting &&
      (!_visStartDate ||
        !_visEndDate ||
        !visibleStartDate.isSame(_visStartDate, "week") ||
        !visibleEndDate.isSame(_visEndDate, "week") ||
        !visibleStartDate.isSame(_visStartDate, "month") ||
        !visibleEndDate.isSame(_visEndDate, "month"))
    ) {
      const visStart = visibleStartDate && visibleStartDate.clone();
      const visEnd = visibleEndDate && visibleEndDate.clone();
      onWeekChanged && onWeekChanged(visStart, visEnd);
    }

    updateMonthYear && updateMonthYear(visibleStartDate, visibleEndDate);

    if (!this.shifting && alignedRange) {
      if (shouldRebuildBufferBackward(settledStartIndex, numVisibleItems)) {
        this.rebuildBufferAroundWeek(visibleStartDate);
      } else if (
        shouldRebuildBufferForward(settledStartIndex, numDays, numVisibleItems)
      ) {
        this.rebuildBufferAroundWeek(visibleStartDate);
      }
    }
    this.setState({
      visibleStartDate,
      visibleEndDate,
      visibleStartIndex: settledStartIndex,
    });
  };

  onScrollStart = (event) => {
    const { onWeekScrollStart } = this.props;
    const { prevStartDate, prevEndDate } = this.state;

    if (onWeekScrollStart && prevStartDate && prevEndDate) {
      onWeekScrollStart(prevStartDate.clone(), prevEndDate.clone());
    }
  };

  onScrollEnd = () => {
    const { onWeekScrollEnd } = this.props;
    const {
      data,
      numVisibleItems,
      visibleStartIndex,
      prevEndDate,
      prevStartDate,
    } = this.state;

    if (!onWeekScrollEnd || !data?.length) {
      return;
    }

    const startIndex = this.resolveVisibleStartIndex();
    let rawStartIndex = this.rlv?.findApproxFirstVisibleIndex?.();
    if (typeof rawStartIndex !== "number") {
      rawStartIndex = visibleStartIndex ?? 0;
    }
    rawStartIndex = Math.max(0, Math.min(rawStartIndex, data.length - 1));

    if (startIndex !== rawStartIndex) {
      this.rlv?.scrollToIndex(startIndex, false);
    }

    const range = getVisibleRangeAtIndex(data, startIndex, numVisibleItems);
    if (!range) {
      return;
    }

    const { visibleStartDate, visibleEndDate } = range;
    if (visibleEndDate.isSame(prevEndDate, "day")) {
      return;
    }

    if (
      prevStartDate &&
      prevEndDate &&
      !isPlausibleSettledWeek(
        prevStartDate,
        prevEndDate,
        visibleStartDate,
        visibleEndDate
      )
    ) {
      return;
    }

    this.setState({
      visibleStartDate,
      visibleEndDate,
      visibleStartIndex: range.visibleStartIndex,
    });

    onWeekScrollEnd(visibleStartDate.clone(), visibleEndDate.clone());
  };

  onScrollBeginDrag = () => {
    const { onWeekScrollStart, onWeekScrollEnd } = this.props;
    if (!onWeekScrollStart && !onWeekScrollEnd) {
      return;
    }
    const {
      data,
      visibleStartDate,
      visibleEndDate,
      visibleStartIndex,
      visibleEndIndex,
    } = this.state;
    const prevStartDate = visibleStartDate
      ? visibleStartDate
      : data[visibleStartIndex]
      ? data[visibleStartIndex].date
      : dayjs();
    const prevEndDate = visibleEndDate
      ? visibleEndDate
      : data[visibleEndIndex]
      ? data[visibleEndIndex].date
      : dayjs();

    this.setState({
      prevStartDate,
      prevEndDate,
    });
  };



  onLayout = (event) => {
    const width = event.nativeEvent.layout.width;
    if (this.state.containerWidth !== width) {
      this.setState({ containerWidth: width });
    }
  };

  rowRenderer = (type, data, i, extState) => {
    return (
      this.props.renderDay && this.props.renderDay({ ...data, ...extState })
    );
  };

  render() {
    if (
      !this.state.data ||
      this.state.numDays === 0 ||
      !this.state.itemHeight
    ) {
      return null;
    }

    const pagingProps = this.props.pagingEnabled
      ? Platform.OS === 'ios'
        ? {
            decelerationRate: 0,
            snapToInterval: this.state.itemWidth * this.state.numVisibleItems,
          } : {
            pagingEnabled: true, // enable native paging per interval
            decelerationRate: 1,
            snapToInterval: this.state.itemWidth * this.state.numVisibleItems,
            snapToAlignment: "center", // Center alignment for balanced snapping
          }
      : {};

    const totalContentWidth = this.state.itemWidth * this.state.numVisibleItems;
    const remainder = this.state.containerWidth - totalContentWidth;
    const horizontalPadding = remainder > 0 ? remainder / 2 : 0;
    const layoutSize = {
      height: this.state.itemHeight,
      width: this.state.containerWidth || totalContentWidth,
    };

    return (
      <View
        style={{ height: this.state.itemHeight, flex: 1 }}
        onLayout={this.onLayout}
      >
        <RecyclerListView
          ref={(rlv) => (this.rlv = rlv)}
          layoutProvider={this.state.layoutProvider}
          dataProvider={this.state.dataProvider}
          rowRenderer={this.rowRenderer}
          extendedState={this.props.renderDayParams}
          initialRenderIndex={this.props.initialRenderIndex}
          layoutSize={layoutSize}
          renderAheadOffset={this.props.renderAheadOffset}
          onVisibleIndicesChanged={this.onVisibleIndicesChanged}
          isHorizontal
          externalScrollView={this.props.externalScrollView}
          scrollViewProps={{
            showsHorizontalScrollIndicator: false,
            contentContainerStyle: {
              paddingHorizontal: horizontalPadding,
            },
            onMomentumScrollBegin: this.onScrollStart,
            onMomentumScrollEnd: this.onScrollEnd,
            onScrollBeginDrag: this.onScrollBeginDrag,
            ...pagingProps,
          }}
        />
      </View>
    );
  }
}
