import React from "react";
import { configure, shallow } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import dayjs from "../src/dayjs";

import CalendarScroller from "../src/Scroller";

configure({ adapter: new Adapter() });

const today = dayjs();

describe("CalendarScroller Component", () => {
  it("should render without issues", () => {
    const component = shallow(
      <CalendarScroller
        minDate={today.clone().subtract(1, "w")}
        maxDate={today.clone().add(1, "w")}
      />
    );

    expect(component).toBeTruthy();
  });

});
