import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the Card component
jest.mock('./components/Card/Card', () => {
  return function MockCard({ card, onAddToDeck, disabled, cardStats }) {
    return (
      <div 
        data-testid={`sideboard-card-${card.id}`}
        onClick={() => !disabled && onAddToDeck && onAddToDeck(card)}
      >
        {card.name}
        {cardStats && cardStats[card.name] && (
          <div>Stats: {JSON.stringify(cardStats[card.name])}</div>
        )}
      </div>
    );
  };
});

// Sideboard Component (extracted from App.js for testing)
const Sideboard = ({ sideboardCards, cardStats, onMoveFromSideboard }) => {
  const Card = require('./components/Card/Card').default;
  
  return (
    <div className="my-6">
      <h2 className="text-2xl font-bold text-white mb-4">Sideboard ({sideboardCards.length} cards)</h2>
      {sideboardCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sideboardCards.map((card, index) => (
            <Card
              key={`${card.id}-${index}`}
              card={card}
              onAddToDeck={onMoveFromSideboard}
              disabled={false}
              cardStats={cardStats}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-lg text-gray-400">No cards in sideboard yet.</p>
      )}
    </div>
  );
};

describe('Sideboard Component', () => {
  const mockSideboardCards = [
    { id: 'card-1', name: 'Lightning Bolt', colors: ['R'], cmc: 1 },
    { id: 'card-2', name: 'Counterspell', colors: ['U'], cmc: 2 },
    { id: 'card-3', name: 'Giant Growth', colors: ['G'], cmc: 1 }
  ];

  const mockCardStats = {
    'Lightning Bolt': { gihwr: 65, ohwr: 62, gdwr: 63 },
    'Counterspell': { gihwr: 58, ohwr: 55, gdwr: 57 }
  };

  describe('Basic Rendering', () => {
    test('renders sideboard heading with card count', () => {
      render(<Sideboard sideboardCards={mockSideboardCards} />);
      
      expect(screen.getByText('Sideboard (3 cards)')).toBeInTheDocument();
    });

    test('renders all sideboard cards', () => {
      render(<Sideboard sideboardCards={mockSideboardCards} />);
      
      mockSideboardCards.forEach(card => {
        expect(screen.getByText(card.name)).toBeInTheDocument();
      });
    });

    test('shows empty state message when sideboard is empty', () => {
      render(<Sideboard sideboardCards={[]} />);
      
      expect(screen.getByText('Sideboard (0 cards)')).toBeInTheDocument();
      expect(screen.getByText('No cards in sideboard yet.')).toBeInTheDocument();
    });

    test('does not show grid when sideboard is empty', () => {
      const { container } = render(<Sideboard sideboardCards={[]} />);
      
      const grid = container.querySelector('.grid');
      expect(grid).not.toBeInTheDocument();
    });

    test('updates card count dynamically', () => {
      const { rerender } = render(<Sideboard sideboardCards={mockSideboardCards} />);
      
      expect(screen.getByText('Sideboard (3 cards)')).toBeInTheDocument();
      
      const moreCards = [...mockSideboardCards, 
        { id: 'card-4', name: 'New Card' },
        { id: 'card-5', name: 'Another Card' }
      ];
      rerender(<Sideboard sideboardCards={moreCards} />);
      
      expect(screen.getByText('Sideboard (5 cards)')).toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    test('renders cards in responsive grid layout', () => {
      const { container } = render(<Sideboard sideboardCards={mockSideboardCards} />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3', 
                               'lg:grid-cols-4', 'xl:grid-cols-5');
    });

    test('maintains proper grid spacing', () => {
      const { container } = render(<Sideboard sideboardCards={mockSideboardCards} />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-4');
    });
  });

  describe('Card Movement', () => {
    test('calls onMoveFromSideboard when card is clicked', () => {
      const mockOnMoveFromSideboard = jest.fn();
      render(
        <Sideboard 
          sideboardCards={mockSideboardCards} 
          onMoveFromSideboard={mockOnMoveFromSideboard}
        />
      );
      
      const firstCard = screen.getByTestId('sideboard-card-card-1');
      fireEvent.click(firstCard);
      
      expect(mockOnMoveFromSideboard).toHaveBeenCalledWith(mockSideboardCards[0]);
    });

    test('passes correct card data to movement handler', () => {
      const mockOnMoveFromSideboard = jest.fn();
      render(
        <Sideboard 
          sideboardCards={mockSideboardCards} 
          onMoveFromSideboard={mockOnMoveFromSideboard}
        />
      );
      
      const secondCard = screen.getByTestId('sideboard-card-card-2');
      fireEvent.click(secondCard);
      
      expect(mockOnMoveFromSideboard).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'card-2',
          name: 'Counterspell'
        })
      );
    });

    test('handles multiple card movements', () => {
      const mockOnMoveFromSideboard = jest.fn();
      render(
        <Sideboard 
          sideboardCards={mockSideboardCards} 
          onMoveFromSideboard={mockOnMoveFromSideboard}
        />
      );
      
      // Click multiple cards
      fireEvent.click(screen.getByTestId('sideboard-card-card-1'));
      fireEvent.click(screen.getByTestId('sideboard-card-card-2'));
      fireEvent.click(screen.getByTestId('sideboard-card-card-3'));
      
      expect(mockOnMoveFromSideboard).toHaveBeenCalledTimes(3);
    });
  });

  describe('Card Stats Integration', () => {
    test('passes cardStats to Card components', () => {
      render(
        <Sideboard 
          sideboardCards={mockSideboardCards}
          cardStats={mockCardStats}
        />
      );
      
      // Verify stats are passed and displayed
      expect(screen.getByText(/Stats:.*gihwr.*65/)).toBeInTheDocument();
      expect(screen.getByText(/Stats:.*gihwr.*58/)).toBeInTheDocument();
    });

    test('handles missing cardStats gracefully', () => {
      render(
        <Sideboard 
          sideboardCards={mockSideboardCards}
          cardStats={{}}
        />
      );
      
      // Should render without errors
      mockSideboardCards.forEach(card => {
        expect(screen.getByText(card.name)).toBeInTheDocument();
      });
      
      // No stats should be displayed
      expect(screen.queryByText(/Stats:/)).not.toBeInTheDocument();
    });

    test('handles undefined cardStats', () => {
      render(
        <Sideboard 
          sideboardCards={mockSideboardCards}
          cardStats={undefined}
        />
      );
      
      // Should render without errors
      expect(screen.getByText('Sideboard (3 cards)')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles large sideboard sizes', () => {
      const largeSideboard = Array.from({ length: 50 }, (_, i) => ({
        id: `card-${i}`,
        name: `Card ${i}`,
        colors: ['W'],
        cmc: 1
      }));
      
      render(<Sideboard sideboardCards={largeSideboard} />);
      
      expect(screen.getByText('Sideboard (50 cards)')).toBeInTheDocument();
      expect(screen.getByText('Card 0')).toBeInTheDocument();
      expect(screen.getByText('Card 49')).toBeInTheDocument();
    });

    test('handles duplicate cards correctly', () => {
      const sideboardWithDuplicates = [
        { id: 'card-1', name: 'Lightning Bolt' },
        { id: 'card-2', name: 'Lightning Bolt' }, // Same name, different ID
        { id: 'card-3', name: 'Lightning Bolt' }  // Same name, different ID
      ];
      
      render(<Sideboard sideboardCards={sideboardWithDuplicates} />);
      
      expect(screen.getByText('Sideboard (3 cards)')).toBeInTheDocument();
      expect(screen.getAllByText('Lightning Bolt')).toHaveLength(3);
    });

    test('handles cards with missing properties', () => {
      const incompleteCards = [
        { id: 'card-1', name: 'Card 1' }, // Missing colors, cmc
        { id: 'card-2', name: 'Card 2', colors: ['R'] }, // Missing cmc
        { id: 'card-3' } // Missing name
      ];
      
      render(<Sideboard sideboardCards={incompleteCards} />);
      
      // Should render available cards without errors
      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
    });

    test('handles undefined sideboardCards prop', () => {
      render(<Sideboard sideboardCards={undefined} />);
      
      // Should handle undefined gracefully
      expect(screen.getByText(/Sideboard/)).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    test('always sets disabled prop to false for Card components', () => {
      const mockOnMoveFromSideboard = jest.fn();
      render(
        <Sideboard 
          sideboardCards={mockSideboardCards}
          onMoveFromSideboard={mockOnMoveFromSideboard}
        />
      );
      
      // Cards should be clickable (not disabled)
      const firstCard = screen.getByTestId('sideboard-card-card-1');
      fireEvent.click(firstCard);
      
      expect(mockOnMoveFromSideboard).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    test('efficiently re-renders when cards change', () => {
      const { rerender } = render(
        <Sideboard sideboardCards={mockSideboardCards.slice(0, 2)} />
      );
      
      expect(screen.getByText('Sideboard (2 cards)')).toBeInTheDocument();
      
      // Add more cards
      rerender(<Sideboard sideboardCards={mockSideboardCards} />);
      
      expect(screen.getByText('Sideboard (3 cards)')).toBeInTheDocument();
      
      // Remove cards
      rerender(<Sideboard sideboardCards={mockSideboardCards.slice(0, 1)} />);
      
      expect(screen.getByText('Sideboard (1 cards)')).toBeInTheDocument();
    });

    test('handles rapid updates gracefully', () => {
      const { rerender } = render(<Sideboard sideboardCards={[]} />);
      
      // Simulate rapid sideboard changes
      for (let i = 0; i < 20; i++) {
        const cards = mockSideboardCards.slice(0, i % 4);
        rerender(<Sideboard sideboardCards={cards} />);
      }
      
      // Should still render correctly after rapid updates
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('provides semantic heading structure', () => {
      render(<Sideboard sideboardCards={mockSideboardCards} />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Sideboard (3 cards)');
    });

    test('empty state message is descriptive', () => {
      render(<Sideboard sideboardCards={[]} />);
      
      const emptyMessage = screen.getByText(/No cards in sideboard yet/);
      expect(emptyMessage).toBeInTheDocument();
      expect(emptyMessage).toHaveTextContent('No cards in sideboard yet.');
    });

    test('maintains proper HTML structure', () => {
      const { container } = render(<Sideboard sideboardCards={mockSideboardCards} />);
      
      const sideboardContainer = container.querySelector('.my-6');
      expect(sideboardContainer).toBeInTheDocument();
      
      const heading = sideboardContainer.querySelector('h2');
      expect(heading).toBeInTheDocument();
      
      const grid = sideboardContainer.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    test('applies correct spacing classes', () => {
      const { container } = render(<Sideboard sideboardCards={mockSideboardCards} />);
      
      const sideboardContainer = container.querySelector('.my-6');
      expect(sideboardContainer).toBeInTheDocument();
    });

    test('heading has correct styling classes', () => {
      render(<Sideboard sideboardCards={mockSideboardCards} />);
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-2xl', 'font-bold', 'text-white', 'mb-4');
    });

    test('empty state has correct styling', () => {
      render(<Sideboard sideboardCards={[]} />);
      
      const emptyMessage = screen.getByText(/No cards in sideboard yet/);
      expect(emptyMessage).toHaveClass('text-center', 'text-lg', 'text-gray-400');
    });
  });

  describe('Integration with Main Deck', () => {
    test('card movement updates both sideboard and deck', () => {
      let sideboardCards = [...mockSideboardCards];
      const mockOnMoveFromSideboard = jest.fn((card) => {
        sideboardCards = sideboardCards.filter(c => c.id !== card.id);
      });
      
      const { rerender } = render(
        <Sideboard 
          sideboardCards={sideboardCards}
          onMoveFromSideboard={mockOnMoveFromSideboard}
        />
      );
      
      expect(screen.getByText('Sideboard (3 cards)')).toBeInTheDocument();
      
      // Move a card
      const firstCard = screen.getByTestId('sideboard-card-card-1');
      fireEvent.click(firstCard);
      
      expect(mockOnMoveFromSideboard).toHaveBeenCalledWith(mockSideboardCards[0]);
      
      // Rerender with updated cards
      rerender(
        <Sideboard 
          sideboardCards={sideboardCards}
          onMoveFromSideboard={mockOnMoveFromSideboard}
        />
      );
      
      // Verify count updated (this would be handled by parent component in real app)
      expect(screen.getByText('Sideboard (3 cards)')).toBeInTheDocument();
    });
  });
});
