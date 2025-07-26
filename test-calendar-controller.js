// 테스트 코드입니다.
/* eslint-disable no-console */
import dayjs from 'dayjs';
import 'dayjs/plugin/isoWeek';
import { CalendarController } from './src/controllers/CalendarController';

dayjs.extend(require('dayjs/plugin/isoWeek'));

// 필요한 dayjs 플러그인 직접 로드
// require('dayjs/plugin/isoWeek');

// 테스트 로깅 함수
function log(message) {
  console.log(`[TEST] ${message}`);
}

// 테스트 1: 동적 주차 로딩 기능 테스트
function testDynamicWeekLoading() {
  log('=== 테스트 1: 동적 주차 로딩 기능 ===');
  
  // 컨트롤러 생성 (날짜 제약 설정)
  const controller = new CalendarController({
    initialDate: new Date(),
    minDate: dayjs().subtract(3, 'month').toDate(),
    maxDate: dayjs().add(3, 'month').toDate()
  });
  
  // 초기 상태 확인
  const initialWeeks = controller.getWeeks();
  log(`초기 로드된 주차 수: ${initialWeeks.length}`);
  log(`첫 주차: ${initialWeeks[0].startDate.format('YYYY-MM-DD')}`);
  log(`마지막 주차: ${initialWeeks[initialWeeks.length-1].startDate.format('YYYY-MM-DD')}`);
  
  // 과거 방향 스크롤 시뮬레이션
  const pastDate = dayjs().subtract(6, 'week');
  log(`\n과거 방향 스크롤 테스트 (${pastDate.format('YYYY-MM-DD')})...`);
  controller.updateVisibleDates(
    pastDate.subtract(1, 'week'),
    pastDate.add(1, 'week')
  );
  
  // 상태 확인
  const updatedWeeks = controller.getWeeks();
  log(`스크롤 후 주차 수: ${updatedWeeks.length}`);
  log(`첫 주차: ${updatedWeeks[0].startDate.format('YYYY-MM-DD')}`);
  log(`마지막 주차: ${updatedWeeks[updatedWeeks.length-1].startDate.format('YYYY-MM-DD')}`);
  
  // 테스트 결과 검증
  const addedWeeks = updatedWeeks.length - initialWeeks.length;
  log(`추가된 주차 수: ${addedWeeks}`);
  log(`과거 방향 스크롤 테스트 ${addedWeeks > 0 ? '성공' : '실패'}`);
  
  return addedWeeks > 0;
}

// 테스트 2: minDate/maxDate 제약 조건 테스트
function testDateConstraints() {
  log('\n=== 테스트 2: 날짜 제약 조건 ===');
  
  // 좁은 범위의 제약으로 컨트롤러 생성
  const minDate = dayjs().subtract(2, 'week').toDate();
  const maxDate = dayjs().add(2, 'week').toDate();
  
  const controller = new CalendarController({
    initialDate: new Date(),
    minDate,
    maxDate
  });
  
  const initialWeeks = controller.getWeeks();
  log(`초기 주차 수: ${initialWeeks.length}`);
  
  // minDate 이전으로 스크롤 시도
  const pastLimit = dayjs(minDate).subtract(3, 'week');
  log(`\nminDate 제약 테스트 (${pastLimit.format('YYYY-MM-DD')})...`);
  controller.updateVisibleDates(
    pastLimit.subtract(1, 'week'),
    pastLimit.add(1, 'week')
  );
  
  // 최소 날짜 제약으로 인해 주차가 제한적으로만 추가되는지 확인
  const weeksAfterPastScroll = controller.getWeeks();
  log(`minDate 이전 스크롤 후 주차 수: ${weeksAfterPastScroll.length}`);
  log(`첫 주차: ${weeksAfterPastScroll[0].startDate.format('YYYY-MM-DD')}`);
  log(`minDate 제약 ${dayjs(weeksAfterPastScroll[0].startDate).isAfter(dayjs(minDate).subtract(1, 'week')) ? '준수됨' : '위반됨'}`);
  
  return dayjs(weeksAfterPastScroll[0].startDate).isAfter(dayjs(minDate).subtract(1, 'week'));
}

// 테스트 3: 날짜 선택 테스트
function testDateSelection() {
  log('\n=== 테스트 3: 날짜 선택 ===');
  
  const controller = new CalendarController({
    initialDate: new Date()
  });
  
  // 현재 선택된 날짜 확인
  log(`초기 선택된 날짜: ${controller.getSelectedDate().format('YYYY-MM-DD')}`);
  
  // 새 날짜 선택
  const newDate = dayjs().add(10, 'day');
  log(`새 날짜 선택: ${newDate.format('YYYY-MM-DD')}`);
  controller.selectDate(newDate);
  
  // 선택된 날짜 확인
  const selectedDate = controller.getSelectedDate();
  log(`선택 후 날짜: ${selectedDate.format('YYYY-MM-DD')}`);
  
  return selectedDate.isSame(newDate, 'day');
}

// 모든 테스트 실행
function runAllTests() {
  const results = [];
  
  results.push({ name: '동적 주차 로딩', passed: testDynamicWeekLoading() });
  results.push({ name: '날짜 제약 조건', passed: testDateConstraints() });
  results.push({ name: '날짜 선택', passed: testDateSelection() });
  
  // 테스트 결과 요약
  log('\n=== 테스트 결과 요약 ===');
  let allPassed = true;
  
  results.forEach(result => {
    log(`${result.name}: ${result.passed ? '성공 ✅' : '실패 ❌'}`);
    if (!result.passed) allPassed = false;
  });
  
  log(`\n전체 테스트: ${allPassed ? '성공 ✅' : '일부 실패 ❌'}`);
}

// 테스트 실행
runAllTests();
