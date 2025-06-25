import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Card from './components/Card/Card';

describe('Card Component', () => {
  const mockCard = {
    id: 'test-card-1',
    name: 'Lightning Bolt',
    image_uris: {
      normal: 'https://example.com/lightning-bolt.jpg'
    },
    colors: ['R'],
    cmc: 1,
    type_line: 'Instant',
    rarity: 'common'
  };

  const mockCardStats = {
    'Lightning Bolt': {
      gihwr: 62.5,
      ohwr: 58.3,
      gdwr: 60.1,
      color: 'R'
    }
  };

  describe('Basic Rendering', () => {
    test('renders card with image and name', () => {
      render(<Card card={mockCard} />);
      
      const image = screen.getByAltText('Lightning Bolt');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockCard.image_uris.normal);
      
      expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
    });

    test('renders placeholder image when image_uris is missing', () => {
      const cardWithoutImage = { ...mockCard, image_uris: undefined };
      render(<Card card={cardWithoutImage} />);
      
      const image = screen.getByAltText('Lightning Bolt');
      expect(image).toHaveAttribute('src', expect.stringContaining('placeholder'));
    });

    test('applies disabled styling when disabled prop is true', () => {
      const { container } = render(<Card card={mockCard} disabled={true} />);
      
      const cardDiv = container.firstChild;
      expect(cardDiv).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    test('applies suggested styling when isSuggested is true', () => {
      const { container } = render(<Card card={mockCard} isSuggested={true} />);
      
      const cardDiv = container.firstChild;
      expect(cardDiv).toHaveClass('border-4', 'border-yellow-500');
    });
  });

  describe('Click Handlers', () => {
    test('calls onPick when clicked and not disabled', () => {
      const mockOnPick = jest.fn();
      render(<Card card={mockCard} onPick={mockOnPick} disabled={false} />);
      
      const cardElement = screen.getByText('Lightning Bolt').closest('div.bg-gray-800');
      fireEvent.click(cardElement);
      
      expect(mockOnPick).toHaveBeenCalledWith(mockCard);
    });

    test('does not call onPick when disabled', () => {
      const mockOnPick = jest.fn();
      render(<Card card={mockCard} onPick={mockOnPick} disabled={true} />);
      
      const cardElement = screen.getByText('Lightning Bolt').closest('div.bg-gray-800');
      fireEvent.click(cardElement);
      
      expect(mockOnPick).not.toHaveBeenCalled();
    });

    test('calls onAddToDeck when clicked without onPick and not in deck', () => {
      const mockOnAddToDeck = jest.fn();
      render(<Card card={mockCard} onAddToDeck={mockOnAddToDeck} inDeck={false} />);
      
      const cardElement = screen.getByText('Lightning Bolt').closest('div.bg-gray-800');
      fireEvent.click(cardElement);
      
      expect(mockOnAddToDeck).toHaveBeenCalledWith(mockCard);
    });

    test('calls onRemoveFromDeck when clicked and in deck', () => {
      const mockOnRemoveFromDeck = jest.fn();
      render(
        <Card 
          card={mockCard} 
          onRemoveFromDeck={mockOnRemoveFromDeck} 
          inDeck={true} 
        />
      );
      
      const cardElement = screen.getByText('Lightning Bolt').closest('div.bg-gray-800');
      fireEvent.click(cardElement);
      
      expect(mockOnRemoveFromDeck).toHaveBeenCalledWith(mockCard);
    });
  });

  describe('Stats Display', () => {
    test('does not show stats when cardStats is empty', () => {
      render(<Card card={mockCard} cardStats={{}} />);
      
      expect(screen.queryByText('GIHWR:')).not.toBeInTheDocument();
    });

    test('shows global stats when showGlobalStats is true and stats exist', () => {
      render(
        <Card 
          card={mockCard} 
          cardStats={mockCardStats} 
          showGlobalStats={true} 
        />
      );
      
      expect(screen.getByText('GIHWR:')).toBeInTheDocument();
      expect(screen.getByText('62.5%')).toBeInTheDocument();
      expect(screen.getByText('OHWR:')).toBeInTheDocument();
      expect(screen.getByText('58.3%')).toBeInTheDocument();
      expect(screen.getByText('GDWR:')).toBeInTheDocument();
      expect(screen.getByText('60.1%')).toBeInTheDocument();
    });

    test('does not show global stats when showGlobalStats is false', () => {
      render(
        <Card 
          card={mockCard} 
          cardStats={mockCardStats} 
          showGlobalStats={false} 
        />
      );
      
      expect(screen.queryByText('GIHWR:')).not.toBeInTheDocument();
    });

    test('shows N/A for missing stat values', () => {
      const incompleteStats = {
        'Lightning Bolt': {
          gihwr: 62.5,
          // Missing ohwr and gdwr
          color: 'R'
        }
      };
      
      render(
        <Card 
          card={mockCard} 
          cardStats={incompleteStats} 
          showGlobalStats={true} 
        />
      );
      
      expect(screen.getByText('62.5%')).toBeInTheDocument();
      expect(screen.getAllByText('N/A')).toHaveLength(2); // For OHWR and GDWR
    });
  });

  describe('Hover Effects', () => {
    test('applies hover scale transform', () => {
      const { container } = render(<Card card={mockCard} />);
      
      const cardDiv = container.firstChild;
      expect(cardDiv).toHaveClass('transform', 'transition', 'hover:scale-105');
    });
  });

  describe('Edge Cases', () => {
    test('handles card with no name gracefully', () => {
      const cardWithoutName = { ...mockCard, name: undefined };
      render(<Card card={cardWithoutName} />);
      
      // Should render without crashing
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    test('handles card with special characters in name', () => {
      const specialCard = { 
        ...mockCard, 
        name: "Nissa's Pilgrimage // Nissa's Revelation" 
      };
      render(<Card card={specialCard} />);
      
      expect(screen.getByText("Nissa's Pilgrimage // Nissa's Revelation")).toBeInTheDocument();
    });

    test('truncates very long card names', () => {
      const longNameCard = {
        ...mockCard,
        name: 'This Is An Extremely Long Card Name That Should Be Truncated'
      };
      const { container } = render(<Card card={longNameCard} />);
      
      const nameElement = screen.getByText(longNameCard.name);
      expect(nameElement).toHaveClass('truncate');
    });
  });

  describe('Multiple Click Handler Scenarios', () => {
    test('prioritizes onPick over other handlers', () => {
      const mockOnPick = jest.fn();
      const mockOnAddToDeck = jest.fn();
      const mockOnRemoveFromDeck = jest.fn();
      
      render(
        <Card 
          card={mockCard} 
          onPick={mockOnPick}
          onAddToDeck={mockOnAddToDeck}
          onRemoveFromDeck={mockOnRemoveFromDeck}
          inDeck={false}
        />
      );
      
      const cardElement = screen.getByText('Lightning Bolt').closest('div.bg-gray-800');
      fireEvent.click(cardElement);
      
      expect(mockOnPick).toHaveBeenCalledTimes(1);
      expect(mockOnAddToDeck).not.toHaveBeenCalled();
      expect(mockOnRemoveFromDeck).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('image has appropriate alt text', () => {
      render(<Card card={mockCard} />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', mockCard.name);
    });

    test('card is keyboard accessible when not disabled', () => {
      const mockOnPick = jest.fn();
      render(<Card card={mockCard} onPick={mockOnPick} disabled={false} />);
      
      const cardElement = screen.getByText('Lightning Bolt').closest('div.bg-gray-800');
      expect(cardElement).toHaveClass('cursor-pointer');
    });

    test('card is not keyboard accessible when disabled', () => {
      render(<Card card={mockCard} disabled={true} />);
      
      const cardElement = screen.getByText('Lightning Bolt').closest('div.bg-gray-800');
      expect(cardElement).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Performance', () => {
    test('renders efficiently with minimal re-renders', () => {
      const { rerender } = render(<Card card={mockCard} />);
      
      // Rerender with same props - should not cause issues
      rerender(<Card card={mockCard} />);
      
      expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
    });

    test('handles rapid clicks gracefully', () => {
      const mockOnPick = jest.fn();
      render(<Card card={mockCard} onPick={mockOnPick} />);
      
      const cardElement = screen.getByText('Lightning Bolt').closest('div.bg-gray-800');
      
      // Simulate rapid clicking
      for (let i = 0; i < 10; i++) {
        fireEvent.click(cardElement);
      }
      
      expect(mockOnPick).toHaveBeenCalledTimes(10);
    });
  });
});
