import React from 'react';
import Card from '../Card/Card';

// Updated Deck Component: Hide grid if no cards, show message instead
const Deck = ({ draftedCards, cardStats, onRemoveFromDeck }) => {
  return (
    <div className="my-6">
      <h2 className="text-2xl font-bold text-white mb-4">Your Deck ({draftedCards.length} cards)</h2>
      {/* Updated: Hide grid if empty, show message */}
      {draftedCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {draftedCards.map((card, index) => (
            <Card
              key={`${card.id}-${index}`}
              card={card}
              onRemoveFromDeck={onRemoveFromDeck}
              inDeck={true}
              disabled={false}
              cardStats={cardStats}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-lg text-gray-400">No cards drafted yet. Start picking to build your deck!</p>
      )}
    </div>
  );
};

export default Deck;