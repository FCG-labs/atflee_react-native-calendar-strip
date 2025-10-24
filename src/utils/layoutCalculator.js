export const SPACE_AROUND_RATIO = 0.12;

export const FONT_SIZE_RATIOS = {
  MONTH: 1 / 3.2,
  DAY_NAME: 1 / 5,
  DAY_NUMBER: 1 / 2.9,
};

export const SELECTOR_SIZE_RATIO = 1 / 2.5;

export function calculateSpaceAroundLayout(
  containerWidth,
  numItems,
  ratio = SPACE_AROUND_RATIO
) {
  if (numItems <= 0) {
    return { itemWidth: 0, gap: 0 };
  }

  const itemWidth = containerWidth / (numItems * (1 + 2 * ratio));
  const gap = itemWidth * ratio;

  return {
    itemWidth: Math.round(itemWidth),
    gap: Math.round(gap),
  };
}

export function calculateFontSizes(dayComponentWidth) {
  return {
    monthFontSize: Math.round(dayComponentWidth * FONT_SIZE_RATIOS.MONTH),
    dateNameFontSize: Math.round(dayComponentWidth * FONT_SIZE_RATIOS.DAY_NAME),
    dateNumberFontSize: Math.round(dayComponentWidth * FONT_SIZE_RATIOS.DAY_NUMBER),
    selectorSize: Math.round(dayComponentWidth * SELECTOR_SIZE_RATIO),
  };
}

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
    layout = calculateSpaceAroundLayout(containerWidth, numDaysInWeek);
    
    let constrainedItemWidth = layout.itemWidth + responsiveSizingOffset;
    constrainedItemWidth = Math.min(constrainedItemWidth, maxDayComponentSize);
    constrainedItemWidth = Math.max(constrainedItemWidth, minDayComponentSize);

    return {
      dayComponentWidth: constrainedItemWidth,
      marginHorizontal: layout.gap,
      numVisibleDays: numDaysInWeek,
      ...calculateFontSizes(constrainedItemWidth),
    };
  } else {
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
