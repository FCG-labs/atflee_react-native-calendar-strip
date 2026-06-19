import dayjs from "./dayjs";
import { getSundayWeekStart } from "./scrollContracts";

/** Build Sun–Sat row for one anchor week. */
export function buildWeekRowData(anchorWeekSunday, numVisibleDays, minDate, maxDate) {
  const weekStart = getSundayWeekStart(anchorWeekSunday);
  const data = [];

  for (let i = 0; i < numVisibleDays; i++) {
    const date = weekStart.clone().add(i, "day");
    if (minDate && date.isBefore(minDate, "day")) {
      continue;
    }
    if (maxDate && date.isAfter(maxDate, "day")) {
      break;
    }
    data.push({ date });
  }

  const weekEnd = weekStart.clone().add(numVisibleDays - 1, "day");
  return {
    weekStart,
    weekEnd,
    data,
  };
}

export function clampAnchorWeekSunday(candidate, minDate, maxDate) {
  let anchor = getSundayWeekStart(candidate);
  if (minDate) {
    const minSunday = getSundayWeekStart(minDate);
    if (anchor.isBefore(minSunday, "day")) {
      anchor = minSunday;
    }
  }
  if (maxDate) {
    const maxSunday = getSundayWeekStart(maxDate);
    if (anchor.isAfter(maxSunday, "day")) {
      anchor = maxSunday;
    }
  }
  return anchor;
}

export function shiftAnchorWeek(anchorWeekSunday, deltaWeeks, minDate, maxDate) {
  const next = getSundayWeekStart(anchorWeekSunday).add(deltaWeeks * 7, "day");
  return clampAnchorWeekSunday(next, minDate, maxDate);
}

export function isDateInNeighborWeeks(anchorWeekSunday, date, numVisibleDays = 7) {
  const target = dayjs(date).startOf("day");
  const center = getSundayWeekStart(anchorWeekSunday);
  const prev = center.clone().subtract(numVisibleDays, "day");
  const nextEnd = center.clone().add(numVisibleDays * 2 - 1, "day");
  return !target.isBefore(prev, "day") && !target.isAfter(nextEnd, "day");
}
