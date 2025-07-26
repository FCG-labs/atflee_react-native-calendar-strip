package com.atflee.calendarstrip;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

/**
 * Native module for calendar operations
 * Provides optimized date calculations and week generation
 */
public class ATFCalendarModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "ATFCalendarModule";
    private static final SimpleDateFormat ISO_DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
    private static final SimpleDateFormat ISO_DATE_ONLY_FORMAT = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
    
    static {
        ISO_DATE_FORMAT.setTimeZone(TimeZone.getTimeZone("UTC"));
        ISO_DATE_ONLY_FORMAT.setTimeZone(TimeZone.getTimeZone("UTC"));
    }
    
    // Calendar configuration
    private boolean mUseIsoWeek = false;
    private int mWeekLength = 7;
    
    // Calendar cache to improve performance
    private final Map<String, WritableArray> mWeekCache = new HashMap<>();

    public ATFCalendarModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    @NonNull
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * Initialize the calendar module with configuration
     * @param options Configuration options
     * @param promise Promise for result
     */
    @ReactMethod
    public void initialize(ReadableMap options, Promise promise) {
        try {
            if (options.hasKey("useIsoWeek")) {
                mUseIsoWeek = options.getBoolean("useIsoWeek");
            }
            
            if (options.hasKey("weekLength")) {
                mWeekLength = options.getInt("weekLength");
            }
            
            // Clear cache on initialization
            mWeekCache.clear();
            
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("INIT_ERROR", "Failed to initialize calendar module", e);
        }
    }

    /**
     * Get the start date of the week containing the given date
     * @param isoDateString ISO date string
     * @param useIsoWeek Whether to use ISO week definition (Monday as first day)
     * @param promise Promise for result
     */
    @ReactMethod
    public void getWeekStart(String isoDateString, boolean useIsoWeek, Promise promise) {
        try {
            Date date = parseISODate(isoDateString);
            Calendar calendar = Calendar.getInstance();
            calendar.setTime(date);
            
            int firstDayOfWeek = useIsoWeek ? Calendar.MONDAY : Calendar.SUNDAY;
            calendar.setFirstDayOfWeek(firstDayOfWeek);
            
            // Move to the first day of the week
            while (calendar.get(Calendar.DAY_OF_WEEK) != firstDayOfWeek) {
                calendar.add(Calendar.DATE, -1);
            }
            
            // Set time to start of day
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            
            String weekStartIsoDate = ISO_DATE_ONLY_FORMAT.format(calendar.getTime());
            promise.resolve(weekStartIsoDate);
        } catch (Exception e) {
            promise.reject("DATE_ERROR", "Failed to calculate week start", e);
        }
    }

    /**
     * Generate a range of dates starting from a specific date
     * @param startIsoDate ISO date string of the start date
     * @param dayCount Number of days to generate
     * @param promise Promise for result
     */
    @ReactMethod
    public void generateDatesRange(String startIsoDate, int dayCount, Promise promise) {
        try {
            // Check if we have this range in cache
            String cacheKey = startIsoDate + "_" + dayCount;
            if (mWeekCache.containsKey(cacheKey)) {
                promise.resolve(mWeekCache.get(cacheKey));
                return;
            }
            
            Date startDate = parseISODate(startIsoDate);
            Calendar calendar = Calendar.getInstance();
            calendar.setTime(startDate);
            
            // Set time to start of day
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            
            WritableArray datesArray = new WritableNativeArray();
            
            // Get today for comparison
            Calendar today = Calendar.getInstance();
            today.set(Calendar.HOUR_OF_DAY, 0);
            today.set(Calendar.MINUTE, 0);
            today.set(Calendar.SECOND, 0);
            today.set(Calendar.MILLISECOND, 0);
            
            // Generate days
            for (int i = 0; i < dayCount; i++) {
                if (i > 0) {
                    calendar.add(Calendar.DATE, 1);
                }
                
                Date currentDate = calendar.getTime();
                
                WritableMap dateMap = new WritableNativeMap();
                dateMap.putString("dateString", ISO_DATE_ONLY_FORMAT.format(currentDate));
                dateMap.putInt("year", calendar.get(Calendar.YEAR));
                dateMap.putInt("month", calendar.get(Calendar.MONTH));
                dateMap.putInt("day", calendar.get(Calendar.DAY_OF_MONTH));
                dateMap.putInt("dayOfWeek", calendar.get(Calendar.DAY_OF_WEEK) - 1); // Convert to 0-indexed (0 = Sunday)
                dateMap.putBoolean("isToday", calendar.get(Calendar.YEAR) == today.get(Calendar.YEAR) &&
                                             calendar.get(Calendar.DAY_OF_YEAR) == today.get(Calendar.DAY_OF_YEAR));
                
                datesArray.pushMap(dateMap);
            }
            
            // Cache the result if it's a small range (typical week view)
            if (dayCount <= 31) {
                mWeekCache.put(cacheKey, datesArray);
            }
            
            promise.resolve(datesArray);
        } catch (Exception e) {
            promise.reject("DATE_ERROR", "Failed to generate dates range", e);
        }
    }
    
    /**
     * Parse ISO date string into Date object
     * @param isoDateString ISO date string
     * @return Date object
     * @throws ParseException if parsing fails
     */
    private Date parseISODate(String isoDateString) throws ParseException {
        try {
            return ISO_DATE_FORMAT.parse(isoDateString);
        } catch (ParseException e) {
            // Try with date-only format
            return ISO_DATE_ONLY_FORMAT.parse(isoDateString);
        }
    }
    
    /**
     * Clear the calendar cache
     * @param promise Promise for result
     */
    @ReactMethod
    public void clearCache(Promise promise) {
        mWeekCache.clear();
        promise.resolve(true);
    }
}
