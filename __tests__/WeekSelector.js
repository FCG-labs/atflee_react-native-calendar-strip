import React from "react";
import { configure, shallow } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import dayjs from "../src/dayjs";

import WeekSelector from "../src/WeekSelector";

configure({ adapter: new Adapter() });

const today = dayjs();

describe("WeekSelector Component", () => {
  it("should render without issues", () => {
    const component = shallow(
      <WeekSelector size={50} />
    );

    expect(component).toBeTruthy();
  });

});
