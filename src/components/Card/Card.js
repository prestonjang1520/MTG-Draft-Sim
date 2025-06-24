// src/components/Card/Card.js
import React, { useState } from 'react';


const Card = ({ card, onPick, disabled = false, onAddToDeck, onRemoveFromDeck, inDeck = false, cardStats, isSuggested = false, showGlobalStats = false }) => {
  const [showStats, setShowStats] = useState(false);
  const stats = cardStats[card.name] || {}; // Retrieve stats or empty object


  return (
    <div
      className={`bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition hover:scale-105 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${isSuggested ? 'border-4 border-yellow-500' : ''}`}
      onClick={() => !disabled && (onPick ? onPick(card) : (inDeck ? onRemoveFromDeck(card) : onAddToDeck(card)))}
    >
      <img
        src={card.image_uris?.normal || 'https://via.placeholder.com/223x310?text=No+Image'}
        alt={card.name}
        className="w-full h-64 object-contain bg-gray-700"
      />
      <div className="p-4 text-white min-h-[60px]">
        <h3 className="text-lg font-bold truncate">{card.name}</h3>
        {/* Updated: Conditionally render the button ONLY if stats exist (hide if empty) */}
        {Object.keys(stats).length > 0 && (
          <>
            {showStats && (
              <div className="mt-2 text-sm bg-gray-700 p-2 rounded">
                <p><strong>GIHWR:</strong> {stats.gihwr ? `${stats.gihwr}%` : 'N/A'}</p>
                <p><strong>OHWR:</strong> {stats.ohwr ? `${stats.ohwr}%` : 'N/A'}</p>
                <p><strong>GDWR:</strong> {stats.gdwr ? `${stats.gdwr}%` : 'N/A'}</p>
                <p><strong>Color:</strong> {stats.color || 'N/A'}</p>
              </div>
            )}
          </>
        )}
        {/* New: Show global stats underneath card when enabled */}
        {showGlobalStats && Object.keys(stats).length > 0 && (
          <div className="mt-2 text-xs bg-gray-600 p-2 rounded border-t border-gray-500">
            <p className="text-yellow-300"><strong>GIHWR:</strong> {stats.gihwr ? `${stats.gihwr}%` : 'N/A'}</p>
            <p className="text-blue-300"><strong>OHWR:</strong> {stats.ohwr ? `${stats.ohwr}%` : 'N/A'}</p>
            <p className="text-green-300"><strong>GDWR:</strong> {stats.gdwr ? `${stats.gdwr}%` : 'N/A'}</p>
          </div>
        )}
      </div>
    </div>
  );
};


export default Card;