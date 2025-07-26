import React from "react";
import { configure, shallow } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import dayjs from "../src/dayjs";

import CalendarStrip from "../src/CalendarStrip";

configure({ adapter: new Adapter() });

describe("CalendarStrip getMaxSimultaneousDays", () => {
  it("returns week buffer default when no range provided", () => {
    const component = shallow(<CalendarStrip />);
    const instance = component.instance();
    expect(instance.getMaxSimultaneousDays()).toBe(21); // 3 weeks
  });

  it("returns diff when range is smaller", () => {
    const min = dayjs("2025-01-01");
    const max = dayjs("2025-01-10");
    const component = shallow(<CalendarStrip minDate={min} maxDate={max} />);
    const instance = component.instance();
    expect(instance.getMaxSimultaneousDays()).toBe(10);
  });

  it("returns buffer when range is larger", () => {
    const min = dayjs("2010-01-01");
    const max = dayjs("2030-12-31");
    const component = shallow(<CalendarStrip minDate={min} maxDate={max} />);
    const instance = component.instance();
    expect(instance.getMaxSimultaneousDays()).toBe(21);
  });

  it("respects custom weekBuffer", () => {
    const component = shallow(<CalendarStrip weekBuffer={5} />);
    const instance = component.instance();
    expect(instance.getMaxSimultaneousDays()).toBe(35);
  });

  it("uses numDaysInWeek for multi-week views", () => {
    const component = shallow(
      <CalendarStrip numDaysInWeek={14} weekBuffer={2} />
    );
    const instance = component.instance();
    expect(instance.getMaxSimultaneousDays()).toBe(28);
  });
});
