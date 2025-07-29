/**
 * CalendarPlugin 기본 클래스
 * 
 * CalendarStripV2에서 사용할 수 있는 플러그인의 기본 인터페이스를 정의합니다.
 * 모든 플러그인은 이 클래스를 상속받아 구현해야 합니다.
 */
export class CalendarPluginBase {
  /**
   * 플러그인 생성자
   * @param {Object} options 플러그인 옵션
   */
  constructor(options = {}) {
    this.options = options;
    this.calendar = null;
  }

  /**
   * CalendarStripV2에 플러그인이 연결될 때 호출됩니다.
   * @param {CalendarStripV2} calendar CalendarStripV2 인스턴스
   */
  onAttach(calendar) {
    this.calendar = calendar;
    this.init();
  }

  /**
   * 플러그인 초기화 로직
   * 상속 클래스에서 구현해야 합니다.
   */
  init() {
    // 자식 클래스에서 구현해야 함
  }

  /**
   * CalendarStripV2에서 날짜가 선택될 때 호출됩니다.
   * @param {Dayjs} date 선택된 날짜
   * @returns {boolean|void} false를 반환하면 기본 선택 동작이 취소됩니다.
   */
  onDateSelected(date) {
    // 자식 클래스에서 필요시 구현
    return true;
  }

  /**
   * 날짜 아이템을 렌더링하기 전에 호출됩니다.
   * @param {Dayjs} date 렌더링할 날짜
   * @param {Object} defaultProps 기본 props
   * @returns {Object} 수정된 props
   */
  modifyDateItemProps(date, defaultProps) {
    // 자식 클래스에서 필요시 구현
    return defaultProps;
  }

  /**
   * 캘린더 헤더를 렌더링하기 전에 호출됩니다.
   * @param {Object} defaultProps 기본 props
   * @returns {Object} 수정된 props
   */
  modifyHeaderProps(defaultProps) {
    // 자식 클래스에서 필요시 구현
    return defaultProps;
  }

  /**
   * 플러그인 정리 작업을 수행합니다.
   */
  cleanup() {
    // 자식 클래스에서 필요시 구현
    this.calendar = null;
  }
}
