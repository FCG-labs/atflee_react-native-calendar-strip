import { CalendarPluginBase } from './CalendarPluginBase';
import dayjs from 'dayjs';

/**
 * 날짜 범위 선택 플러그인
 * CalendarStripV2에 날짜 범위 선택 기능을 추가합니다.
 */
export class DateRangeSelectionPlugin extends CalendarPluginBase {
  constructor(options = {}) {
    super(options);
    this.startDate = null;
    this.endDate = null;
    this.isSelectingRange = false;
    this.rangeColor = options.rangeColor || '#E3F2FD';
    this.rangeSelectedCallback = options.onRangeSelected || null;
  }

  /**
   * 플러그인 초기화
   */
  init() {
    // 초기 설정이 필요하면 여기서 수행
    console.log('[DateRangePlugin] Initialized');
  }

  /**
   * 날짜 선택 이벤트 핸들러
   * @param {Dayjs} date 선택된 날짜
   * @returns {boolean} false면 기본 선택 동작 취소
   */
  onDateSelected(date) {
    if (!date || !date.isValid()) return true;

    // 범위 선택 모드에 따라 다르게 처리
    if (!this.isSelectingRange) {
      // 범위 선택 시작
      this.startDate = dayjs(date);
      this.endDate = null;
      this.isSelectingRange = true;
      console.log('[DateRangePlugin] Range selection started:', this.startDate.format('YYYY-MM-DD'));
    } else {
      // 범위 선택 완료
      this.endDate = dayjs(date);
      
      // 시작일이 종료일보다 이후라면 순서 교체
      if (this.startDate.isAfter(this.endDate)) {
        const temp = this.startDate;
        this.startDate = this.endDate;
        this.endDate = temp;
      }
      
      this.isSelectingRange = false;
      
      console.log('[DateRangePlugin] Range selection completed:', 
        this.startDate.format('YYYY-MM-DD'), 'to', this.endDate.format('YYYY-MM-DD'));
      
      // 콜백 실행
      if (this.rangeSelectedCallback) {
        this.rangeSelectedCallback({
          startDate: this.startDate.toDate(),
          endDate: this.endDate.toDate(),
        });
      }
    }
    
    // 캘린더 UI 업데이트 요청 (강제 리렌더링)
    if (this.calendar && this.calendar.forceUpdate) {
      this.calendar.forceUpdate();
    }
    
    // true를 반환하여 기본 날짜 선택 동작도 수행
    return true;
  }

  /**
   * 날짜 아이템 Props 수정
   * @param {Dayjs} date 날짜
   * @param {Object} defaultProps 기본 props
   * @returns {Object} 수정된 props
   */
  modifyDateItemProps(date, defaultProps) {
    const props = { ...defaultProps };
    
    // 날짜가 범위 내에 있는지 확인
    if (this.startDate && this.endDate && 
        date.isSameOrAfter(this.startDate, 'day') && 
        date.isSameOrBefore(this.endDate, 'day')) {
      // 범위 내 날짜 스타일 적용
      props.containerStyle = [
        props.containerStyle,
        { backgroundColor: this.rangeColor }
      ];
    } 
    else if (this.startDate && date.isSame(this.startDate, 'day')) {
      // 시작일 스타일
      props.containerStyle = [
        props.containerStyle,
        { backgroundColor: this.rangeColor, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 }
      ];
    }
    
    return props;
  }

  /**
   * 현재 선택된 날짜 범위 가져오기
   * @returns {Object|null} {startDate, endDate} 또는 선택이 완료되지 않았으면 null
   */
  getSelectedRange() {
    if (this.startDate && this.endDate) {
      return {
        startDate: this.startDate.toDate(),
        endDate: this.endDate.toDate()
      };
    }
    return null;
  }

  /**
   * 날짜 범위 선택 초기화
   */
  resetSelection() {
    this.startDate = null;
    this.endDate = null;
    this.isSelectingRange = false;
    
    // 캘린더 UI 업데이트
    if (this.calendar && this.calendar.forceUpdate) {
      this.calendar.forceUpdate();
    }
  }

  /**
   * 플러그인 정리
   */
  cleanup() {
    this.startDate = null;
    this.endDate = null;
    this.isSelectingRange = false;
    this.rangeSelectedCallback = null;
    super.cleanup();
  }
}
