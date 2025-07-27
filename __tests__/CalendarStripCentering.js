import React from 'react';
import { render } from '@testing-library/react-native';
import { FlatList } from 'react-native';
import CalendarStrip from '../src/components/CalendarStrip';

describe('CalendarStrip initial centering', () => {
  it('centers FlatList without delay when paging enabled', () => {
    const spy = jest.spyOn(FlatList.prototype, 'scrollToIndex').mockImplementation(() => {});
    render(<CalendarStrip showMonth={false} scrollerPaging />);
    expect(spy).toHaveBeenCalledWith({ index: 1, animated: true });
    spy.mockRestore();
  });
});
