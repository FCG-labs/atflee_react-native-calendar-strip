#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ATFCalendarModule, NSObject)

RCT_EXTERN_METHOD(initialize:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getWeekStart:(NSString *)isoDateString
                 useIsoWeek:(BOOL)useIsoWeek
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(generateDatesRange:(NSString *)startIsoDate
                 dayCount:(NSInteger)dayCount
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearCache:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)

@end
