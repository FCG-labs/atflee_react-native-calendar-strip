/**
 * __DEV__ 전용 캘린더 진단 로그.
 * 복붙 시 [CalendarDiag] 로 grep, bugCode로 버그 유형 식별.
 *
 * bugCode 참고:
 * - WEEK_CONTRACT_BREAK  : visible week가 Sun–Sat( span 6 ) 아님
 * - GHOST_WEEK_REJECTED  : onScrollEnd 유령 주차 거부
 * - BUFFER_REBUILD       : 3-윈도우 버퍼 재생성
 * - SCROLL_SNAP_FIX      : RLV raw index → Sunday 정렬 보정
 * - SCROLL_TO_FORCE      : scrollToDateForce 호출
 * - PREVIEW_SUPPRESSED   : shifting 중 onWeekChanged 억제
 * - CREATE_DAYS          : datesList 재생성
 * - CDU_SKIP             : componentDidUpdate no-op
 * - CDU_SELECTED_ONLY    : selectedDate highlight만 갱신
 * - REBUILD_STORM        : 500ms 내 BUFFER_REBUILD 2회 이상
 */
let diagSeq = 0;
let lastRebuildTs = 0;
let rebuildBurstCount = 0;

export function noteBufferRebuild(layer, event, payload = {}) {
  const now = Date.now();
  const withinWindow = lastRebuildTs > 0 && now - lastRebuildTs <= 500;
  if (withinWindow) {
    rebuildBurstCount += 1;
  } else {
    rebuildBurstCount = 1;
  }
  const sincePrevMs = lastRebuildTs > 0 ? now - lastRebuildTs : 0;
  lastRebuildTs = now;
  if (rebuildBurstCount >= 2) {
    logCalendarDiag(
      layer,
      event,
      { ...payload, rebuildBurstCount, sincePrevMs },
      "REBUILD_STORM"
    );
  }
}

export function logCalendarDiag(layer, event, payload = {}, bugCode) {
  if (typeof __DEV__ === "undefined" || !__DEV__) {
    return;
  }
  diagSeq += 1;
  const tag = bugCode
    ? `[CalendarDiag][${bugCode}][${layer}.${event}]`
    : `[CalendarDiag][${layer}.${event}]`;
  console.log(tag, {
    seq: diagSeq,
    ts: Date.now(),
    ...payload,
  });
}

export function formatDiagDate(value) {
  if (!value) {
    return undefined;
  }
  const date = value.format ? value : null;
  if (date && typeof date.format === "function") {
    const dow = date.day();
    return {
      iso: date.format("YYYY-MM-DD"),
      dow,
      dowLabel: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow],
    };
  }
  return { raw: String(value) };
}

export function describeWeekRange(start, end) {
  if (!start || !end) {
    return { contractOk: false };
  }
  const startD = start.format ? start : null;
  const endD = end.format ? end : null;
  if (!startD || !endD) {
    return { contractOk: false };
  }
  const spanDays = endD.diff(startD, "day");
  const contractOk =
    startD.day() === 0 && endD.day() === 6 && spanDays === 6;
  return {
    start: formatDiagDate(startD),
    end: formatDiagDate(endD),
    spanDays,
    contractOk,
  };
}

export function logWeekContractCheck(layer, event, start, end, extra = {}) {
  const described = describeWeekRange(start, end);
  if (!described.contractOk) {
    logCalendarDiag(
      layer,
      event,
      { week: described, ...extra },
      "WEEK_CONTRACT_BREAK"
    );
  }
  return described;
}
