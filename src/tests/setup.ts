import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

declare global {
  // React 18 test env flag to avoid act() warnings on async user events.
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

class ResizeObserverMock {
  observe(_target?: Element) {}
  unobserve(_target?: Element) {}
  disconnect() {}
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
