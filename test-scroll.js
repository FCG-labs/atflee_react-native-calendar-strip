const dayjs = require('dayjs');
/* eslint-disable no-console */
const { CalendarController } = require('./src/controllers/CalendarController');

// 필요한 dayjs 플러그인 직접 로드
require('dayjs/plugin/isoWeek');
dayjs.extend(require('dayjs/plugin/isoWeek'));

// 테스트 로깅 함수
function log(message) {
  console.log(`[TEST] ${message}`);
}

// CalendarController 인스턴스 생성
const controller = new CalendarController({
  initialDate: new Date(),
  useIsoWeekday: false,
  numDaysInWeek: 7,
  minDate: dayjs().subtract(3, 'month').toDate(),  // 3개월 전으로 제한
  maxDate: dayjs().add(3, 'month').toDate(),       // 3개월 후로 제한
});

// 현재 로드된 주차 정보 출력
function printWeeksInfo() {
  const weeks = controller.getWeeks();
  const currentIndex = controller.getCurrentWeekIndex();
  
  log(`총 로드된 주차 수: ${weeks.length}`);
  log(`현재 주차 인덱스: ${currentIndex}`);
  log(`첫 주차 시작일: ${weeks[0].startDate.format('YYYY-MM-DD')}`);
  log(`마지막 주차 시작일: ${weeks[weeks.length - 1].startDate.format('YYYY-MM-DD')}`);
}

// 테스트 1: 초기 상태 확인
log('=== 테스트 1: 초기 상태 확인 ===');
printWeeksInfo();

// 테스트 2: 양방향 스크롤 시뮬레이션
log('\n=== 테스트 2: 양방향 스크롤 시뮬레이션 ===');
// 앞쪽으로 스크롤 (과거 방향)
const pastDate = dayjs().subtract(6, 'week');
log(`과거 방향 스크롤: ${pastDate.format('YYYY-MM-DD')} 까지 이동`);
controller.updateVisibleDates(
  pastDate.subtract(1, 'week'),  // 시작 날짜
  pastDate.add(1, 'week')        // 종료 날짜
);
printWeeksInfo();

// 뒤쪽으로 스크롤 (미래 방향)
const futureDate = dayjs().add(6, 'week');
log(`\n미래 방향 스크롤: ${futureDate.format('YYYY-MM-DD')} 까지 이동`);
controller.updateVisibleDates(
  futureDate.subtract(1, 'week'), // 시작 날짜
  futureDate.add(1, 'week')       // 종료 날짜
);
printWeeksInfo();

// 테스트 3: 경계 조건 테스트 (minDate/maxDate)
log('\n=== 테스트 3: 경계 조건 테스트 ===');
// 최소 날짜 근처로 스크롤
const nearMinDate = dayjs(controller._options.minDate).add(1, 'week');
log(`최소 날짜 근처 스크롤: ${nearMinDate.format('YYYY-MM-DD')} 까지 이동`);
controller.updateVisibleDates(
  nearMinDate.subtract(2, 'week'), // 의도적으로 minDate보다 이전으로 시도
  nearMinDate.add(1, 'week')
);
printWeeksInfo();

// 최대 날짜 근처로 스크롤
const nearMaxDate = dayjs(controller._options.maxDate).subtract(1, 'week');
log(`\n최대 날짜 근처 스크롤: ${nearMaxDate.format('YYYY-MM-DD')} 까지 이동`);
controller.updateVisibleDates(
  nearMaxDate.subtract(1, 'week'),
  nearMaxDate.add(2, 'week')  // 의도적으로 maxDate보다 이후로 시도
);
printWeeksInfo();

// 테스트 4: 날짜 선택 테스트
log('\n=== 테스트 4: 날짜 선택 테스트 ===');
const selectDate = dayjs().add(2, 'week');
log(`선택할 날짜: ${selectDate.format('YYYY-MM-DD')}`);
controller.selectDate(selectDate);
log(`선택된 날짜: ${controller.getSelectedDate().format('YYYY-MM-DD')}`);
log(`현재 주차 인덱스: ${controller.getCurrentWeekIndex()}`);
