// src/components/Pack/Pack.js
import React from 'react';
import Card from '../Card/Card';


// Updated Pack Component: Added showGlobalStats prop
const Pack = ({ cards, onPick, disabled, cardStats, suggestedCardId, showGlobalStats }) => {
  return (
    <div className="my-6">
      <h2 className="text-2xl font-bold text-white mb-4">Current Pack ({cards.length} cards)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {cards.map((card, index) => (
        <Card
          key={`${card.id}-${index}`}
          card={card}
          onPick={onPick}
          disabled={disabled}
          cardStats={cardStats}
          isSuggested={card.id === suggestedCardId}
          showGlobalStats={showGlobalStats}
        />
        ))}
      </div>
    </div>
  );
};


export default Pack;