# MTG Draft Simulator - Testing Documentation

## Overview
This document provides comprehensive information about the unit tests created for the MTG Draft Simulator application.

## Test Structure

### Component Tests

#### 1. **Card Component Tests** (`Card.test.js`)
Tests the individual card display component.

**Coverage Areas:**
- Basic rendering (image, name, placeholder handling)
- Click handlers (onPick, onAddToDeck, onRemoveFromDeck)
- Disabled state behavior
- Suggested card highlighting
- Stats display (with showGlobalStats toggle)
- Hover effects
- Edge cases (missing data, special characters, long names)
- Accessibility features
- Performance (rapid clicks, re-renders)

**Key Test Cases:**
- ✅ Renders card with image and name
- ✅ Shows placeholder when image is missing
- ✅ Applies disabled styling and prevents clicks when disabled
- ✅ Highlights suggested cards with border
- ✅ Displays global stats when enabled
- ✅ Handles missing stats gracefully
- ✅ Prioritizes onPick over other handlers

#### 2. **Pack Component Tests** (`Pack.test.js`)
Tests the pack display that shows available cards to draft.

**Coverage Areas:**
- Pack rendering with card count
- Responsive grid layout
- Card interactions and picking
- Suggested card highlighting
- Stats display propagation
- Edge cases (empty pack, large packs, duplicates)
- Performance with rapid updates

**Key Test Cases:**
- ✅ Displays correct card count in header
- ✅ Renders all cards in responsive grid
- ✅ Passes click handlers to each card
- ✅ Highlights suggested card
- ✅ Handles empty pack gracefully
- ✅ Updates dynamically when cards change

#### 3. **Deck Component Tests** (`Deck.test.js`)
Tests the player's drafted cards display.

**Coverage Areas:**
- Deck rendering with card count
- Empty state message
- Card removal functionality
- Stats integration
- Grid layout
- Edge cases (large decks, duplicates)
- Accessibility features

**Key Test Cases:**
- ✅ Shows card count in header
- ✅ Displays empty state when no cards drafted
- ✅ Allows card removal to sideboard
- ✅ Passes card stats to Card components
- ✅ Handles large deck sizes
- ✅ Maintains semantic HTML structure

#### 4. **Sideboard Component Tests** (`Sideboard.test.js`)
Tests the sideboard functionality for removed cards.

**Coverage Areas:**
- Sideboard display with count
- Empty state handling
- Card movement back to deck
- Stats display
- Responsive layout
- Edge cases

**Key Test Cases:**
- ✅ Shows sideboard card count
- ✅ Displays empty message when no cards
- ✅ Allows moving cards back to deck
- ✅ Integrates with card stats
- ✅ Handles multiple card movements

### Core Functionality Tests

#### 5. **App Component Tests** (`App.test.js`)
Tests the main application component and its state management.

**Coverage Areas:**
- Initial rendering
- Set loading and selection
- Draft initialization
- Global stats toggle
- Error handling
- API integration

**Key Test Cases:**
- ✅ Renders main title
- ✅ Loads and displays sets on mount
- ✅ Changes selected set
- ✅ Toggles global stats visibility
- ✅ Filters sets by type and date
- ✅ Handles API errors gracefully

#### 6. **Utility Functions Tests** (`utils.test.js`)
Tests core game logic functions.

**Coverage Areas:**
- Pack generation algorithm
- Card scoring system
- Color pair bonus calculation
- Player color updates
- Land suggestion logic
- Deck statistics

**Key Test Cases:**
- ✅ `generatePack`: Creates 15-card packs with correct distribution
- ✅ `calculateCardScore`: Scores cards based on stats and colors
- ✅ `getColorPairBonus`: Returns win rate bonuses
- ✅ `updatePlayerColors`: Updates AI color preferences
- ✅ `suggestLands`: Suggests 17 lands proportionally
- ✅ `getDeckStats`: Calculates deck statistics

### Integration Tests

#### 7. **Integration Tests** (`integration.test.js`)
Tests complete user workflows and feature interactions.

**Coverage Areas:**
- Complete draft session flow
- Draft to deck building transition
- Suggest pick feature
- Undo functionality
- Set selection and reset
- Sideboard interactions
- Deck building features
- Error recovery
- Performance with large datasets
- Accessibility

**Key Test Cases:**
- ✅ Complete draft from start to finish
- ✅ Pick updates deck and pack
- ✅ Undo reverts to previous state
- ✅ Suggest pick highlights cards
- ✅ Set change resets draft
- ✅ Move cards to/from sideboard
- ✅ Sort drafted cards
- ✅ Handle API errors gracefully
- ✅ Keyboard navigation works

## Running Tests

### Setup
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Specific Test File
```bash
npm test Card.test.js
```

### Run Tests with Specific Pattern
```bash
npm test -- --testNamePattern="renders card"
```

## Test Configuration

The test suite uses the following configuration (see `jest.config.js`):

- **Test Environment**: jsdom (for DOM testing)
- **Coverage Thresholds**: 70% for branches, functions, lines, and statements
- **Mock Handling**: Auto-clearing and resetting between tests
- **File Transforms**: Babel for JS/JSX files
- **CSS Handling**: Identity object proxy for style imports

## Mocking Strategy

### External Dependencies
- **Axios**: Mocked for API calls to Scryfall
- **PapaParse**: Mocked for CSV parsing
- **Fetch**: Mocked for loading card statistics

### Component Mocks
- Card component is mocked in Pack, Deck, and Sideboard tests to isolate testing
- This allows testing of parent components without Card implementation details

## Coverage Report

After running tests with coverage, you'll see a report showing:
- **Statements**: Line coverage percentage
- **Branches**: Conditional logic coverage
- **Functions**: Function call coverage
- **Lines**: Executed line coverage

Target coverage is 70% across all metrics.

## Best Practices

1. **Isolation**: Each test should be independent and not rely on others
2. **Mocking**: Mock external dependencies to ensure predictable tests
3. **Cleanup**: Use beforeEach/afterEach for setup and teardown
4. **Descriptive Names**: Use clear test descriptions that explain what's being tested
5. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification
6. **Edge Cases**: Test boundary conditions and error scenarios
7. **Accessibility**: Include tests for keyboard navigation and ARIA attributes

## Common Testing Patterns

### Testing User Interactions
```javascript
const user = userEvent.setup();
await user.click(element);
await user.type(input, 'text');
await user.selectOptions(select, 'option-value');
```

### Waiting for Async Updates
```javascript
await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### Testing Within Specific Sections
```javascript
const section = screen.getByText('Section Title').parentElement;
const element = within(section).getByText('Element Text');
```

### Mocking API Responses
```javascript
axios.get.mockResolvedValueOnce({
  data: { /* mock data */ }
});
```

## Troubleshooting

### Common Issues

1. **Async Warnings**: Use `waitFor` for elements that appear after async operations
2. **Multiple Elements**: Use `getAllBy` queries when multiple elements match
3. **Not Found**: Check if element is rendered conditionally or after state update
4. **Mock Not Working**: Ensure mock is set up before component renders
5. **Test Timeout**: Increase timeout for slow operations or optimize test

### Debug Helpers

```javascript
// Print current DOM
screen.debug();

// Print specific element
screen.debug(element);

// Use queries for debugging
console.log(screen.getByRole('button'));
```

## Future Enhancements

1. **E2E Tests**: Add Cypress or Playwright for end-to-end testing
2. **Visual Regression**: Implement screenshot testing for UI consistency
3. **Performance Testing**: Add benchmarks for render performance
4. **Mutation Testing**: Use Stryker to verify test quality
5. **API Contract Tests**: Add tests for Scryfall API integration

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all existing tests pass
3. Add tests for new functionality
4. Update this documentation
5. Run coverage report to verify thresholds

## Resources

- [Testing Library Documentation](https://testing-library.com/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
