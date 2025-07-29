import { useContext as _useContext } from 'react';

let _useContextSelector;

try {
  // Try to import from optional dependency
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  _useContextSelector = require('use-context-selector').useContextSelector;
} catch (err) {
  // Fallback: emulate minimal selector behaviour using built-in useContext
  // NOTE: This degrades to re-render on any context change, but still returns selector(ctx)
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn('[WARN] use-context-selector not installed, falling back to useContext');
  }
  _useContextSelector = (Context, selector) => {
    const value = _useContext(Context);
    return selector(value);
  };
}

export const useContextSelector = _useContextSelector;
