import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-expect-error - jsdom
global.ResizeObserver = ResizeObserverMock;
