// 테스트 환경 설정 - 단순화된 버전

// 콘솔 경고 및 오류 억제
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});

// 제스처 핸들러 모킹
jest.mock('react-native-gesture-handler', () => ({
  createNativeWrapper: jest.fn(component => component),
  PanGestureHandler: ({ children }) => children,
  TapGestureHandler: ({ children }) => children,
  State: {
    ACTIVE: 'ACTIVE',
    END: 'END'
  }
}));

// Jest에서 React의 useMemo 등 동작을 모킹할 필요가 없으므로 개별 테스트에서 만 모킹함

// React Native 모킹 - 필요한 부분만 해서 충돌 방지
jest.mock('react-native', () => {
  return {
    StyleSheet: {
      create: jest.fn((styles) => styles),
      flatten: jest.fn((style) => style || {})
    },
    Dimensions: {
      get: jest.fn().mockReturnValue({
        width: 375,
        height: 812,
        scale: 2,
        fontScale: 2
      })
    },
    Animated: {
      Value: jest.fn().mockImplementation(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn().mockImplementation(() => ({
          interpolate: jest.fn()
        }))
      })),
      timing: jest.fn().mockImplementation(() => ({
        start: jest.fn().mockImplementation((callback) => callback && callback({ finished: true }))
      })),
      View: jest.fn().mockImplementation(({ children, style, ...props }) => ({
        $$typeof: Symbol.for('react.element'),
        type: 'Animated.View',
        props: { ...props, style, children }
      })),
      Text: jest.fn().mockImplementation(({ children, style, ...props }) => ({
        $$typeof: Symbol.for('react.element'),
        type: 'Animated.Text',
        props: { ...props, style, children }
      }))
    },
    View: jest.fn().mockImplementation(({ children, ...props }) => ({
      $$typeof: Symbol.for('react.element'),
      type: 'View',
      props: { ...props, children }
    })),
    Text: jest.fn().mockImplementation(({ children, ...props }) => ({
      $$typeof: Symbol.for('react.element'),
      type: 'Text',
      props: { ...props, children }
    })),
    TouchableOpacity: jest.fn().mockImplementation(({ children, ...props }) => ({
      $$typeof: Symbol.for('react.element'),
      type: 'TouchableOpacity',
      props: { ...props, children }
    })),
    ScrollView: jest.fn().mockImplementation(({ children, ...props }) => ({
      $$typeof: Symbol.for('react.element'),
      type: 'ScrollView',
      props: { ...props, children }
    }))
  };
});

// 테스트 시작시 모든 mock 클린업
jest.clearAllMocks();
