import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Pack from './components/Pack/Pack';

// Mock the Card component to simplify testing
jest.mock('./components/Card/Card', () => {
  return function MockCard({ card, onPick, disabled, isSuggested, showGlobalStats, cardStats }) {
    return (
      <div 
        data-testid={`card-${card.id}`}
        onClick={() => !disabled && onPick && onPick(card)}
        className={isSuggested ? 'suggested' : ''}
      >
        {card.name}
        {showGlobalStats && cardStats[card.name] && (
          <div>Stats: {JSON.stringify(cardStats[card.name])}</div>
        )}
      </div>
    );
  };
});

describe('Pack Component', () => {
  const mockCards = [
    { id: 'card-1', name: 'Lightning Bolt', colors: ['R'], cmc: 1 },
    { id: 'card-2', name: 'Counterspell', colors: ['U'], cmc: 2 },
    { id: 'card-3', name: 'Giant Growth', colors: ['G'], cmc: 1 },
    { id: 'card-4', name: 'Doom Blade', colors: ['B'], cmc: 2 },
    { id: 'card-5', name: 'Pacifism', colors: ['W'], cmc: 2 }
  ];

  const mockCardStats = {
    'Lightning Bolt': { gihwr: 65, ohwr: 62, gdwr: 63 },
    'Counterspell': { gihwr: 58, ohwr: 55, gdwr: 57 }
  };

  describe('Basic Rendering', () => {
    test('renders pack heading with card count', () => {
      render(<Pack cards={mockCards} />);
      
      expect(screen.getByText('Current Pack (5 cards)')).toBeInTheDocument();
    });

    test('renders all cards in the pack', () => {
      render(<Pack cards={mockCards} />);
      
      mockCards.forEach(card => {
        expect(screen.getByText(card.name)).toBeInTheDocument();
      });
    });

    test('renders empty pack correctly', () => {
      render(<Pack cards={[]} />);
      
      expect(screen.getByText('Current Pack (0 cards)')).toBeInTheDocument();
      expect(screen.queryByTestId(/^card-/)).not.toBeInTheDocument();
    });

    test('updates card count when cards change', () => {
      const { rerender } = render(<Pack cards={mockCards} />);
      
      expect(screen.getByText('Current Pack (5 cards)')).toBeInTheDocument();
      
      const fewerCards = mockCards.slice(0, 3);
      rerender(<Pack cards={fewerCards} />);
      
      expect(screen.getByText('Current Pack (3 cards)')).toBeInTheDocument();
    });
  });

  describe('Card Grid Layout', () => {
    test('renders cards in a responsive grid', () => {
      const { container } = render(<Pack cards={mockCards} />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3', 
                               'lg:grid-cols-4', 'xl:grid-cols-5');
    });

    test('maintains grid spacing', () => {
      const { container } = render(<Pack cards={mockCards} />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-4');
    });
  });

  describe('Card Interactions', () => {
    test('passes onPick handler to each card', () => {
      const mockOnPick = jest.fn();
      render(<Pack cards={mockCards} onPick={mockOnPick} disabled={false} />);
      
      const firstCard = screen.getByTestId('card-card-1');
      fireEvent.click(firstCard);
      
      expect(mockOnPick).toHaveBeenCalledWith(mockCards[0]);
    });

    test('disables all cards when disabled prop is true', () => {
      const mockOnPick = jest.fn();
      render(<Pack cards={mockCards} onPick={mockOnPick} disabled={true} />);
      
      mockCards.forEach(card => {
        const cardElement = screen.getByTestId(`card-${card.id}`);
        fireEvent.click(cardElement);
      });
      
      expect(mockOnPick).not.toHaveBeenCalled();
    });

    test('enables all cards when disabled prop is false', () => {
      const mockOnPick = jest.fn();
      render(<Pack cards={mockCards} onPick={mockOnPick} disabled={false} />);
      
      const firstCard = screen.getByTestId('card-card-1');
      fireEvent.click(firstCard);
      
      expect(mockOnPick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Suggested Card Highlighting', () => {
    test('highlights suggested card', () => {
      render(
        <Pack 
          cards={mockCards} 
          suggestedCardId="card-2"
        />
      );
      
      const suggestedCard = screen.getByTestId('card-card-2');
      expect(suggestedCard).toHaveClass('suggested');
      
      // Other cards should not be suggested
      const otherCard = screen.getByTestId('card-card-1');
      expect(otherCard).not.toHaveClass('suggested');
    });

    test('handles no suggested card', () => {
      render(<Pack cards={mockCards} suggestedCardId={null} />);
      
      mockCards.forEach(card => {
        const cardElement = screen.getByTestId(`card-${card.id}`);
        expect(cardElement).not.toHaveClass('suggested');
      });
    });

    test('updates suggested card dynamically', () => {
      const { rerender } = render(
        <Pack cards={mockCards} suggestedCardId="card-1" />
      );
      
      expect(screen.getByTestId('card-card-1')).toHaveClass('suggested');
      
      rerender(<Pack cards={mockCards} suggestedCardId="card-3" />);
      
      expect(screen.getByTestId('card-card-1')).not.toHaveClass('suggested');
      expect(screen.getByTestId('card-card-3')).toHaveClass('suggested');
    });
  });

  describe('Card Stats Display', () => {
    test('passes cardStats to all cards', () => {
      render(
        <Pack 
          cards={mockCards} 
          cardStats={mockCardStats}
          showGlobalStats={true}
        />
      );
      
      // Check that cards with stats show them
      expect(screen.getByText(/Stats:.*gihwr.*65/)).toBeInTheDocument();
      expect(screen.getByText(/Stats:.*gihwr.*58/)).toBeInTheDocument();
    });

    test('passes showGlobalStats flag to cards', () => {
      const { rerender } = render(
        <Pack 
          cards={mockCards} 
          cardStats={mockCardStats}
          showGlobalStats={false}
        />
      );
      
      // Stats should not be visible
      expect(screen.queryByText(/Stats:/)).not.toBeInTheDocument();
      
      rerender(
        <Pack 
          cards={mockCards} 
          cardStats={mockCardStats}
          showGlobalStats={true}
        />
      );
      
      // Stats should now be visible
      expect(screen.getByText(/Stats:.*gihwr.*65/)).toBeInTheDocument();
    });

    test('handles missing cardStats gracefully', () => {
      render(
        <Pack 
          cards={mockCards} 
          cardStats={{}}
          showGlobalStats={true}
        />
      );
      
      // Should render without errors
      mockCards.forEach(card => {
        expect(screen.getByText(card.name)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles large number of cards', () => {
      const manyCards = Array.from({ length: 50 }, (_, i) => ({
        id: `card-${i}`,
        name: `Card ${i}`,
        colors: ['W'],
        cmc: 1
      }));
      
      render(<Pack cards={manyCards} />);
      
      expect(screen.getByText('Current Pack (50 cards)')).toBeInTheDocument();
      expect(screen.getByText('Card 0')).toBeInTheDocument();
      expect(screen.getByText('Card 49')).toBeInTheDocument();
    });

    test('handles duplicate card IDs', () => {
      const duplicateCards = [
        { id: 'card-1', name: 'Card A' },
        { id: 'card-1', name: 'Card B' }, // Duplicate ID
        { id: 'card-2', name: 'Card C' }
      ];
      
      render(<Pack cards={duplicateCards} />);
      
      // Should render all cards despite duplicate IDs
      expect(screen.getByText('Card A')).toBeInTheDocument();
      expect(screen.getByText('Card B')).toBeInTheDocument();
      expect(screen.getByText('Card C')).toBeInTheDocument();
    });

    test('handles undefined props gracefully', () => {
      render(<Pack cards={mockCards} />);
      
      // Should render without onPick, disabled, etc.
      expect(screen.getByText('Current Pack (5 cards)')).toBeInTheDocument();
      mockCards.forEach(card => {
        expect(screen.getByText(card.name)).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    test('efficiently re-renders when cards change', () => {
      const { rerender } = render(<Pack cards={mockCards.slice(0, 3)} />);
      
      expect(screen.getByText('Current Pack (3 cards)')).toBeInTheDocument();
      
      // Add more cards
      rerender(<Pack cards={mockCards} />);
      
      expect(screen.getByText('Current Pack (5 cards)')).toBeInTheDocument();
      expect(screen.getAllByTestId(/^card-/)).toHaveLength(5);
    });

    test('handles rapid prop updates', () => {
      const { rerender } = render(
        <Pack 
          cards={mockCards} 
          suggestedCardId="card-1"
          showGlobalStats={false}
        />
      );
      
      // Rapid updates
      for (let i = 0; i < 10; i++) {
        rerender(
          <Pack 
            cards={mockCards} 
            suggestedCardId={`card-${(i % 5) + 1}`}
            showGlobalStats={i % 2 === 0}
          />
        );
      }
      
      // Should still render correctly
      expect(screen.getByText('Current Pack (5 cards)')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('pack heading provides context', () => {
      render(<Pack cards={mockCards} />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Current Pack (5 cards)');
    });

    test('maintains semantic HTML structure', () => {
      const { container } = render(<Pack cards={mockCards} />);
      
      // Should have proper nesting
      const packDiv = container.querySelector('.my-6');
      expect(packDiv).toBeInTheDocument();
      
      const heading = packDiv.querySelector('h2');
      expect(heading).toBeInTheDocument();
      
      const grid = packDiv.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Integration with Card Component', () => {
    test('passes all required props to Card components', () => {
      const mockOnPick = jest.fn();
      const suggestedId = 'card-2';
      
      render(
        <Pack 
          cards={mockCards}
          onPick={mockOnPick}
          disabled={false}
          cardStats={mockCardStats}
          suggestedCardId={suggestedId}
          showGlobalStats={true}
        />
      );
      
      // Verify suggested card is marked
      const suggestedCard = screen.getByTestId('card-card-2');
      expect(suggestedCard).toHaveClass('suggested');
      
      // Verify click handlers work
      fireEvent.click(suggestedCard);
      expect(mockOnPick).toHaveBeenCalledWith(mockCards[1]);
      
      // Verify stats are displayed
      expect(screen.getByText(/Stats:.*gihwr.*58/)).toBeInTheDocument();
    });
  });
});
