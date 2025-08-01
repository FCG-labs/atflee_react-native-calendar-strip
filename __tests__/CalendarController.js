import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import CalendarController from '../src/controllers/CalendarController';

// Initialize dayjs plugins as done in the actual implementation
dayjs.extend(isoWeek);

describe('CalendarController', () => {
  let controller;
  
  beforeEach(() => {
    // 각 테스트 전에 새로운 컨트롤러 인스턴스 생성
    controller = new CalendarController();
  });
  
  describe('initialization', () => {
    it('should initialize with default options', () => {
      expect(controller._options).toBeDefined();
      expect(controller._options.initialDate).toBeDefined();
      expect(controller._options.useIsoWeekday).toBe(false);
      expect(controller._options.numDaysInWeek).toBe(7);
    });
    
    it('should initialize with custom options', () => {
      const customController = new CalendarController({
        initialDate: new Date(2025, 0, 1),
        useIsoWeekday: true,
        numDaysInWeek: 5
      });
      
      expect(customController._options.initialDate).toEqual(new Date(2025, 0, 1));
      expect(customController._options.useIsoWeekday).toBe(true);
      expect(customController._options.numDaysInWeek).toBe(5);
    });
    
    it('should initialize _weeks as an array', () => {
      // CalendarController는 생성자에서 _initialize()를 호출하여 미리 주변 주를 준비함
      // 기본 weekBuffer 값은 3으로, 총 3주가 준비되어야 함
      expect(Array.isArray(controller._weeks)).toBe(true);
      expect(controller._weeks.length).toBe(3);
    });

    it('should respect custom weekBuffer size', () => {
      const customController = new CalendarController({ weekBuffer: 5 });
      expect(customController.getWeeks().length).toBe(5);
    });
  });
  
  describe('_generateDay', () => {
    it('should generate day object with correct properties from dayjs object', () => {
      const testDate = dayjs('2025-01-01');
      const dayObj = controller._generateDay(testDate);
      
      expect(dayObj).toBeDefined();
      expect(dayObj.date).toBeInstanceOf(Date); // 네이티브 Date 객체 반환
      expect(dayObj.dateString).toBe('2025-01-01');
      expect(dayObj.dayOfMonth).toBe(1);
      expect(dayObj.month).toBe(0); // 0-based month (January)
      expect(dayObj.year).toBe(2025);
      expect(typeof dayObj.isToday).toBe('boolean');
    });
    
    it('should generate day object with correct properties from native Date object', () => {
      const testDate = new Date(2025, 0, 1); // 2025-01-01
      const dayObj = controller._generateDay(testDate);
      
      expect(dayObj).toBeDefined();
      expect(dayObj.date).toBeInstanceOf(Date);
      expect(dayObj.dateString).toBe('2025-01-01');
      expect(dayObj.dayOfMonth).toBe(1);
    });
    
    it('should generate day object with correct properties from date string', () => {
      const testDateStr = '2025-01-01';
      const dayObj = controller._generateDay(testDateStr);
      
      expect(dayObj).toBeDefined();
      expect(dayObj.date).toBeInstanceOf(Date);
      expect(dayObj.dateString).toBe('2025-01-01');
    });
    
    it('should return null for invalid date', () => {
      const invalidDate = 'not-a-date';
      const dayObj = controller._generateDay(invalidDate);
      
      expect(dayObj).toBeNull();
    });
  });
  
  describe('_generateWeek', () => {
    it('should generate a week with 7 days by default', () => {
      const startDate = dayjs('2025-01-01');
      const week = controller._generateWeek(startDate);
      
      expect(week).toBeDefined();
      expect(week.days).toBeDefined();
      expect(week.days.length).toBe(7);
      expect(week.id).toBe('2025-01-01');
    });
    
    it('should generate a week with custom number of days', () => {
      const customController = new CalendarController({
        numDaysInWeek: 5
      });
      const startDate = dayjs('2025-01-01');
      const week = customController._generateWeek(startDate);
      
      expect(week).toBeDefined();
      expect(week.days).toBeDefined();
      expect(week.days.length).toBe(5);
    });
    
  });
  
  describe('findWeekIndexByDate', () => {
    it('should handle date not in prepared weeks', () => {
      // 매우 먼 미래의 날짜를 검색 - 준비된 주에 포함되지 않을 것임
      const farFutureDate = dayjs().add(2, 'year');
      const index = controller.findWeekIndexByDate(farFutureDate);
      expect(index).toBe(-1);
    });
    
    it('should find the correct week index for a date', () => {
      // 주를 준비하고 날짜 검색 테스트
      controller._prepareWeeks(dayjs(), 3);
      const date = dayjs().add(1, 'day');
      const index = controller.findWeekIndexByDate(date);
      
      // 현재 주가 중앙(인덱스 1)에 있어야 함
      expect(index).toBe(1);
    });
  });
  
  describe('selectDate', () => {
    it('should update the selected date', () => {
      const newDate = new Date(2025, 0, 1);
      controller.selectDate(newDate);
      
      const selectedDate = controller.getSelectedDate();
      expect(dayjs(selectedDate).format('YYYY-MM-DD')).toBe('2025-01-01');
    });
  });

  describe('jumpToDate', () => {
    it('should prepare weeks using weekBuffer', () => {
      const custom = new CalendarController({ weekBuffer: 5 });
      const target = dayjs().add(2, 'month').toDate();
      custom.jumpToDate(target);
      expect(custom.getWeeks().length).toBe(5);
      expect(custom.getSelectedDate().isSame(dayjs(target), 'day')).toBe(true);
    });
  });
  
  describe('navigation', () => {
    beforeEach(() => {
      // 주간 데이터 준비
      controller._prepareWeeks(dayjs(), 3);
    });
    
    it('should navigate to the previous week', () => {
      const initialIndex = controller.getCurrentWeekIndex();
      controller.goToPreviousWeek();
      const newIndex = controller.getCurrentWeekIndex();
      
      expect(newIndex).toBe(initialIndex - 1);
    });
    
    it('should navigate to the next week', () => {
      const initialIndex = controller.getCurrentWeekIndex();
      controller.goToNextWeek();
      const newIndex = controller.getCurrentWeekIndex();

      expect(newIndex).toBe(initialIndex + 1);
    });

    it('should stop at maxDate when navigating forward', () => {
      controller = new CalendarController({
        initialDate: new Date(2025, 0, 7),
        maxDate: new Date(2025, 0, 10)
      });

      const initialIndex = controller.getCurrentWeekIndex();
      controller.goToNextWeek();
      const newIndex = controller.getCurrentWeekIndex();

      expect(newIndex).toBe(initialIndex);
    });

    it('should stop at minDate when navigating backward', () => {
      controller = new CalendarController({
        initialDate: new Date(2025, 0, 2),
        minDate: new Date(2025, 0, 1)
      });

      const initialIndex = controller.getCurrentWeekIndex();
      controller.goToPreviousWeek();
      const newIndex = controller.getCurrentWeekIndex();

      expect(newIndex).toBe(initialIndex);
    });
  });
});
