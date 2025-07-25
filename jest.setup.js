// Import Jest DOM extensions
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import React from 'react';
import { TextEncoder, TextDecoder } from 'util';

// Add TextEncoder/TextDecoder polyfill for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Setup fetch mock
jest.mock('node-fetch');
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    pathname: '/',
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    prefetch: jest.fn(() => Promise.resolve()),
  }),
}));

// Mock Next.js app router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(() => Promise.resolve()),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Reset all mocks between tests
beforeEach(() => {
  jest.resetAllMocks();
}); 