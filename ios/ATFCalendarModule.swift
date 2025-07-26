import Foundation

@objc(ATFCalendarModule)
class ATFCalendarModule: NSObject {
  
  // Calendar configuration
  private var useIsoWeek: Bool = false
  private var weekLength: Int = 7
  
  // Cache for week data
  private var weekCache: [String: [[String: Any]]] = [:]
  
  // Date formatters
  private let isoDateFormatter: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter
  }()
  
  private let isoDateOnlyFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    formatter.timeZone = TimeZone(abbreviation: "UTC")
    formatter.locale = Locale(identifier: "en_US_POSIX")
    return formatter
  }()
  
  @objc(initialize:resolver:rejecter:)
  func initialize(_ options: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    if let useIsoWeekOption = options["useIsoWeek"] as? Bool {
      useIsoWeek = useIsoWeekOption
    }
    
    if let weekLengthOption = options["weekLength"] as? Int {
      weekLength = weekLengthOption
    }
    
    // Clear cache on initialization
    weekCache.removeAll()
    
    resolve(true)
  }
  
  @objc(getWeekStart:useIsoWeek:resolver:rejecter:)
  func getWeekStart(_ isoDateString: String, useIsoWeek: Bool, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let date = parseISODate(isoDateString) else {
      reject("DATE_ERROR", "Invalid date format", nil)
      return
    }
    
    var calendar = Calendar.current
    calendar.timeZone = TimeZone(abbreviation: "UTC")!
    calendar.firstWeekday = useIsoWeek ? 2 : 1 // 1: Sunday, 2: Monday
    
    // Get the start of the week containing the date
    guard let weekStart = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)) else {
      reject("DATE_ERROR", "Failed to calculate week start", nil)
      return
    }
    
    // Format as ISO string
    let weekStartString = isoDateOnlyFormatter.string(from: weekStart)
    resolve(weekStartString)
  }
  
  @objc(generateDatesRange:dayCount:resolver:rejecter:)
  func generateDatesRange(_ startIsoDate: String, dayCount: Int, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let startDate = parseISODate(startIsoDate) else {
      reject("DATE_ERROR", "Invalid date format", nil)
      return
    }
    
    // Check cache
    let cacheKey = "\(startIsoDate)_\(dayCount)"
    if let cachedData = weekCache[cacheKey] {
      resolve(cachedData)
      return
    }
    
    var calendar = Calendar.current
    calendar.timeZone = TimeZone(abbreviation: "UTC")!
    
    // Today for comparison
    let today = calendar.startOfDay(for: Date())
    
    // Generate dates
    var datesArray: [[String: Any]] = []
    
    for i in 0..<dayCount {
      guard let currentDate = calendar.date(byAdding: .day, value: i, to: startDate) else {
        continue
      }
      
      let components = calendar.dateComponents([.year, .month, .day, .weekday], from: currentDate)
      let isToday = calendar.isDate(currentDate, inSameDayAs: today)
      
      let dateMap: [String: Any] = [
        "dateString": isoDateOnlyFormatter.string(from: currentDate),
        "year": components.year ?? 0,
        "month": (components.month ?? 1) - 1, // Convert to 0-indexed for JS
        "day": components.day ?? 1,
        "dayOfWeek": ((components.weekday ?? 1) - 1), // Convert to 0-indexed (0 = Sunday)
        "isToday": isToday
      ]
      
      datesArray.append(dateMap)
    }
    
    // Cache if it's a reasonably sized range
    if dayCount <= 31 {
      weekCache[cacheKey] = datesArray
    }
    
    resolve(datesArray)
  }
  
  @objc(clearCache:rejecter:)
  func clearCache(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    weekCache.removeAll()
    resolve(true)
  }
  
  // Helper to parse ISO date string
  private func parseISODate(_ isoDateString: String) -> Date? {
    if let date = isoDateFormatter.date(from: isoDateString) {
      return date
    }
    return isoDateOnlyFormatter.date(from: isoDateString)
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
