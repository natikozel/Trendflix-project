# Trendflix Testing Suite

This directory contains automated tests for the Trendflix movie recommendation application.

## Test Structure

The tests are organized into the following categories:

- `components/`: Tests for React components
- `api/`: Tests for API endpoints and data fetching
- `utils/`: Tests for utility functions
- `mocks/`: Mock data used across tests

## Running Tests

To run all tests:

```bash
npm test
```

To run tests with watch mode (will rerun tests when files change):

```bash
npm run test:watch
```

To run specific tests:

```bash
# Run the index test
npm test -- src/__tests__/index.test.ts

# Run component tests
npm test -- src/__tests__/components

# Run API tests
npm test -- src/__tests__/api
```

## Current Test Status

All tests are now passing! We've implemented robust tests for all components and API functionality.

### Test Results Summary

Latest test run shows:
- 7 passing test suites
- 0 skipped test suites
- 27 passing tests
- 0 skipped tests
- No snapshot tests

### Working Tests
1. `index.test.ts` - Main test index
2. `components/FeedbackButtons.test.tsx` - Tests for feedback submission
3. `components/PreferenceForm.test.tsx` - Tests for user preference input
4. `components/MovieDetails.test.tsx` - Tests for movie details component
5. `api/DataCollection.test.ts` - Tests for API data fetching
6. `api/APIFailureHandling.test.ts` - Tests for API failure handling
7. `utils/calculations.test.ts` - Tests for movie score calculation functions

## Implementation Notes

### Testing Strategy

Our testing approach focuses on:
1. **Reliability over complexity**: We favor reliable tests over overly complex ones
2. **Proper mocking**: We use sophisticated mocking strategies to isolate components for testing
3. **Component isolation**: UI components are tested in isolation to avoid complex rendering issues
4. **API simulation**: API calls are simulated to avoid actual network requests and costs

### Mock Strategy

The tests use several sophisticated mocking strategies:

1. **API Mocking**: Using Jest's mock functions to simulate API responses without actual network requests
2. **Component Mocking**: Simplifying complex components for testing purposes
3. **External Service Mocking**: Preventing actual API calls to external services like Gemini
4. **Local Storage Mocking**: Providing a mock implementation of localStorage for testing
5. **Animation Mocking**: Simplifying animation libraries like framer-motion for testing
6. **Console Error Suppression**: Suppressing console errors during tests for cleaner output
7. **Database Mocking**: Creating mock database clients and collections for testing database operations

### Common Issues and Solutions

1. **Complex UI Components**: For components with animations or complex rendering, we use simplified test versions with appropriate mocks
2. **External API Calls**: All external dependencies are mocked to avoid network requests during tests
3. **TypeScript Errors**: Type definitions are added to mocks to avoid TypeScript errors
4. **Key Props**: React components use proper key props to avoid duplicate key warnings
5. **Async Testing**: We use proper async testing patterns with await and setTimeout where needed
6. **Console Errors**: We suppress console errors during testing to avoid noisy output
7. **Database Testing**: Database operations are tested using mock functions instead of actual database connections

## Adding New Tests

When adding new tests:

1. Place them in the appropriate directory based on what they're testing
2. Follow the existing naming conventions
3. Use the mock data from `mocks/` directory where possible
4. Make sure to clean up any side effects in the `afterEach` or `afterAll` blocks
5. Import the jest object from '@jest/globals' at the top of the file
6. Properly mock external dependencies and API calls to avoid actual network requests
7. Use CSS selectors and container queries instead of data-testid for more robust tests

## Future Improvements

1. Add more comprehensive component tests
2. Create a mock service worker for API testing
3. Add integration tests that focus on user workflows
4. Improve test coverage for utility functions
5. Add visual regression tests for complex UI components 