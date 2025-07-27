import React from 'react';
import { View, ScrollView } from 'react-native';
import PropTypes from 'prop-types';

const Scroller = ({ children, style, ...rest }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={style} {...rest}>
    {children}
  </ScrollView>
);

Scroller.propTypes = {
  children: PropTypes.node,
  style: PropTypes.any,
  minDate: PropTypes.any,
  maxDate: PropTypes.any,
};

export default Scroller;
