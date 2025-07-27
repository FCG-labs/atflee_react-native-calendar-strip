import React from 'react';
import { TouchableOpacity, Image } from 'react-native';
import PropTypes from 'prop-types';

const WeekSelector = ({ onPress, icon, size = 24, children }) => (
  <TouchableOpacity onPress={onPress}>
    {children || (icon ? <Image source={icon} style={{ width: size, height: size }} /> : null)}
  </TouchableOpacity>
);

WeekSelector.propTypes = {
  onPress: PropTypes.func,
  icon: PropTypes.any,
  size: PropTypes.number,
  children: PropTypes.node,
  controlDate: PropTypes.any,
  weekStartDate: PropTypes.any,
  weekEndDate: PropTypes.any,
};

export default WeekSelector;
