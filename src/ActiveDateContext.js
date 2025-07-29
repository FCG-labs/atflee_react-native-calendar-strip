import React from 'react';

// Context used to broadcast the current active date to all CalendarDateItem
// components without relying on FlatList extraData updates.
const ActiveDateContext = React.createContext(null);

export default ActiveDateContext;
