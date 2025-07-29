// 테스트 환경 설정
import { NativeModules } from 'react-native';
import 'react-native-gesture-handler/jestSetup';

// React Native의 Dimensions 모킹
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn().mockReturnValue({
    width: 375,
    height: 812,
    scale: 2,
    fontScale: 2
  }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

// React Native의 Animated 모킹
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // 애니메이션 관련 모킹
  RN.Animated.timing = () => ({
    start: jest.fn(cb => cb && cb({ finished: true })),
  });
  
  return RN;
});

// 콘솔 경고 및 오류 억제
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
