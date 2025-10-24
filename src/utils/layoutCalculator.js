/**
 * Layout calculation utilities for CalendarStrip
 * Implements mathematically precise space-around layout
 * 
 * Enhanced by FCG (https://fcg.kr)
 */

// ==========================================
// Layout Constants
// ==========================================

/**
 * Space-around ratio: gap size relative to item width
 * gap = SPACE_AROUND_RATIO × itemWidth
 * 
 * For a visually balanced space-around layout,
 * a ratio between 0.1-0.15 works well.
 */
export const SPACE_AROUND_RATIO = 0.12;

/**
 * Font size ratios relative to day component width
 */
export const FONT_SIZE_RATIOS = {
  // Month text: approximately 1/3 of day width
  MONTH: 1 / 3.2,
  // Day name text: approximately 1/5 of day width
  DAY_NAME: 1 / 5,
  // Day number text: approximately 1/3 of day width
  DAY_NUMBER: 1 / 2.9,
};

/**
 * Week selector icon size relative to day width
 */
export const SELECTOR_SIZE_RATIO = 1 / 2.5;

// ==========================================
// Layout Calculation Functions
// ==========================================

/**
 * Calculate space-around layout for calendar items
 * 
 * Space-around definition:
 * [gap] [item] [gap] [item] [gap] ... [item] [gap]
 * 
 * Total width equation:
 * W = gap × (N + 1) + itemWidth × N
 * where gap = SPACE_AROUND_RATIO × itemWidth
 * 
 * Solving for itemWidth:
 * W = itemWidth × SPACE_AROUND_RATIO × (N + 1) + itemWidth × N
 * W = itemWidth × (SPACE_AROUND_RATIO × (N + 1) + N)
 * itemWidth = W / (N × (1 + SPACE_AROUND_RATIO) + SPACE_AROUND_RATIO)
 * 
 * @param {number} containerWidth - Total available width in pixels
 * @param {number} numItems - Number of items to display (e.g., 7 or 14)
 * @param {number} ratio - Gap to item width ratio (default: SPACE_AROUND_RATIO)
 * @returns {Object} Layout metrics
 * @returns {number} returns.itemWidth - Width of each item
 * @returns {number} returns.gap - Gap between items
 * @returns {number} returns.totalWidth - Total calculated width (should equal containerWidth)
 */
export function calculateSpaceAroundLayout(
  containerWidth,
  numItems,
  ratio = SPACE_AROUND_RATIO
) {
  if (numItems <= 0) {
    return { itemWidth: 0, gap: 0, totalWidth: 0 };
  }

  // Calculate ideal item width from space-around formula
  const itemWidth = containerWidth / (numItems * (1 + ratio) + ratio);
  const gap = itemWidth * ratio;

  // Round to nearest pixel for pixel-perfect rendering
  const roundedItemWidth = Math.floor(itemWidth);
  const roundedGap = Math.floor(gap);

  // Calculate remainder due to rounding
  const totalCalculated = roundedItemWidth * numItems + roundedGap * (numItems + 1);
  const remainder = containerWidth - totalCalculated;

  return {
    itemWidth: roundedItemWidth,
    gap: roundedGap,
    // Distribute remainder pixels across gaps to maintain visual balance
    remainderPixels: remainder,
    totalWidth: totalCalculated + remainder,
  };
}

/**
 * Calculate font sizes based on day component width
 * 
 * @param {number} dayComponentWidth - Width of a single day component
 * @returns {Object} Font size metrics
 */
export function calculateFontSizes(dayComponentWidth) {
  return {
    monthFontSize: Math.round(dayComponentWidth * FONT_SIZE_RATIOS.MONTH),
    dateNameFontSize: Math.round(dayComponentWidth * FONT_SIZE_RATIOS.DAY_NAME),
    dateNumberFontSize: Math.round(dayComponentWidth * FONT_SIZE_RATIOS.DAY_NUMBER),
    selectorSize: Math.round(dayComponentWidth * SELECTOR_SIZE_RATIO),
  };
}

/**
 * Calculate responsive day component dimensions
 * 
 * @param {number} containerWidth - Total available width
 * @param {number} numDaysInWeek - Number of days to display (7 or 14)
 * @param {Object} constraints - Size constraints
 * @param {number} constraints.maxDayComponentSize - Maximum allowed day width
 * @param {number} constraints.minDayComponentSize - Minimum allowed day width
 * @param {number} constraints.responsiveSizingOffset - Additional offset for sizing
 * @param {boolean} scrollable - Whether the calendar is scrollable
 * @returns {Object} Complete layout metrics
 */
export function calculateResponsiveLayout(
  containerWidth,
  numDaysInWeek,
  constraints = {},
  scrollable = false
) {
  const {
    maxDayComponentSize = 80,
    minDayComponentSize = 10,
    responsiveSizingOffset = 0,
  } = constraints;

  let layout;

  if (scrollable) {
    // For scrollable mode, use space-around layout
    layout = calculateSpaceAroundLayout(containerWidth, numDaysInWeek);
    
    // Apply size constraints
    let constrainedItemWidth = layout.itemWidth + responsiveSizingOffset;
    constrainedItemWidth = Math.min(constrainedItemWidth, maxDayComponentSize);
    constrainedItemWidth = Math.max(constrainedItemWidth, minDayComponentSize);

    // Recalculate actual number of visible days based on constrained size
    const numVisibleDays = Math.floor(
      containerWidth / (constrainedItemWidth + layout.gap)
    );

    return {
      dayComponentWidth: constrainedItemWidth,
      marginHorizontal: layout.gap,
      numVisibleDays: Math.max(1, numVisibleDays),
      ...calculateFontSizes(constrainedItemWidth),
    };
  } else {
    // For non-scrollable mode, simply divide width equally
    let dayComponentWidth = containerWidth / numDaysInWeek + responsiveSizingOffset;
    dayComponentWidth = Math.min(dayComponentWidth, maxDayComponentSize);
    dayComponentWidth = Math.max(dayComponentWidth, minDayComponentSize);

    return {
      dayComponentWidth,
      marginHorizontal: 0,
      numVisibleDays: numDaysInWeek,
      ...calculateFontSizes(dayComponentWidth),
    };
  }
}
