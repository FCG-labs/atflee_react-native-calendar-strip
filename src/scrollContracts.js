import dayjs from "./dayjs";

/**
 * RecyclerListView visible index → week range (Sun–Sat window).
 */
export function getVisibleRangeAtIndex(data, startIndex, numVisibleItems) {
  if (!data?.length || typeof startIndex !== "number") {
    return null;
  }
  const safeStart = Math.max(0, Math.min(startIndex, data.length - 1));
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

/**
 * Prefer RLV scroll offset over stale Scroller state during momentum end.
 */
export function resolveVisibleStartIndex(rlv, fallbackIndex, dataLength) {
  let idx = rlv?.findApproxFirstVisibleIndex?.();
  if (typeof idx !== "number") {
    idx = fallbackIndex ?? 0;
  }
  const maxIndex = Math.max(0, dataLength - 1);
  return Math.max(0, Math.min(idx, maxIndex));
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

  if (nextStartD.isAfter(prevEndD.add(7, "day"))) return false;

  return true;
}
