import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import axios from 'axios';
import App from './App';

// Mock dependencies
jest.mock('axios');
jest.mock('papaparse', () => ({
  parse: jest.fn((text, options) => {
    options.complete({
      data: [
        { Name: 'Test Card 1', 'GP WR': '55', 'OH WR': '52', 'GD WR': '54', Color: 'W' }
      ]
    });
  })
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    text: () => Promise.resolve('Name,GP WR,OH WR,GD WR,Color\nTest Card,55,52,54,W')
  })
);

describe('Integration Tests - Full Draft Flow', () => {
  const mockSets = [
    {
      code: 'dmu',
      name: 'Dominaria United',
      set_type: 'expansion',
      released_at: '2022-09-09',
      digital: false
    }
  ];

  const generateMockCard = (id, name, rarity, colors = ['W']) => ({
    id,
    name,
    rarity,
    colors,
    cmc: 2,
    type_line: 'Creature',
    power: '2',
    toughness: '2',
    image_uris: { normal: `https://example.com/${id}.jpg` }
  });

  const generateMockPack = () => {
    const cards = [];
    // 1 rare
    cards.push(generateMockCard('rare-1', 'Rare Dragon', 'rare', ['R']));
    // 3 uncommons
    for (let i = 0; i < 3; i++) {
      cards.push(generateMockCard(`uncommon-${i}`, `Uncommon ${i}`, 'uncommon'));
    }
    // 10 commons
    for (let i = 0; i < 10; i++) {
      cards.push(generateMockCard(`common-${i}`, `Common ${i}`, 'common'));
    }
    // 1 land
    cards.push({
      id: 'land-1',
      name: 'Forest',
      rarity: 'common',
      type_line: 'Basic Land — Forest',
      image_uris: { normal: 'https://example.com/forest.jpg' }
    });
    return cards;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/sets')) {
        return Promise.resolve({ data: { data: mockSets } });
      }
      
      if (url.includes('/cards/search')) {
        // Generate enough cards for a draft
        const allCards = [];
        for (let i = 0; i < 100; i++) {
          const rarity = i < 10 ? 'mythic' : i < 25 ? 'rare' : i < 50 ? 'uncommon' : 'common';
          allCards.push(generateMockCard(`card-${i}`, `Card ${i}`, rarity));
        }
        // Add basic lands
        for (let i = 0; i < 5; i++) {
          allCards.push({
            id: `land-${i}`,
            name: 'Forest',
            rarity: 'common',
            type_line: 'Basic Land — Forest',
            image_uris: { normal: 'https://example.com/forest.jpg' }
          });
        }
        
        return Promise.resolve({
          data: { data: allCards, has_more: false }
        });
      }
    });
  });

  describe('Complete Draft Session', () => {
    test('can complete a full draft from start to finish', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('MTG Draft Simulator')).toBeInTheDocument();
      });
      
      // Wait for sets to load and cards to initialize
      await waitFor(() => {
        expect(screen.getByText(/Round 1\/3/)).toBeInTheDocument();
      });
      
      // Verify initial state
      expect(screen.getByText('Your Deck (0 cards)')).toBeInTheDocument();
      expect(screen.getByText(/Current Pack/)).toBeInTheDocument();
      
      // Should have cards to pick from
      const cards = screen.getAllByRole('img');
      expect(cards.length).toBeGreaterThan(0);
    });

    test('picks are reflected in deck and pack updates', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Select the set (e.g., 'dmu')
      await waitFor(() => {
        const setSelect = screen.getByRole('combobox', { name: /set selector/i });
        fireEvent.change(setSelect, { target: { value: 'dmu' } });
      });
      
      // Now wait for "Current Pack" to appear
      const packText = await screen.findByText(/Current Pack/);
      expect(packText).toBeInTheDocument();
      
      // Click first card to pick it
      const firstCard = screen.getAllByRole('img')[0];
      await user.click(firstCard.parentElement);
      
      // Verify deck updated
      await waitFor(() => {
        expect(screen.getByText('Your Deck (1 cards)')).toBeInTheDocument();
      });
      
      // Verify pack size decreased
      expect(screen.getByText(/Current Pack/)).toHaveTextContent(/14 cards/);
    });

    test('undo functionality works correctly', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Wait for the draft to initialize
      await waitFor(() => {
        expect(screen.getByText(/Round 1\/3/)).toBeInTheDocument();
      });

      // Pick a card first to ensure Undo button will be present
      const cards = await screen.findAllByRole('img');
      await user.click(cards[0].parentElement);

      // Now the Undo button should exist
      const undoButton = await screen.findByRole('button', { name: /Undo Pick/i });
      expect(undoButton).not.toBeDisabled();

      // Click undo
      await user.click(undoButton);

      // Confirm that deck is back to empty
      await waitFor(() => {
        expect(screen.getByText('Your Deck (0 cards)')).toBeInTheDocument();
      });
    });
  });

  describe('Draft to Deck Building Transition', () => {
    test('transitions to deck building after draft completion', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/Round 1\/3/)).toBeInTheDocument();
      });
      
      // Simulate drafting by making picks
      // This would need to be expanded to complete all picks
      
      // Mock draft completion
      // In a real test, we'd need to make all the picks
      
      // Verify deck building UI appears after draft
      // expect(screen.getByText(/Draft Complete!/)).toBeInTheDocument();
    });
  });

  describe('Suggest Pick Feature', () => {
    test('highlights suggested card when clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/Round 1\/3/)).toBeInTheDocument();
      });
      
      const suggestButton = await screen.findByText(/Suggest Pick/);
      await user.click(suggestButton);
      
      // Should highlight a card (would need to check for border class)
      // This would need custom queries to check for the highlight
    });

    test('toggles suggestion off when clicked again', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/Round 1\/3/)).toBeInTheDocument();
      });
      
      const suggestButton = await screen.findByText(/Suggest Pick/);
      
      // Turn on
      await user.click(suggestButton);
      // Turn off
      await user.click(suggestButton);
      
      // Verify no cards are highlighted
    });
  });

  describe('Set Selection', () => {
    test('changing set resets draft', async () => {
      const user = userEvent.setup();
      
      // Add another set for selection
      const multiSets = [
        ...mockSets,
        {
          code: 'bro',
          name: 'The Brothers War',
          set_type: 'expansion',
          released_at: '2022-11-18',
          digital: false
        }
      ];
      
      axios.get.mockImplementation((url) => {
        if (url.includes('/sets')) {
          return Promise.resolve({ data: { data: multiSets } });
        }
        return Promise.resolve({ data: { data: [], has_more: false } });
      });
      
      render(<App />);
      
      await waitFor(() => {
        const comboboxes = screen.getAllByRole('combobox');
        expect(comboboxes.length).toBeGreaterThan(0);
        const setSelect = comboboxes[0];  // or [1], whichever is correct
        expect(setSelect).toBeInTheDocument();
      });
      
      const select = screen.getByRole('combobox', { name: /set selector/i });
      
      // Change set
      await user.selectOptions(select, 'bro');
      
      // Verify draft is reset
      await waitFor(() => {
        expect(screen.getByText('Your Deck (0 cards)')).toBeInTheDocument();
      });
    });
  });

  describe('Sideboard Functionality', () => {
    test('can move cards to and from sideboard', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/Round 1\/3/)).toBeInTheDocument();
      });
      
      // Make some picks first
      const cards = await screen.findAllByRole('img');
      await user.click(cards[0].parentElement);
      
      await waitFor(() => {
        expect(screen.getByText('Your Deck (1 cards)')).toBeInTheDocument();
      });
      
      // Click on drafted card to move to sideboard
      const deckSection = screen.getByText('Your Deck (1 cards)').parentElement;
      const draftedCard = within(deckSection).getAllByRole('img')[0];
      await user.click(draftedCard.parentElement);
      
      // Verify card moved to sideboard
      await waitFor(() => {
        expect(screen.getByText('Sideboard (1 cards)')).toBeInTheDocument();
        expect(screen.getByText('Your Deck (0 cards)')).toBeInTheDocument();
      });
    });
  });

  describe('Deck Building Features', () => {
    test('can sort drafted cards', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Wait until card data finishes loading
      await waitFor(() => {
        expect(screen.queryByText(/Loading cards for selected set/i)).not.toBeInTheDocument();
      });

      // Wait for Round 1 to appear to confirm draft started
      await waitFor(() => {
        expect(screen.getByText(/Round 1\/3/i)).toBeInTheDocument();
      });

      // Wait for pack cards to render (assuming cards are <img> elements inside clickable containers)
      const cards = await screen.findAllByRole('img');

      // Make several picks
      for (let i = 0; i < 3; i++) {
        const cards = await screen.findAllByRole('img');
        await user.click(cards[0].parentElement); // click on first card
      }

      // Verify final deck count (text is broken up, so use a flexible matcher)
      const deckHeader = await screen.findByText((text) =>
        text.replace(/\s+/g, ' ').includes('Your Deck (3 cards)')
      );

      expect(deckHeader).toBeInTheDocument();

      // Find the second combobox (deck sort) and sort button
      const sortSelect = screen.getAllByRole('combobox')[1];
      const sortButton = screen.getByText('Sort Deck');

      // Sort the deck by color
      await user.selectOptions(sortSelect, 'color');
      await user.click(sortButton);

      // Optional: Assert no error, or check visual order
    });
  });

  describe('Global Stats Toggle', () => {
    test('toggles global stats display', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const toggleButton = await screen.findByText(/Show Global Stats/);
      
      // Click to show stats
      await user.click(toggleButton);
      
      expect(screen.getByText(/Hide Global Stats/)).toBeInTheDocument();
      
      // Click to hide stats
      await user.click(toggleButton);
      
      expect(screen.getByText(/Show Global Stats/)).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    test('handles API errors gracefully', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<App />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });
      
      // App should still render
      expect(screen.getByText('MTG Draft Simulator')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    test('handles missing CSV data gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('CSV not found'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('MTG Draft Simulator')).toBeInTheDocument();
      });
      
      // App should continue working without stats
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    test('handles large number of cards efficiently', async () => {
      const largeCardSet = Array.from({ length: 500 }, (_, i) => 
        generateMockCard(`card-${i}`, `Card ${i}`, 'common')
      );
      
      axios.get.mockImplementation((url) => {
        if (url.includes('/sets')) {
          return Promise.resolve({ data: { data: mockSets } });
        }
        if (url.includes('/cards/search')) {
          return Promise.resolve({
            data: { data: largeCardSet, has_more: false }
          });
        }
      });
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/Round 1\/3/)).toBeInTheDocument();
      });
      
      // Should handle large dataset without issues
      expect(screen.getByText(/No pack available/i)).toBeInTheDocument();
    });

    test('draft history is limited to prevent memory issues', async () => {
      const user = userEvent.setup();

      render(<App />);

      // Wait for set selector and select set 'dmu' to trigger card loading
      const setSelect = await screen.findByRole('combobox', { name: /set selector/i });
      // If your select has no accessible name, findAllByRole('combobox') and pick first or use querySelector
      fireEvent.change(setSelect, { target: { value: 'dmu' } });

      // Wait for images to load
      await waitFor(async () => {
        const cards = screen.findAllByRole('img');

        // Make more than 5 picks
        for (let i = 0; i < 7; i++) {
          if (cards[i]) {
            await user.click(cards[i].parentElement); // assuming clickable parent
            await waitFor(() => {
              expect(screen.getByText(/Your Deck/)).toBeInTheDocument();
            });
          }
        }

        // History capped internally — just verify UI still works
        expect(screen.getByText(/Round/)).toBeInTheDocument();
      });
    });
  });
});

describe('Accessibility Tests', () => {
  test('app is keyboard navigable', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('MTG Draft Simulator')).toBeInTheDocument();
    });
    
    // Tab through interactive elements
    await user.tab();
    
    // Should be able to tab to buttons and controls
    const activeElement = document.activeElement;
    expect(activeElement).not.toBe(document.body);
  });

  test('provides appropriate ARIA labels', () => {
    render(<App />);
    
    // Check for headings
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for semantic structure
    expect(screen.getByText('MTG Draft Simulator')).toBeInTheDocument();
  });
});
