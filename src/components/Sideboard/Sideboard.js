import React from 'react';
import Card from '../Card/Card';

// Sideboard Component
const Sideboard = ({ sideboardCards = [], cardStats, onMoveFromSideboard }) => {
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

export default Sideboard;