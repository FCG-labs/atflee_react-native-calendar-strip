import dayjs from "./dayjs";
import { describeWeekRange, logCalendarDiag, logWeekContractCheck } from "./calendarDiag";

/** Infinite scroll keeps exactly 3 windows: previous | current | next. */
export const SCROLL_WINDOW_COUNT = 3;

export function getScrollBufferDayCount(numVisibleDays) {
  return numVisibleDays * SCROLL_WINDOW_COUNT;
}

export function getCenterWindowStartIndex(numVisibleDays) {
  return numVisibleDays;
}

/** Sun–Sat week contract: week always starts on Sunday (day 0). */
export function getSundayWeekStart(date) {
  return dayjs(date).day(0).startOf("day");
}

/** 3-window buffer page boundaries: 0, numVisibleDays, 2*numVisibleDays */
export function snapToPageStartIndex(rawIndex, numVisibleDays, dataLength) {
  if (typeof rawIndex !== "number" || !numVisibleDays) {
    return rawIndex ?? 0;
  }
  const page = Math.round(rawIndex / numVisibleDays) * numVisibleDays;
  const maxPageStart = Math.max(0, dataLength - numVisibleDays);
  return Math.max(0, Math.min(page, maxPageStart));
}

export function alignWeekStartIndex(data, roughIndex) {
  if (!data?.length || typeof roughIndex !== "number") {
    return roughIndex ?? 0;
  }

  const safeRough = Math.max(0, Math.min(roughIndex, data.length - 1));
  const anchorDate = data[safeRough]?.date;
  if (!anchorDate) {
    return safeRough;
  }

  const weekSunday = getSundayWeekStart(anchorDate);

  for (let i = safeRough; i >= 0; i--) {
    const entryDate = data[i]?.date;
    if (entryDate && dayjs(entryDate).isSame(weekSunday, "day")) {
      return i;
    }
  }

  for (let i = safeRough + 1; i < data.length; i++) {
    const entryDate = data[i]?.date;
    if (entryDate && dayjs(entryDate).isSame(weekSunday, "day")) {
      return i;
    }
  }

  return safeRough;
}

/**
 * Build a 3-window scroll buffer centered on visibleWeekSunday.
 * Returns data array and the index where that Sunday week starts.
 */
export function buildScrollBufferData({
  visibleWeekSunday,
  numVisibleDays,
  minDate,
  maxDate,
}) {
  const bufferDayCount = getScrollBufferDayCount(numVisibleDays);
  const targetSunday = getSundayWeekStart(visibleWeekSunday);

  let bufferStart = targetSunday.clone().subtract(numVisibleDays, "day");
  if (minDate && bufferStart.isBefore(minDate, "day")) {
    bufferStart = getSundayWeekStart(minDate);
    if (bufferStart.isBefore(minDate, "day")) {
      bufferStart = dayjs(minDate).startOf("day");
    }
  }

  const data = [];
  for (let i = 0; i < bufferDayCount; i++) {
    const date = bufferStart.clone().add(i, "day");
    if (maxDate && date.isAfter(maxDate, "day")) {
      break;
    }
    data.push({ date });
  }

  let anchorIndex = getCenterWindowStartIndex(numVisibleDays);
  for (let i = 0; i < data.length; i++) {
    if (data[i].date.isSame(targetSunday, "day")) {
      anchorIndex = i;
      break;
    }
  }

  return { data, anchorIndex };
}

export function shouldRebuildBufferBackward(pageStartIndex) {
  return pageStartIndex === 0;
}

export function shouldRebuildBufferForward(
  pageStartIndex,
  dataLength,
  numVisibleDays
) {
  return pageStartIndex >= dataLength - numVisibleDays;
}

/**
 * RecyclerListView visible index → Sun–Sat week range.
 */
export function getVisibleRangeAtIndex(data, startIndex, numVisibleItems) {
  if (!data?.length || typeof startIndex !== "number") {
    return null;
  }

  const alignedStart = snapToPageStartIndex(
    startIndex,
    numVisibleItems,
    data.length
  );
  const safeStart = Math.max(0, Math.min(alignedStart, data.length - 1));
  const endIndex = Math.min(safeStart + numVisibleItems - 1, data.length - 1);
  const visibleStartDate = data[safeStart]?.date;
  const visibleEndDate = data[endIndex]?.date;
  if (!visibleStartDate || !visibleEndDate) {
    return null;
  }

  return {
    visibleStartDate,
    visibleEndDate,
    visibleStartIndex: safeStart,
    visibleEndIndex: endIndex,
  };
}

export function auditVisibleRange(layer, event, range, extra = {}) {
  if (!range) {
    return null;
  }
  logWeekContractCheck(layer, event, range.visibleStartDate, range.visibleEndDate, {
    startIndex: range.visibleStartIndex,
    endIndex: range.visibleEndIndex,
    ...extra,
  });
  return range;
}

/**
 * Prefer RLV scroll offset, then snap to Sunday week boundary.
 */
export function resolveVisibleStartIndex(
  rlv,
  fallbackIndex,
  dataLength,
  data,
  numVisibleDays
) {
  let idx = rlv?.findApproxFirstVisibleIndex?.();
  if (typeof idx !== "number") {
    idx = fallbackIndex ?? 0;
  }
  const maxIndex = Math.max(0, dataLength - 1);
  const clamped = Math.max(0, Math.min(idx, maxIndex));
  if (!data?.length || !numVisibleDays) {
    return clamped;
  }
  return snapToPageStartIndex(clamped, numVisibleDays, dataLength);
}

/**
 * Reject infinite-scroll shift ghosts: forward jump >7 days from previous settled week.
 */
export function isPlausibleSettledWeek(prevStart, prevEnd, nextStart, nextEnd) {
  if (!prevStart || !prevEnd || !nextStart || !nextEnd) {
    return true;
  }
  const prevStartD = dayjs(prevStart);
  const prevEndD = dayjs(prevEnd);
  const nextStartD = dayjs(nextStart);
  const nextEndD = dayjs(nextEnd);

  if (nextStartD.day() !== 0 || nextEndD.day() !== 6) {
    logCalendarDiag(
      "scrollContracts",
      "isPlausibleSettledWeek",
      {
        prev: describeWeekRange(prevStartD, prevEndD),
        next: describeWeekRange(nextStartD, nextEndD),
        reason: "dow-mismatch",
      },
      "WEEK_CONTRACT_BREAK"
    );
    return false;
  }

  if (!nextEndD.isSame(nextStartD.add(6, "day"), "day")) {
    logCalendarDiag(
      "scrollContracts",
      "isPlausibleSettledWeek",
      {
        prev: describeWeekRange(prevStartD, prevEndD),
        next: describeWeekRange(nextStartD, nextEndD),
        reason: "span-not-6",
      },
      "WEEK_CONTRACT_BREAK"
    );
    return false;
  }

  const overlaps =
    nextStartD.isBetween(prevStartD, prevEndD, "day", "[]") ||
    nextEndD.isBetween(prevStartD, prevEndD, "day", "[]") ||
    prevStartD.isBetween(nextStartD, nextEndD, "day", "[]") ||
    prevEndD.isBetween(nextStartD, nextEndD, "day", "[]");
  if (overlaps) return true;

  const gap = Math.min(
    Math.abs(nextStartD.diff(prevEndD, "day")),
    Math.abs(prevStartD.diff(nextEndD, "day"))
  );
  if (gap <= 7) return true;

  if (nextStartD.isAfter(prevEndD.add(7, "day"))) {
    logCalendarDiag(
      "scrollContracts",
      "isPlausibleSettledWeek",
      {
        prev: describeWeekRange(prevStartD, prevEndD),
        next: describeWeekRange(nextStartD, nextEndD),
        reason: "forward-ghost-jump",
      },
      "GHOST_WEEK_REJECTED"
    );
    return false;
  }

  return true;
}
