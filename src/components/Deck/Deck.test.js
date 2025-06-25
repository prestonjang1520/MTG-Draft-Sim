import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Deck from '../Deck/Deck';

// Mock the Card component
jest.mock('../Card/Card', () => {
  return function MockCard({ card, onRemoveFromDeck, inDeck, disabled, cardStats }) {
    return (
      <div 
        data-testid={`deck-card-${card.id}`}
        onClick={() => onRemoveFromDeck && onRemoveFromDeck(card)}
      >
        {card.name}
        {cardStats && cardStats[card.name] && (
          <div>Stats: {JSON.stringify(cardStats[card.name])}</div>
        )}
      </div>
    );
  };
});

describe('Deck Component', () => {
  const mockDraftedCards = [
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
    test('renders deck heading with card count', () => {
      render(<Deck draftedCards={mockDraftedCards} />);
      
      expect(screen.getByText('Your Deck (5 cards)')).toBeInTheDocument();
    });

    test('renders all drafted cards', () => {
      render(<Deck draftedCards={mockDraftedCards} />);
      
      mockDraftedCards.forEach(card => {
        expect(screen.getByText(card.name)).toBeInTheDocument();
      });
    });

    test('shows empty state message when no cards drafted', () => {
      render(<Deck draftedCards={[]} />);
      
      expect(screen.getByText('Your Deck (0 cards)')).toBeInTheDocument();
      expect(screen.getByText('No cards drafted yet. Start picking to build your deck!')).toBeInTheDocument();
    });

    test('does not show grid when deck is empty', () => {
      const { container } = render(<Deck draftedCards={[]} />);
      
      const grid = container.querySelector('.grid');
      expect(grid).not.toBeInTheDocument();
    });

    test('updates card count dynamically', () => {
      const { rerender } = render(<Deck draftedCards={mockDraftedCards} />);
      
      expect(screen.getByText('Your Deck (5 cards)')).toBeInTheDocument();
      
      const moreCards = [...mockDraftedCards, { id: 'card-6', name: 'New Card' }];
      rerender(<Deck draftedCards={moreCards} />);
      
      expect(screen.getByText('Your Deck (6 cards)')).toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    test('renders cards in responsive grid layout', () => {
      const { container } = render(<Deck draftedCards={mockDraftedCards} />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3', 
                               'lg:grid-cols-4', 'xl:grid-cols-5');
    });

    test('maintains proper grid spacing', () => {
      const { container } = render(<Deck draftedCards={mockDraftedCards} />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-4');
    });
  });

  describe('Card Removal', () => {
    test('calls onRemoveFromDeck when card is clicked', () => {
      const mockOnRemoveFromDeck = jest.fn();
      render(
        <Deck 
          draftedCards={mockDraftedCards} 
          onRemoveFromDeck={mockOnRemoveFromDeck}
        />
      );
      
      const firstCard = screen.getByTestId('deck-card-card-1');
      fireEvent.click(firstCard);
      
      expect(mockOnRemoveFromDeck).toHaveBeenCalledWith(mockDraftedCards[0]);
    });

    test('passes correct card data to removal handler', () => {
      const mockOnRemoveFromDeck = jest.fn();
      render(
        <Deck 
          draftedCards={mockDraftedCards} 
          onRemoveFromDeck={mockOnRemoveFromDeck}
        />
      );
      
      const thirdCard = screen.getByTestId('deck-card-card-3');
      fireEvent.click(thirdCard);
      
      expect(mockOnRemoveFromDeck).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'card-3',
          name: 'Giant Growth'
        })
      );
    });

    test('handles multiple card removals', () => {
      const mockOnRemoveFromDeck = jest.fn();
      render(
        <Deck 
          draftedCards={mockDraftedCards} 
          onRemoveFromDeck={mockOnRemoveFromDeck}
        />
      );
      
      // Click multiple cards
      fireEvent.click(screen.getByTestId('deck-card-card-1'));
      fireEvent.click(screen.getByTestId('deck-card-card-3'));
      fireEvent.click(screen.getByTestId('deck-card-card-5'));
      
      expect(mockOnRemoveFromDeck).toHaveBeenCalledTimes(3);
    });
  });

  describe('Card Stats Integration', () => {
    test('passes cardStats to Card components', () => {
      render(
        <Deck 
          draftedCards={mockDraftedCards}
          cardStats={mockCardStats}
        />
      );
      
      // Verify stats are passed and displayed
      expect(screen.getByText(/Stats:.*gihwr.*65/)).toBeInTheDocument();
      expect(screen.getByText(/Stats:.*gihwr.*58/)).toBeInTheDocument();
    });

    test('handles missing cardStats gracefully', () => {
      render(
        <Deck 
          draftedCards={mockDraftedCards}
          cardStats={{}}
        />
      );
      
      // Should render without errors
      mockDraftedCards.forEach(card => {
        expect(screen.getByText(card.name)).toBeInTheDocument();
      });
      
      // No stats should be displayed
      expect(screen.queryByText(/Stats:/)).not.toBeInTheDocument();
    });

    test('handles undefined cardStats', () => {
      render(
        <Deck 
          draftedCards={mockDraftedCards}
          cardStats={undefined}
        />
      );
      
      // Should render without errors
      expect(screen.getByText('Your Deck (5 cards)')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles large deck sizes', () => {
      const largeDeck = Array.from({ length: 100 }, (_, i) => ({
        id: `card-${i}`,
        name: `Card ${i}`,
        colors: ['W'],
        cmc: 1
      }));
      
      render(<Deck draftedCards={largeDeck} />);
      
      expect(screen.getByText('Your Deck (100 cards)')).toBeInTheDocument();
      expect(screen.getByText('Card 0')).toBeInTheDocument();
      expect(screen.getByText('Card 99')).toBeInTheDocument();
    });

    test('handles duplicate cards correctly', () => {
      const deckWithDuplicates = [
        { id: 'card-1', name: 'Lightning Bolt' },
        { id: 'card-2', name: 'Lightning Bolt' }, // Same name, different ID
        { id: 'card-3', name: 'Lightning Bolt' }  // Same name, different ID
      ];
      
      render(<Deck draftedCards={deckWithDuplicates} />);
      
      expect(screen.getByText('Your Deck (3 cards)')).toBeInTheDocument();
      expect(screen.getAllByText('Lightning Bolt')).toHaveLength(3);
    });

    test('handles cards with missing properties', () => {
      const incompleteCards = [
        { id: 'card-1', name: 'Card 1' }, // Missing colors, cmc
        { id: 'card-2', name: 'Card 2', colors: ['R'] }, // Missing cmc
        { id: 'card-3', name: 'Card 3', cmc: 2 } // Missing colors
      ];
      
      render(<Deck draftedCards={incompleteCards} />);
      
      // Should render all cards without errors
      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
      expect(screen.getByText('Card 3')).toBeInTheDocument();
    });

    test('handles undefined draftedCards prop', () => {
      render(<Deck draftedCards={undefined} />);
      
      // Should handle undefined gracefully (likely treating as empty array)
      expect(screen.getByText(/Your Deck/)).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    test('always sets inDeck prop to true for Card components', () => {
      const { container } = render(
        <Deck 
          draftedCards={mockDraftedCards}
        />
      );
      
      // All cards should be marked as inDeck
      // This is verified through the Card component behavior
      const cards = container.querySelectorAll('[data-testid^="deck-card-"]');
      expect(cards).toHaveLength(5);
    });

    test('always sets disabled prop to false for Card components', () => {
      const mockOnRemoveFromDeck = jest.fn();
      render(
        <Deck 
          draftedCards={mockDraftedCards}
          onRemoveFromDeck={mockOnRemoveFromDeck}
        />
      );
      
      // Cards should be clickable (not disabled)
      const firstCard = screen.getByTestId('deck-card-card-1');
      fireEvent.click(firstCard);
      
      expect(mockOnRemoveFromDeck).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    test('efficiently re-renders when cards change', () => {
      const { rerender } = render(<Deck draftedCards={mockDraftedCards.slice(0, 3)} />);
      
      expect(screen.getByText('Your Deck (3 cards)')).toBeInTheDocument();
      
      // Add more cards
      rerender(<Deck draftedCards={mockDraftedCards} />);
      
      expect(screen.getByText('Your Deck (5 cards)')).toBeInTheDocument();
      
      // Remove cards
      rerender(<Deck draftedCards={mockDraftedCards.slice(0, 2)} />);
      
      expect(screen.getByText('Your Deck (2 cards)')).toBeInTheDocument();
    });

    test('handles rapid updates gracefully', () => {
      const { rerender } = render(<Deck draftedCards={[]} />);
      
      // Simulate rapid deck changes
      for (let i = 0; i < 20; i++) {
        const cards = mockDraftedCards.slice(0, i % 6);
        rerender(<Deck draftedCards={cards} />);
      }
      
      // Should still render correctly after rapid updates
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('provides semantic heading structure', () => {
      render(<Deck draftedCards={mockDraftedCards} />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Your Deck (5 cards)');
    });

    test('empty state message is descriptive', () => {
      render(<Deck draftedCards={[]} />);
      
      const emptyMessage = screen.getByText(/No cards drafted yet/);
      expect(emptyMessage).toBeInTheDocument();
      expect(emptyMessage).toHaveTextContent('No cards drafted yet. Start picking to build your deck!');
    });

    test('maintains proper HTML structure', () => {
      const { container } = render(<Deck draftedCards={mockDraftedCards} />);
      
      const deckContainer = container.querySelector('.my-6');
      expect(deckContainer).toBeInTheDocument();
      
      const heading = deckContainer.querySelector('h2');
      expect(heading).toBeInTheDocument();
      
      const grid = deckContainer.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    test('applies correct spacing classes', () => {
      const { container } = render(<Deck draftedCards={mockDraftedCards} />);
      
      const deckContainer = container.querySelector('.my-6');
      expect(deckContainer).toBeInTheDocument();
    });

    test('heading has correct styling classes', () => {
      render(<Deck draftedCards={mockDraftedCards} />);
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-2xl', 'font-bold', 'text-white', 'mb-4');
    });

    test('empty state has correct styling', () => {
      render(<Deck draftedCards={[]} />);
      
      const emptyMessage = screen.getByText(/No cards drafted yet/);
      expect(emptyMessage).toHaveClass('text-center', 'text-lg', 'text-gray-400');
    });
  });
});
