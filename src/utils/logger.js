const logger = {
  debug: (...args) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },
};

export default logger;
