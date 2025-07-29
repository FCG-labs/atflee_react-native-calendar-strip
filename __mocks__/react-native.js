// React Native 컴포넌트 모킹
const ReactNative = jest.requireActual('react-native');

// 간단한 컴포넌트 팩토리 함수
const mockComponent = (name) => {
  return jest.fn().mockImplementation(({ children, ...props }) => {
    return {
      $$typeof: Symbol.for('react.element'),
      type: name,
      props: { ...props, children },
      _owner: null,
      _store: {}
    };
  });
};

module.exports = {
  ...ReactNative,
  // 기본 컴포넌트 모킹
  View: mockComponent('View'),
  Text: mockComponent('Text'),
  TouchableOpacity: mockComponent('TouchableOpacity'),
  Image: mockComponent('Image'),
  ScrollView: mockComponent('ScrollView'),
  FlatList: mockComponent('FlatList'),
  // 애니메이션 관련
  Animated: {
    ...ReactNative.Animated,
    timing: jest.fn(() => ({
      start: jest.fn(cb => cb && cb({ finished: true }))
    }))
  },
  // 차원 관련
  Dimensions: {
    get: jest.fn().mockReturnValue({
      width: 375,
      height: 812,
      scale: 2,
      fontScale: 2
    })
  }
};
