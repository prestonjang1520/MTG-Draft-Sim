import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import Card from './components/Card/Card';
import Pack from './components/Pack/Pack';
import Deck from './components/Deck/Deck';

// Sideboard Component
const Sideboard = ({ sideboardCards, cardStats, onMoveFromSideboard }) => {
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

// Main App Component
const App = () => {
  // Existing states (unchanged)
  const [cards, setCards] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPackIndex, setCurrentPackIndex] = useState(0);
  const [draftComplete, setDraftComplete] = useState(false);
  const [sets, setSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState('dmu');
  const [loadingSets, setLoadingSets] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [draftHistory, setDraftHistory] = useState([]);
  const [suggestedCardId, setSuggestedCardId] = useState(null);

  // New states for deck building
  const [builtDeck, setBuiltDeck] = useState([]); // Selected cards for the deck
  const [deckSort, setDeckSort] = useState('cmc'); // Sorting option: 'cmc' or 'color'
  const [draftDeckSort, setDraftDeckSort] = useState('cmc');
  
  // New state for card stats from CSV
  const [cardStats, setCardStats] = useState({});
  const [showGlobalStats, setShowGlobalStats] = useState(false);

  // New: Load color pair stats from CSV
  const [colorPairStats, setColorPairStats] = useState({});

  // New: Compute globalStats from cardStats
  const globalStats = useMemo(() => {
    const values = Object.values(cardStats);
    if (values.length === 0) return null;

    const sum = (key) => values.reduce((acc, card) => acc + (card[key] || 0), 0);
    const avg = (key) => sum(key) / values.length;

    return {
      avgGihwr: avg('gihwr'),
      avgOhwr: avg('ohwr'),
      avgGdwr: avg('gdwr'),
    };
  }, [cardStats]);

  // Fetch all paper MTG sets from Scryfall with updated filtering
  useEffect(() => {
    const fetchSets = async () => {
      setLoadingSets(true);
      try {
        const response = await axios.get('https://api.scryfall.com/sets');
        // Updated Filter:
        // - Include only 'core' (base/core sets) or 'expansion' (expansion sets)
        // - AND released on/after '2003-07-28' (Modern era start: Eighth Edition)
        // - Exclude digital, token, memorabilia, and other non-relevant types
        // - Exclude alchemy and rebalanced sets
        const filteredSets = response.data.data
          .filter((set) => 
            !set.digital &&  // Exclude digital sets
            set.set_type !== 'token' &&  // Exclude tokens
            set.set_type !== 'memorabilia' &&  // Exclude memorabilia
            (set.set_type === 'core' || set.set_type === 'expansion') &&  // Only base/core and expansion
            new Date(set.released_at) >= new Date('2003-07-28') &&  // Only Modern-era sets (2003+)
            !set.code.startsWith('y') &&  // Exclude alchemy sets (often start with 'y')
            !set.name.toLowerCase().includes('alchemy')  // Exclude any with 'alchemy' in name
          )
          .sort((a, b) => new Date(b.released_at) - new Date(a.released_at)); // Sort by release date (newest first)
        
        setSets(filteredSets);
        
        // Log for debugging: Show how many sets were kept
        console.log(`Filtered to ${filteredSets.length} sets (only Modern-era core and expansion sets).`);
        if (filteredSets.length === 0) {
          console.error('No sets match the filter criteria. Check filter logic or API data.');
        }
      } catch (error) {
        console.error('Error fetching sets:', error);
      } finally {
        setLoadingSets(false);
      }
    };
    fetchSets();
  }, []);

  // Fetch cards based on the selected set (unchanged)
  useEffect(() => {
    if (selectedSet) {
      const fetchCards = async () => {
        setLoadingCards(true);
        setCards([]); // Clear previous cards
        setPlayers([]); // Reset draft state when changing sets
        setCurrentRound(1);
        setCurrentPackIndex(0);
        setDraftComplete(false);
        try {
          let allCards = [];
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const response = await axios.get(
              `https://api.scryfall.com/cards/search?order=set&q=e%3A${selectedSet}+-is%3Adigital&page=${page}`
            );
            allCards = [...allCards, ...response.data.data];
            hasMore = response.data.has_more;
            page += 1;
          }

          if (!allCards.length) {
            console.error(`No cards found for set: ${selectedSet}`);
            return;
          }

          setCards(allCards);
          initializeDraft(allCards);
        } catch (error) {
          console.error(`Error fetching cards for set ${selectedSet}:`, error);
        } finally {
          setLoadingCards(false);
        }
      };
      fetchCards();
    }
  }, [selectedSet]);

  // New: Load color pair stats when set changes
  useEffect(() => {
    if (selectedSet) {
      const loadColorPairStats = async () => {
        try {
          const response = await fetch(`/data/sets/${selectedSet}/color_pairs.csv`);
          const csvText = await response.text();
          
          Papa.parse(csvText, {
            header: true,
            complete: (results) => {
              const pairStats = {};
              
              results.data.forEach(row => {
                if (row.Color && row['Win Rate']) {
                  // Parse win rate percentage
                  const winRate = parseFloat(row['Win Rate'].replace('%', ''));
                  pairStats[row.Color] = winRate;
                }
              });
              
              setColorPairStats(pairStats);
              console.log(`Loaded color pair stats for ${Object.keys(pairStats).length} combinations in set ${selectedSet}`);
            },
            error: (error) => {
              console.error('Error parsing color pairs CSV:', error);
            }
          });
        } catch (error) {
          console.error(`Failed to load color pair stats for set ${selectedSet}:`, error);
          setColorPairStats({});
        }
      };

      loadColorPairStats();
    }
  }, [selectedSet]);

  // Updated: Calculate color pair bonus based on AI's current colors
  const getColorPairBonus = (cardColors, aiColors, colorPairStats) => {
    if (!cardColors || cardColors.length === 0 || !aiColors || aiColors.length === 0) return 0;

    // Helper to convert single letter to full color name for mono-color keys
    const colorLetterToName = (c) => {
      switch (c) {
        case 'W': return 'White';
        case 'U': return 'Blue';
        case 'B': return 'Black';
        case 'R': return 'Red';
        case 'G': return 'Green';
        default: return c;
      }
    };

    // Sorted string key from colors (e.g. ['W','U'] -> 'UW')
    const sortedKey = (colors) => [...colors].sort().join('');

    // Map two-color combos (guilds)
    const twoColorMap = {
      'UW': 'Azorius (WU)',
      'UB': 'Dimir (UB)',
      'BR': 'Rakdos (BR)',
      'RG': 'Gruul (RG)',
      'GW': 'Selesnya (GW)',
      'WB': 'Orzhov (WB)',
      'BG': 'Golgari (BG)',
      'GU': 'Simic (GU)',
      'UR': 'Izzet (UR)',
      'RW': 'Boros (RW)',
    };

    // Map three-color combos (shards & wedges)
    const threeColorMap = {
      'UWR': 'Jeskai (WUR)',
      'BGU': 'Sultai (UBG)',
      'BRW': 'Mardu (BRW)',
      'GRU': 'Temur (RGU)',
      'GW B': 'Abzan (GWB)', // but need to sort and map correctly (will fix below)
      'GWU': 'Bant (GWU)',
      'UBW': 'Esper (WUB)',
      'UBR': 'Grixis (UBR)',
      'BRG': 'Jund (BRG)',
      'GRW': 'Naya (RGW)',
    };

    // Actually, the threeColorMap keys must be sorted keys of color letters:
    // so we need to fix them all to sorted keys:
    const fixedThreeColorMap = {
      'RUW': 'Jeskai (WUR)',    // WUR sorted: RUW
      'BGU': 'Sultai (UBG)',
      'BRW': 'Mardu (BRW)',
      'GRU': 'Temur (RGU)',
      'BGW': 'Abzan (GWB)',
      'GWU': 'Bant (GWU)',
      'BUW': 'Esper (WUB)',
      'BUR': 'Grixis (UBR)',
      'BGR': 'Jund (BRG)',
      'GRW': 'Naya (RGW)',
    };

    // Convert cardColors and aiColors to sorted keys for lookup
    const aiKey = sortedKey(aiColors);
    const cardKey = sortedKey(cardColors);

    // Helper to check if card colors are subset of AI colors
    const cardFitsColors = cardColors.every(c => aiColors.includes(c));
    if (!cardFitsColors) return 0;

    // Build list of candidate keys to check, in order from most specific to general

    const keyCandidates = [];

    // Mono-color keys
    if (aiColors.length === 1) {
      keyCandidates.push(`Mono-${colorLetterToName(aiColors[0])}`);
      keyCandidates.push('Mono-color');
      // Also consider splash variants if card or ai colors length > 1
      if (aiColors.length > 1) {
        keyCandidates.push(`Mono-${colorLetterToName(aiColors[0])} + Splash`);
        keyCandidates.push('Mono-color + Splash');
      }
    }

    // Two-color keys
    if (aiColors.length === 2) {
      keyCandidates.push(twoColorMap[aiKey]);
      keyCandidates.push(`${twoColorMap[aiKey]} + Splash`);
      keyCandidates.push('Two-color');
      keyCandidates.push('Two-color + Splash');
    }

    // Three-color keys
    if (aiColors.length === 3) {
      keyCandidates.push(fixedThreeColorMap[aiKey]);
      keyCandidates.push(`${fixedThreeColorMap[aiKey]} + Splash`);
      keyCandidates.push('Three-color');
      keyCandidates.push('Three-color + Splash');
    }

    // Four-color keys (generic)
    if (aiColors.length === 4) {
      // You can add more specific four-color mappings if you want
      keyCandidates.push('Four-color');
      keyCandidates.push('Four-color + Splash');
    }

    // Five-color keys (generic)
    if (aiColors.length === 5) {
      keyCandidates.push('Five-color');
      keyCandidates.push('All Colors (WUBRG)');
    }

    // Always add generic fallback
    keyCandidates.push('All Decks');

    // Try to find a valid win rate in colorPairStats for these keys
    let winRate = null;
    for (const key of keyCandidates) {
      if (key && colorPairStats[key] !== undefined) {
        winRate = colorPairStats[key];
        break;
      }
    }

    if (winRate === null) return 0;

    // Scale so 60% win rate = +5 bonus, 50% = 0, 40% = -5
    return (winRate - 50) * 0.5;
  };

  // Updated: Calculate a score for a card based on stats, "strength", color match, and color pair win rates
  const calculateCardScore = (card, aiPlayer) => {
    // Get card stats if available
    const stats = cardStats[card.name] || {};
    
    // 1. Stats-based score (prioritize real data when available)
    let statsScore = 0;
    if (stats.gihwr) {
      // Games in Hand Win Rate (0-100 scale, weighted highest)
      statsScore += stats.gihwr * 1.5;
      
      // Opening Hand Win Rate (bonus if available)
      if (stats.ohwr) {
        statsScore += stats.ohwr * 0.8;
      }
      
      // Games Drawn Win Rate (bonus if available)
      if (stats.gdwr) {
        statsScore += stats.gdwr * 0.7;
      }
    } else {
      // Fallback to original scoring if no stats available
      
      // Rarity Score: Prioritize higher rarity for "stronger" cards
      const rarityMap = { mythic: 10, rare: 8, uncommon: 5, common: 3 };
      let rarityScore = rarityMap[card.rarity] || 1; // Default for special cases

      // CMC Score: Favor lower CMC for efficiency (max 10, decreases with higher CMC)
      const cmc = card.cmc || 0;
      let cmcScore = Math.max(10 - cmc, 0); // e.g., CMC 2 -> 8, CMC 6 -> 4

      // Type/Stats Score: Bonus for card type and creature stats
      let typeScore = 0;
      if (card.type_line.includes('Creature')) {
        const power = parseInt(card.power) || 0;
        const toughness = parseInt(card.toughness) || 0;
        typeScore += (power + toughness) / 2; // e.g., 3/3 creature adds ~3
        typeScore += 2; // Extra bonus for creatures
      } else if (card.type_line.includes('Instant') || card.type_line.includes('Sorcery')) {
        typeScore += 4; // Bonus for removal/spells
      } else if (card.type_line.includes('Artifact') || card.type_line.includes('Enchantment')) {
        typeScore += 3; // Bonus for supportive permanents
      }
      
      statsScore = rarityScore + cmcScore + typeScore;
    }

    // 2. Color Match Weight: Dynamic weighting based on AI's current colors
    let colorScore = 0;
    const cardColors = card.colors || []; // Array of colors, e.g., ['W', 'U']
    
    // If we have stats-based color info, use it
    const statsColor = stats.color || '';
    const cardColorInfo = statsColor.split('') || cardColors;
    
    if (cardColorInfo.length === 0) {
      colorScore += 3; // Bonus for colorless (flexible for any deck)
    } else {
      cardColorInfo.forEach((color) => {
        if (aiPlayer.colors.includes(color)) {
          colorScore += 5; // +5 per matching color (strong weight for on-color)
        }
      });
      
      if (cardColorInfo.every((color) => aiPlayer.colors.includes(color))) {
        colorScore += 3; // Extra bonus if all card colors match (encourages synergy)
      }
    }

    // 3. New: Color Pair Bonus based on win rates
    const colorPairBonus = getColorPairBonus(cardColorInfo, aiPlayer.colors, colorPairStats);

    // Total Score: Combine stats score, color score, and color pair bonus
    // If we have real stats, they should be weighted more heavily
    const totalScore = stats.gihwr ? 
      (statsScore + colorScore * 1.5 + colorPairBonus) : 
      (statsScore + colorScore + colorPairBonus);
    
    // Optional: Log for debugging (uncomment to see scores)
    // console.log(`Card: ${card.name}, Total Score: ${totalScore} (Stats: ${statsScore}, Color: ${colorScore}, Pair Bonus: ${colorPairBonus})`);
    
    return totalScore;
  };
  
  // New Helper: Update player's color preferences based on drafted cards
  const updatePlayerColors = (player) => {
    const colorCounts = { W: 0, U: 0, B: 0, R: 0, G: 0 };
    player.draftedCards.forEach((card) => {
      (card.colors || []).forEach((color) => {
        if (colorCounts[color] !== undefined) {
          colorCounts[color]++;
        }
      });
    });
    
    // Set player's colors to the top 2 most common (or keep initial if early in draft)
    const sortedColors = Object.entries(colorCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([color]) => color)
      .slice(0, 2); // Limit to 2 colors for focus
    
    player.colors = sortedColors.length > 0 ? sortedColors : player.colors; // Fallback to initial
  };

  // Updated: AI picks the "strongest" card with weighted color preference and stats
  const aiPickCard = (pack, aiPlayer) => {
    if (pack.length === 0) return null;
    
    // Sort by calculated score (higher is better)
    const sortedPack = [...pack].sort((a, b) => {
      const aScore = calculateCardScore(a, aiPlayer);
      const bScore = calculateCardScore(b, aiPlayer);
      return bScore - aScore; // Descending order
    });
    
    // Log the top pick for debugging
    if (sortedPack.length > 0) {
      const topPick = sortedPack[0];
      const stats = cardStats[topPick.name];
      console.log(`AI ${aiPlayer.id} picked ${topPick.name} ${stats ? `(GIHWR: ${stats.gihwr})` : '(no stats)'}`);
    }
    
    return sortedPack[0]; // Pick the highest-scoring card
  };

  // The rest of the code remains unchanged (generatePack, initializeAIOpponents, etc.)
  const generatePack = (cards) => {
    const commons = cards.filter((card) => card.rarity === 'common');
    const uncommons = cards.filter((card) => card.rarity === 'uncommon');
    const rares = cards.filter((card) => card.rarity === 'rare');
    const mythics = cards.filter((card) => card.rarity === 'mythic');
    const lands = cards.filter((card) => card.type_line.includes('Basic Land'));

    const rareOrMythic = mythics.length && Math.random() < 0.125 ? mythics : rares;
    const rareCard = rareOrMythic.length
      ? rareOrMythic[Math.floor(Math.random() * rareOrMythic.length)]
      : commons[Math.floor(Math.random() * commons.length)];

    const shuffledUncommons = [...uncommons].sort(() => Math.random() - 0.5);
    const uncommonCards = shuffledUncommons.slice(0, 3);

    const shuffledCommons = [...commons].sort(() => Math.random() - 0.5);
    const commonCards = shuffledCommons.slice(0, 10);

    const landCard = lands.length
      ? lands[Math.floor(Math.random() * lands.length)]
      : commons[Math.floor(Math.random() * commons.length)];

    const pack = [rareCard, ...uncommonCards, ...commonCards, landCard].filter(Boolean);

    const landCount = pack.filter((card) => card.type_line.includes('Basic Land')).length;
    if (landCount !== 1) {
      console.error(`Invalid pack generated with ${landCount} lands. Regenerating...`);
      return generatePack(cards);
    }

    const rarityOrder = { mythic: 1, rare: 2, uncommon: 3, common: 4, land: 5 };
    return pack.sort((a, b) => {
      const aRarity = a.type_line.includes('Basic Land') ? 'land' : a.rarity;
      const bRarity = b.type_line.includes('Basic Land') ? 'land' : b.rarity;
      return rarityOrder[aRarity] - rarityOrder[bRarity];
    });
  };

  const initializeAIOpponents = (numOpponents) => {
    const colors = ['W', 'U', 'B', 'R', 'G'];
    return Array.from({ length: numOpponents }, (_, i) => ({
      id: `AI_${i + 1}`,
      colors: [colors[Math.floor(Math.random() * colors.length)]],
      draftedCards: [],
      sideboard: [],
      packs: [],
    }));
  };

  const initializeDraft = (cards) => {
    const aiOpponents = initializeAIOpponents(7);
    const humanPlayer = { id: 'human', colors: [], draftedCards: [], sideboard: [], packs: [] };
    const allPlayers = [humanPlayer, ...aiOpponents];

    allPlayers.forEach((player) => {
      player.packs = [generatePack(cards), generatePack(cards), generatePack(cards)];
    });

    setPlayers(allPlayers);
  };

  const passPacks = (players, round) => {
    const direction = round % 2 === 1 ? 'left' : 'right';
    const currentPacks = players.map((player) => [...player.packs[round - 1]]);

    players.forEach((player, index) => {
      const nextIndex =
        direction === 'left'
          ? (index + 1) % players.length
          : (index - 1 + players.length) % players.length;
      player.packs[round - 1] = currentPacks[nextIndex];

      const landCount = player.packs[round - 1].filter((card) =>
        card.type_line.includes('Basic Land')
      ).length;
      if (landCount > 1) {
        console.error(`Player ${player.id} pack has ${landCount} lands after passing. Correcting...`);
        const extraLands = player.packs[round - 1]
          .filter((card) => card.type_line.includes('Basic Land'))
          .slice(1);
        player.packs[round - 1] = player.packs[round - 1].filter(
          (card) => !extraLands.includes(card)
        );
      }
    });
  };

  // New: Function to handle undoing the last pick
  const handleUndo = () => {
    if (draftHistory.length === 0) {
      console.log('No actions to undo.');
      return;
    }
    
    // Restore the last saved state
    const lastState = draftHistory.pop();
    setPlayers(lastState.players);
    setCurrentPackIndex(lastState.packIndex);
    setDraftHistory([...draftHistory]); // Update history after pop
    console.log('Undo successful: Reverted to previous pick state.');
  };

  // Updated: Handle human pick, now with history saving for undo
  const handlePick = (card) => {
    // New: Save current state for undo (deep copy to avoid reference issues)
    const currentState = {
      players: JSON.parse(JSON.stringify(players)), // Deep copy of players (includes packs and drafted cards)
      packIndex: currentPackIndex,
    };
    setDraftHistory((prev) => [...prev, currentState].slice(-5)); // Keep only last 5 for memory efficiency

    // Original pick logic (unchanged except for integration)
    const updatedPlayers = players.map((player) => ({ ...player, packs: [...player.packs] }));
    const humanPlayer = updatedPlayers[0];
    const currentPack = humanPlayer.packs[currentRound - 1];

    humanPlayer.draftedCards = [...humanPlayer.draftedCards, card];
    humanPlayer.packs[currentRound - 1] = currentPack.filter((c) => c.id !== card.id);
    updatePlayerColors(humanPlayer);

    for (let i = 1; i < updatedPlayers.length; i++) {
      const aiPlayer = updatedPlayers[i];
      const aiPack = aiPlayer.packs[currentRound - 1];
      if (aiPack.length > 0) {
        const aiCard = aiPickCard(aiPack, aiPlayer);
        if (aiCard) {
          aiPlayer.draftedCards = [...aiPlayer.draftedCards, aiCard];
      aiPlayer.packs[currentRound - 1] = aiPack.filter((c) => c.id !== aiCard.id);
      updatePlayerColors(aiPlayer);
        }
      }
    }

    passPacks(updatedPlayers, currentRound);

    const allPacksEmpty = updatedPlayers.every(
      (player) => player.packs[currentRound - 1].length === 0
    );

    if (allPacksEmpty) {
      if (currentRound < 3) {
        setCurrentRound(currentRound + 1);
        setCurrentPackIndex(0);
        setDraftHistory([]); // New: Clear history when advancing rounds
      } else {
        setDraftComplete(true);
        setDraftHistory([]); // New: Clear history when draft completes
      }
    } else {
      setCurrentPackIndex(currentPackIndex + 1);
    }

    setSuggestedCardId(null);
    setPlayers(updatedPlayers);
  };

  // New: Functions for sideboard and sorting
  const sortDraftDeck = (criteria) => {
    const updatedPlayers = players.map((p, i) => {
      if (i === 0) {
        const sorted = [...p.draftedCards].sort((a, b) => {
          if (criteria === 'cmc') return (a.cmc || 0) - (b.cmc || 0);
          if (criteria === 'color') return (a.colors?.[0] || '').localeCompare(b.colors?.[0] || '');
          return 0;
        });
        return { ...p, draftedCards: sorted };
      }
      return p;
    });
    setPlayers(updatedPlayers);
  };

  const moveToSideboard = (card) => {
    const updatedPlayers = players.map((p, i) => {
      if (i === 0) {
        return {
          ...p,
          draftedCards: p.draftedCards.filter((c) => c.id !== card.id),
          sideboard: [...p.sideboard, card],
        };
      }
      return p;
    });
    setPlayers(updatedPlayers);
  };

  const moveFromSideboard = (card) => {
    const updatedPlayers = players.map((p, i) => {
      if (i === 0) {
        return {
          ...p,
          sideboard: p.sideboard.filter((c) => c.id !== card.id),
          draftedCards: [...p.draftedCards, card],
        };
      }
      return p;
    });
    setPlayers(updatedPlayers);
  };

  // New: Deck Building Helper - Auto-suggest and add lands
  const suggestLands = () => {
    const colorCounts = { W: 0, U: 0, B: 0, R: 0, G: 0 };
    builtDeck.forEach((card) => {
      (card.colors || []).forEach((color) => colorCounts[color]++);
    });
    const totalColors = Object.values(colorCounts).reduce((sum, count) => sum + count, 0) || 1;
    const suggestedLands = [];
    const totalLandsNeeded = 17; // Typical for 40-card deck; adjustable
    ['W', 'U', 'B', 'R', 'G'].forEach((color) => {
      const count = Math.round((colorCounts[color] / totalColors) * totalLandsNeeded);
      for (let i = 0; i < count; i++) {
        suggestedLands.push({
          id: `basic-${color}-${i}`,
          name: `${color === 'W' ? 'Plains' : color === 'U' ? 'Island' : color === 'B' ? 'Swamp' : color === 'R' ? 'Mountain' : 'Forest'}`,
          type_line: 'Basic Land',
          colors: [color],
          image_uris: { normal: 'https://via.placeholder.com/223x310?text=Basic+Land' }, // Placeholder; replace with real images
        });
      }
    });
    setBuiltDeck([...builtDeck, ...suggestedLands]);
  };

  // Updated: Clear history when changing sets (in fetchCards useEffect)
  useEffect(() => {
    if (selectedSet) {
      const fetchCards = async () => {
        setLoadingCards(true);
        setCards([]); 
        setPlayers([]); 
        setDraftHistory([]); // New: Clear undo history on set change
        setCurrentRound(1);
        setCurrentPackIndex(0);
        setDraftComplete(false);
        // ... (rest of fetchCards unchanged)
      };
      fetchCards();
    }
  }, [selectedSet]);

  // New: Load card stats from CSV when set changes
  useEffect(() => {
    if (selectedSet) {
      const loadCardStats = async () => {
        try {
          const response = await fetch(`/data/sets/${selectedSet}/ratings.csv`);
          const csvText = await response.text();
          
          // Parse CSV
          Papa.parse(csvText, {
            header: true,
            complete: (results) => {
              const stats = {};

              results.data.forEach(row => {
                if (row.Name) {
                  stats[row.Name] = {
                    gihwr: parseFloat(row['GP WR'] || '0'),
                    ohwr: parseFloat(row['OH WR'] || '0'),
                    gdwr: parseFloat(row['GD WR'] || '0'),
                    color: row.Color || '',
                  };
                }
              });

              setCardStats(stats);
              console.log(`Loaded stats for ${Object.keys(stats).length} cards in set ${selectedSet}`);
            },
            error: (error) => {
              console.error('Error parsing CSV:', error);
            }
          });
        } catch (error) {
          console.error(`Failed to load card stats for set ${selectedSet}:`, error);
          setCardStats({});
        }
      };

      loadCardStats();
    }
  }, [selectedSet]);


  // New: Deck Building Helper - Calculate simple deck stats
  const getDeckStats = () => {
    const landCount = builtDeck.filter((card) => card.type_line.includes('Land')).length;
    const avgCmc = builtDeck.reduce((sum, card) => sum + (card.cmc || 0), 0) / (builtDeck.length || 1);
    return { landCount, avgCmc: avgCmc.toFixed(1), totalCards: builtDeck.length };
  };

  // New: Deck Building Handlers
  const addToDeck = (card) => {
    if (!builtDeck.some((c) => c.id === card.id)) {
      setBuiltDeck([...builtDeck, card]);
    }
  };
  const removeFromDeck = (card) => {
    setBuiltDeck(builtDeck.filter((c) => c.id !== card.id));
  };
  const sortDeck = (criteria) => {
    const sorted = [...builtDeck].sort((a, b) => {
      if (criteria === 'cmc') return (a.cmc || 0) - (b.cmc || 0);
      if (criteria === 'color') return (a.colors?.[0] || '').localeCompare(b.colors?.[0] || '');
      return 0;
    });
    setBuiltDeck(sorted);
  };
  const finalizeDeck = () => {
    console.log('Deck Finalized:', builtDeck); // Could add export to file or display
    alert('Deck finalized! Check console for details.');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold text-center mb-6">MTG Draft Simulator</h1>
      <button
        onClick={() => {console.log('globalStats:', globalStats);setShowGlobalStats((prev) => !prev)}}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4 block mx-auto"
      >
        {showGlobalStats ? 'Hide' : 'Show'} Global Stats
      </button>
      
      {loadingSets ? (
        <p className="text-center text-lg">Loading sets...</p>
      ) : (
        <div className="flex justify-center mb-6">
          <select
            value={selectedSet}
            onChange={(e) => setSelectedSet(e.target.value)}
            className="bg-gray-800 text-white p-2 rounded"
          >
            {sets.map((set) => (
              <option key={set.code} value={set.code}>
                {set.name} ({set.code.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      )}
      
      {loadingCards ? (
        <p className="text-center text-lg">Loading cards for selected set...</p>
      ) : !draftComplete ? (
        <>
          <h2 className="text-2xl text-center mb-4">Round {currentRound}/3</h2>
          {players[0]?.packs?.[currentRound - 1]?.length > 0 ? (
            <>
              <div className="flex space-x-2 justify-center mb-4">
                <button
                  onClick={() => {
                    const humanPlayer = players[0];
                    const currentPack = humanPlayer.packs[currentRound - 1];

                    if (currentPack.length > 0) {
                      const suggested = aiPickCard(currentPack, humanPlayer);

                      // Toggle off if already suggested
                      if (suggestedCardId === suggested.id) {
                        setSuggestedCardId(null);
                      } else {
                        setSuggestedCardId(suggested.id);
                      }
                    }
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                >
                  Suggest Pick
                </button>
                <button
                  onClick={() => {
                    if (draftHistory.length > 0) {
                      const lastState = draftHistory[draftHistory.length - 1];
                      setPlayers(lastState.players);
                      setCurrentPackIndex(lastState.packIndex);
                      setDraftHistory((prev) => prev.slice(0, -1));
                    }
                  }}
                  disabled={draftHistory.length === 0}
                  className={`px-4 py-2 rounded ${
                    draftHistory.length === 0
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-yellow-500 hover:bg-yellow-600'
                  } text-white`}
                >
                  Undo Pick
                </button>
              </div>
              <Pack 
                cards={players[0]?.packs[currentRound - 1] || []} 
                onPick={handlePick} 
                disabled={false} 
                cardStats={cardStats}
                suggestedCardId={suggestedCardId}
                showGlobalStats={showGlobalStats}
              />
            </>
          ) : (
            <p className="text-xl text-center text-gray-400">No pack available. Please select a set or start a new draft.</p>
          )}
          <div className="mb-4 flex items-center space-x-2 justify-center">
            <select
              value={draftDeckSort}
              onChange={(e) => setDraftDeckSort(e.target.value)}
              className="bg-gray-800 text-white p-2 rounded"
            >
              <option value="cmc">Sort by CMC</option>
              <option value="color">Sort by Color</option>
            </select>
            <button
              onClick={() => sortDraftDeck(draftDeckSort)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              Sort Deck
            </button>
          </div>
          <Deck 
            draftedCards={players[0]?.draftedCards || []} 
            cardStats={cardStats}
            onRemoveFromDeck={moveToSideboard}
          />
          <Sideboard 
            sideboardCards={players[0]?.sideboard || []} 
            cardStats={cardStats}
            onMoveFromSideboard={moveFromSideboard}
          />
        </>
      ) : (
        <>
          <p className="text-xl text-center mb-6">Draft Complete! Now build your deck.</p>
          
          {/* Deck Building Section: Updated to add "Sort Deck" button */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Drafted Cards (Available Pool) - Include sideboard */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Drafted Cards ({(players[0]?.draftedCards.length + players[0]?.sideboard.length)})</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...(players[0]?.draftedCards || []), ...(players[0]?.sideboard || [])]
                  .filter((card) => !builtDeck.some((c) => c.id === card.id))
                  .map((card, index) => (
                    <Card
                      key={`${card.id}-${index}`}
                      card={card}
                      onAddToDeck={addToDeck}
                      disabled={false}
                      cardStats={cardStats}
                    />
                  ))}
              </div>
            </div>
            
            {/* Built Deck: Added "Sort Deck" button and modified select behavior */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Built Deck ({builtDeck.length} cards)</h2>
              <div className="mb-4 flex items-center space-x-2">  {/* New: Wrapped in flex for better alignment */}
                <button 
                  onClick={suggestLands} 
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Suggest Lands
                </button>
                <select 
                  value={deckSort}  // New: Bind to deckSort state for controlled component
                  onChange={(e) => setDeckSort(e.target.value)}  // Updated: Only update state, don't auto-sort
                  className="bg-gray-800 text-white p-2 rounded"
                >
                  <option value="cmc">Sort by CMC</option>
                  <option value="color">Sort by Color</option>
                </select>
                {/* New: "Sort Deck" Button - Triggers sort based on selected deckSort */}
                <button 
                  onClick={() => sortDeck(deckSort)}  // Calls sortDeck with current deckSort value
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                >
                  Sort Deck
                </button>
                <button 
                  onClick={finalizeDeck} 
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Finalize Deck
                </button>
              </div>
              <p className="mb-4">Stats: Lands: {getDeckStats().landCount}, Avg CMC: {getDeckStats().avgCmc}, Total: {getDeckStats().totalCards} (Aim for ~40)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {builtDeck.map((card, index) => (
                  <Card
                    key={`${card.id}-${index}`}
                    card={card}
                    onRemoveFromDeck={removeFromDeck}
                    disabled={false}
                    inDeck={true}
                    cardStats={cardStats}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
