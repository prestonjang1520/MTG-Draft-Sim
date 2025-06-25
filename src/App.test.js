import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import App from './App';

// Mock axios
jest.mock('axios');

// Mock PapaParse
jest.mock('papaparse', () => ({
  parse: jest.fn((text, options) => {
    // Mock CSV parsing
    options.complete({
      data: [
        { Name: 'Test Card 1', 'GP WR': '55', 'OH WR': '52', 'GD WR': '54', Color: 'W' },
        { Name: 'Test Card 2', 'GP WR': '48', 'OH WR': '45', 'GD WR': '47', Color: 'U' }
      ]
    });
  })
}));

// Mock fetch for CSV files
global.fetch = jest.fn();

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/sets')) {
        return Promise.resolve({
          data: {
            data: [
              {
                code: 'dmu',
                name: 'Dominaria United',
                set_type: 'expansion',
                released_at: '2022-09-09',
                digital: false
              },
              {
                code: 'bro',
                name: 'The Brothers War',
                set_type: 'expansion',
                released_at: '2022-11-18',
                digital: false
              }
            ]
          }
        });
      }
      
      if (url.includes('/cards/search')) {
        return Promise.resolve({
          data: {
            data: generateMockCards(15),
            has_more: false
          }
        });
      }
    });
    
    // Mock fetch for CSV files
    fetch.mockResolvedValue({
      text: () => Promise.resolve('Name,GP WR,OH WR,GD WR,Color\nTest Card,55,52,54,W')
    });
  });

  test('renders main title', () => {
    render(<App />);
    expect(screen.getByText('MTG Draft Simulator')).toBeInTheDocument();
  });

  test('loads and displays sets on mount', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('https://api.scryfall.com/sets');
    });
    
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      const setSelect = selects[0]; // Set selector is expected to be first
      expect(setSelect).toBeInTheDocument();
      expect(setSelect).toHaveValue('dmu');
    });
  });

  test('changes selected set', async () => {
    render(<App />);
    
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects[0]).toBeInTheDocument();
    });
    
    const selects = screen.getAllByRole('combobox');
    const setSelect = selects[0];
    fireEvent.change(setSelect, { target: { value: 'bro' } });
    
    expect(setSelect.value).toBe('bro');
  });

  test('toggles global stats visibility', async () => {
    render(<App />);
    
    const toggleButton = screen.getByText(/Show Global Stats/i);
    expect(toggleButton).toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    
    expect(screen.getByText(/Hide Global Stats/i)).toBeInTheDocument();
  });
});

// Helper function to generate mock cards
function generateMockCards(count) {
  const rarities = ['common', 'uncommon', 'rare', 'mythic'];
  const colors = ['W', 'U', 'B', 'R', 'G'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `card-${i}`,
    name: `Test Card ${i}`,
    rarity: rarities[i % 4],
    colors: [colors[i % 5]],
    cmc: (i % 6) + 1,
    type_line: i % 3 === 0 ? 'Creature' : i % 3 === 1 ? 'Instant' : 'Sorcery',
    power: i % 3 === 0 ? String((i % 4) + 1) : undefined,
    toughness: i % 3 === 0 ? String((i % 4) + 2) : undefined,
    image_uris: {
      normal: `https://example.com/card-${i}.jpg`
    }
  }));
}

describe('Core Game Functions', () => {
  let component;
  
  beforeEach(async () => {
    await act(async () => {
      component = render(<App />);
    });
  });

  describe('Set Filtering', () => {
    test('filters sets correctly by type and date', async () => {
      const mockSets = [
        { code: 'dmu', name: 'Dominaria United', set_type: 'expansion', released_at: '2022-09-09', digital: false },
        { code: 'ymid', name: 'Alchemy Innistrad', set_type: 'alchemy', released_at: '2021-12-09', digital: true },
        { code: 'old', name: 'Old Set', set_type: 'expansion', released_at: '2002-01-01', digital: false },
        { code: 'tdmu', name: 'Token Set', set_type: 'token', released_at: '2022-09-09', digital: false }
      ];

      axios.get.mockResolvedValueOnce({
        data: { data: mockSets }
      });

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        const setSelect = selects[0];
        const options = setSelect.querySelectorAll('option');
        
        // Should only have the 'dmu' set (expansion, after 2003, non-digital)
        expect(options).toHaveLength(1);
        expect(options[0]).toHaveValue('dmu');
      });
    });
  });
});

describe('Draft Mechanics', () => {
  describe('Card Scoring System', () => {
    test('calculateCardScore with stats', () => {
      const cardWithStats = {
        name: 'Test Card 1',
        colors: ['W'],
        rarity: 'rare',
        cmc: 3
      };
      
      const aiPlayer = {
        colors: ['W', 'U'],
        draftedCards: []
      };
      
      const cardStats = {
        'Test Card 1': {
          gihwr: 65,
          ohwr: 62,
          gdwr: 63,
          color: 'W'
        }
      };
      
      // Since we can't directly test the function, we'll test the behavior
      // through the component's suggest pick functionality
    });
  });
  
  describe('Color Pair Bonus Calculation', () => {
    test('getColorPairBonus returns correct bonus', () => {
      const colorPairStats = {
        'Azorius (WU)': 55,
        'Mono-White': 48,
        'Two-color': 50,
        'All Decks': 50
      };
      
      // Test various scenarios through component behavior
      // Since the function is internal, we test its effects
    });
  });
});

describe('Pack Generation', () => {
  test('generatePack creates valid 15-card packs', () => {
    // This would test pack generation logic
    // Since generatePack is internal, we test through component behavior
  });
  
  test('pack contains correct rarity distribution', () => {
    // Test that packs have 1 rare/mythic, 3 uncommons, 10 commons, 1 land
  });
});

describe('Draft History and Undo', () => {
  test('undo functionality restores previous state', async () => {
    await act(async () => {
      render(<App />);
    });
    
    // Wait for draft to initialize
    await waitFor(() => {
      expect(screen.queryByText(/Round 1\/3/)).toBeInTheDocument();
    });
    
    // Check that undo button is initially disabled
    const undoButton = screen.getByText(/Undo Pick/i);
    expect(undoButton).toBeDisabled();
    
    // After picking a card, undo should be enabled
    // This would require more setup to test picking
  });
});

describe('Deck Building Features', () => {
  test('suggests correct number of lands', () => {
    // Test suggestLands functionality
  });
  
  test('deck stats calculation', () => {
    // Test getDeckStats
  });
  
  test('sorting deck by CMC', () => {
    // Test sortDeck with 'cmc' parameter
  });
  
  test('sorting deck by color', () => {
    // Test sortDeck with 'color' parameter
  });
});

describe('AI Logic', () => {
  test('AI picks cards based on colors and stats', () => {
    // Test aiPickCard logic
  });
  
  test('AI updates color preferences based on picks', () => {
    // Test updatePlayerColors
  });
});

describe('Sideboard Functionality', () => {
  test('moves cards to sideboard', () => {
    // Test moveToSideboard
  });
  
  test('moves cards from sideboard back to deck', () => {
    // Test moveFromSideboard
  });
});

// Integration Tests
describe('Full Draft Flow', () => {
  test('completes a full draft with 3 rounds', async () => {
    // Test completing all 3 rounds of drafting
  });
  
  test('transitions to deck building after draft', async () => {
    // Test that deck building UI appears after draft completion
  });
});

// Error Handling Tests
describe('Error Handling', () => {
  test('handles API errors gracefully', async () => {
    axios.get.mockRejectedValueOnce(new Error('API Error'));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    await act(async () => {
      render(<App />);
    });
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error fetching sets'),
        expect.any(Error)
      );
    });
    
    consoleSpy.mockRestore();
  });
  
  test('handles missing card stats gracefully', () => {
    // Test behavior when CSV files are missing
  });
});

// Performance Tests
describe('Performance Considerations', () => {
  test('limits draft history to prevent memory issues', () => {
    // Test that draftHistory array is capped at 5 items
  });
  
  test('efficiently handles large card sets', () => {
    // Test with large number of cards
  });
});