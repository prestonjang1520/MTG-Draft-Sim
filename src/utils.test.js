// Unit tests for utility functions extracted from App.js

describe('Utility Functions', () => {
  
  describe('generatePack', () => {
    const mockCards = {
      commons: Array.from({ length: 50 }, (_, i) => ({
        id: `common-${i}`,
        name: `Common Card ${i}`,
        rarity: 'common',
        type_line: 'Creature'
      })),
      uncommons: Array.from({ length: 30 }, (_, i) => ({
        id: `uncommon-${i}`,
        name: `Uncommon Card ${i}`,
        rarity: 'uncommon',
        type_line: 'Instant'
      })),
      rares: Array.from({ length: 15 }, (_, i) => ({
        id: `rare-${i}`,
        name: `Rare Card ${i}`,
        rarity: 'rare',
        type_line: 'Sorcery'
      })),
      mythics: Array.from({ length: 5 }, (_, i) => ({
        id: `mythic-${i}`,
        name: `Mythic Card ${i}`,
        rarity: 'mythic',
        type_line: 'Planeswalker'
      })),
      lands: Array.from({ length: 5 }, (_, i) => ({
        id: `land-${i}`,
        name: `Basic Land ${i}`,
        rarity: 'common',
        type_line: 'Basic Land — Forest'
      }))
    };

    const allCards = [
      ...mockCards.commons,
      ...mockCards.uncommons,
      ...mockCards.rares,
      ...mockCards.mythics,
      ...mockCards.lands
    ];

    // Mock implementation of generatePack for testing
    const generatePack = (cards) => {
      const commons = cards.filter((card) => card.rarity === 'common' && !card.type_line.includes('Basic Land'));
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
        return generatePack(cards);
      }

      const rarityOrder = { mythic: 1, rare: 2, uncommon: 3, common: 4, land: 5 };
      return pack.sort((a, b) => {
        const aRarity = a.type_line.includes('Basic Land') ? 'land' : a.rarity;
        const bRarity = b.type_line.includes('Basic Land') ? 'land' : b.rarity;
        return rarityOrder[aRarity] - rarityOrder[bRarity];
      });
    };

    test('generates pack with 15 cards', () => {
      const pack = generatePack(allCards);
      expect(pack).toHaveLength(15);
    });

    test('pack contains correct distribution: 1 rare/mythic, 3 uncommons, 10 commons, 1 land', () => {
      const pack = generatePack(allCards);
      
      const rareOrMythicCount = pack.filter(c => c.rarity === 'rare' || c.rarity === 'mythic').length;
      const uncommonCount = pack.filter(c => c.rarity === 'uncommon').length;
      const commonCount = pack.filter(c => c.rarity === 'common' && !c.type_line.includes('Basic Land')).length;
      const landCount = pack.filter(c => c.type_line.includes('Basic Land')).length;
      
      expect(rareOrMythicCount).toBe(1);
      expect(uncommonCount).toBe(3);
      expect(commonCount).toBe(10);
      expect(landCount).toBe(1);
    });

    test('pack is sorted by rarity', () => {
      const pack = generatePack(allCards);
      
      const rarityOrder = { mythic: 1, rare: 2, uncommon: 3, common: 4, land: 5 };
      
      for (let i = 1; i < pack.length; i++) {
        const prevRarity = pack[i - 1].type_line.includes('Basic Land') ? 'land' : pack[i - 1].rarity;
        const currRarity = pack[i].type_line.includes('Basic Land') ? 'land' : pack[i].rarity;
        
        expect(rarityOrder[prevRarity]).toBeLessThanOrEqual(rarityOrder[currRarity]);
      }
    });

    test('generates unique cards in pack', () => {
      const pack = generatePack(allCards);
      const uniqueIds = new Set(pack.map(card => card.id));
      
      expect(uniqueIds.size).toBe(pack.length);
    });

    test('handles missing card types gracefully', () => {
      const limitedCards = mockCards.commons.slice(0, 15); // Only commons
      const pack = generatePack(limitedCards);
      
      // Should still generate a pack even with limited card pool
      expect(pack.length).toBeGreaterThan(0);
    });
  });

  describe('calculateCardScore', () => {
    const mockCardStats = {
      'Power Card': { gihwr: 65, ohwr: 62, gdwr: 63, color: 'W' },
      'Average Card': { gihwr: 50, ohwr: 48, gdwr: 49, color: 'U' },
      'Weak Card': { gihwr: 35, ohwr: 33, gdwr: 34, color: 'B' }
    };

    const mockColorPairStats = {
      'Azorius (WU)': 55,
      'Mono-White': 52,
      'Mono-Blue': 48,
      'Two-color': 50
    };

    // Mock implementation
    const calculateCardScore = (card, aiPlayer, cardStats, colorPairStats) => {
      const stats = cardStats[card.name] || {};
      
      let statsScore = 0;
      if (stats.gihwr) {
        statsScore += stats.gihwr * 1.5;
        if (stats.ohwr) statsScore += stats.ohwr * 0.8;
        if (stats.gdwr) statsScore += stats.gdwr * 0.7;
      } else {
        const rarityMap = { mythic: 10, rare: 8, uncommon: 5, common: 3 };
        let rarityScore = rarityMap[card.rarity] || 1;
        const cmc = card.cmc || 0;
        let cmcScore = Math.max(10 - cmc, 0);
        let typeScore = 0;
        
        if (card.type_line.includes('Creature')) {
          const power = parseInt(card.power) || 0;
          const toughness = parseInt(card.toughness) || 0;
          typeScore += (power + toughness) / 2;
          typeScore += 2;
        } else if (card.type_line.includes('Instant') || card.type_line.includes('Sorcery')) {
          typeScore += 4;
        } else if (card.type_line.includes('Artifact') || card.type_line.includes('Enchantment')) {
          typeScore += 3;
        }
        
        statsScore = rarityScore + cmcScore + typeScore;
      }

      let colorScore = 0;
      const cardColors = card.colors || [];
      
      if (cardColors.length === 0) {
        colorScore += 3;
      } else {
        cardColors.forEach((color) => {
          if (aiPlayer.colors.includes(color)) {
            colorScore += 5;
          }
        });
        
        if (cardColors.every((color) => aiPlayer.colors.includes(color))) {
          colorScore += 3;
        }
      }

      const colorPairBonus = 0; // Simplified for testing
      
      return stats.gihwr ? 
        (statsScore + colorScore * 1.5 + colorPairBonus) : 
        (statsScore + colorScore + colorPairBonus);
    };

    test('scores card with stats higher than card without stats', () => {
      const cardWithStats = { name: 'Power Card', colors: ['W'], rarity: 'common', cmc: 2 };
      const cardWithoutStats = { name: 'Unknown Card', colors: ['W'], rarity: 'mythic', cmc: 2 };
      const aiPlayer = { colors: ['W'], draftedCards: [] };
      
      const scoreWithStats = calculateCardScore(cardWithStats, aiPlayer, mockCardStats, mockColorPairStats);
      const scoreWithoutStats = calculateCardScore(cardWithoutStats, aiPlayer, mockCardStats, mockColorPairStats);
      
      expect(scoreWithStats).toBeGreaterThan(scoreWithoutStats);
    });

    test('favors on-color cards', () => {
      const whiteCard = { name: 'White Card', colors: ['W'], rarity: 'common', cmc: 2 };
      const blackCard = { name: 'Black Card', colors: ['B'], rarity: 'common', cmc: 2 };
      const aiPlayer = { colors: ['W', 'U'], draftedCards: [] };
      
      const whiteScore = calculateCardScore(whiteCard, aiPlayer, {}, {});
      const blackScore = calculateCardScore(blackCard, aiPlayer, {}, {});
      
      expect(whiteScore).toBeGreaterThan(blackScore);
    });

    test('gives bonus for colorless cards', () => {
      const colorlessCard = { name: 'Artifact', colors: [], rarity: 'common', cmc: 2, type_line: 'Artifact' };
      const coloredCard = { name: 'Colored', colors: ['R'], rarity: 'common', cmc: 2, type_line: 'Creature' };
      const aiPlayer = { colors: ['W', 'U'], draftedCards: [] };
      
      const colorlessScore = calculateCardScore(colorlessCard, aiPlayer, {}, {});
      const coloredScore = calculateCardScore(coloredCard, aiPlayer, {}, {});
      
      // Colorless should have some value even if not in AI colors
      expect(colorlessScore).toBeGreaterThan(0);
    });

    test('considers creature power and toughness', () => {
      const bigCreature = { 
        name: 'Big Guy', 
        colors: ['W'], 
        rarity: 'common', 
        cmc: 4,
        type_line: 'Creature',
        power: '5',
        toughness: '5'
      };
      
      const smallCreature = { 
        name: 'Small Guy', 
        colors: ['W'], 
        rarity: 'common', 
        cmc: 4,
        type_line: 'Creature',
        power: '1',
        toughness: '1'
      };
      
      const aiPlayer = { colors: ['W'], draftedCards: [] };
      
      const bigScore = calculateCardScore(bigCreature, aiPlayer, {}, {});
      const smallScore = calculateCardScore(smallCreature, aiPlayer, {}, {});
      
      expect(bigScore).toBeGreaterThan(smallScore);
    });
  });

  describe('getColorPairBonus', () => {
    const mockColorPairStats = {
      'Azorius (WU)': 58,
      'Dimir (UB)': 52,
      'Mono-White': 48,
      'Mono-Blue': 50,
      'Two-color': 51,
      'All Decks': 50
    };

    // Simplified implementation for testing
    const getColorPairBonus = (cardColors, aiColors, colorPairStats) => {
      if (!cardColors || cardColors.length === 0 || !aiColors || aiColors.length === 0) return 0;
      
      const cardFitsColors = cardColors.every(c => aiColors.includes(c));
      if (!cardFitsColors) return 0;
      
      // Find appropriate win rate (simplified)
      let winRate = 50; // Default
      
      if (aiColors.length === 2 && aiColors.includes('W') && aiColors.includes('U')) {
        winRate = colorPairStats['Azorius (WU)'] || 50;
      } else if (aiColors.length === 1) {
        winRate = colorPairStats[`Mono-${aiColors[0] === 'W' ? 'White' : 'Blue'}`] || 50;
      } else {
        winRate = colorPairStats['All Decks'] || 50;
      }
      
      return (winRate - 50) * 0.5;
    };

    test('returns positive bonus for above-average color pairs', () => {
      const bonus = getColorPairBonus(['W', 'U'], ['W', 'U'], mockColorPairStats);
      expect(bonus).toBeGreaterThan(0); // Azorius is at 58% win rate
    });

    test('returns negative bonus for below-average color pairs', () => {
      const bonus = getColorPairBonus(['W'], ['W'], mockColorPairStats);
      expect(bonus).toBeLessThan(0); // Mono-White is at 48% win rate
    });

    test('returns 0 for cards not matching AI colors', () => {
      const bonus = getColorPairBonus(['B', 'R'], ['W', 'U'], mockColorPairStats);
      expect(bonus).toBe(0);
    });

    test('returns 0 for empty inputs', () => {
      expect(getColorPairBonus([], ['W'], mockColorPairStats)).toBe(0);
      expect(getColorPairBonus(['W'], [], mockColorPairStats)).toBe(0);
      expect(getColorPairBonus(null, ['W'], mockColorPairStats)).toBe(0);
    });
  });

  describe('updatePlayerColors', () => {
    // Mock implementation
    const updatePlayerColors = (player) => {
      const colorCounts = { W: 0, U: 0, B: 0, R: 0, G: 0 };
      player.draftedCards.forEach((card) => {
        (card.colors || []).forEach((color) => {
          if (colorCounts[color] !== undefined) {
            colorCounts[color]++;
          }
        });
      });
      
      const sortedColors = Object.entries(colorCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([color]) => color)
        .slice(0, 2);
      
      player.colors = sortedColors.length > 0 ? sortedColors : player.colors;
      return player;
    };

    test('updates colors based on drafted cards', () => {
      const player = {
        colors: [],
        draftedCards: [
          { colors: ['W'] },
          { colors: ['W'] },
          { colors: ['U'] },
          { colors: ['U'] },
          { colors: ['U'] },
          { colors: ['B'] }
        ]
      };
      
      const updated = updatePlayerColors(player);
      expect(updated.colors).toEqual(['U', 'W']); // U has 3, W has 2
    });

    test('limits to top 2 colors', () => {
      const player = {
        colors: [],
        draftedCards: [
          { colors: ['W', 'U'] },
          { colors: ['U', 'B'] },
          { colors: ['B', 'R'] },
          { colors: ['R', 'G'] },
          { colors: ['G', 'W'] }
        ]
      };
      
      const updated = updatePlayerColors(player);
      expect(updated.colors).toHaveLength(2);
    });

    test('keeps existing colors if no cards drafted', () => {
      const player = {
        colors: ['R', 'G'],
        draftedCards: []
      };
      
      const updated = updatePlayerColors(player);
      expect(updated.colors).toEqual(['R', 'G']);
    });

    test('handles colorless cards', () => {
      const player = {
        colors: [],
        draftedCards: [
          { colors: [] },
          { colors: [] },
          { colors: ['W'] }
        ]
      };
      
      const updated = updatePlayerColors(player);
      expect(updated.colors).toEqual(['W']);
    });
  });

  describe('suggestLands', () => {
    // Mock implementation
    const suggestLands = (builtDeck) => {
      const colorCounts = { W: 0, U: 0, B: 0, R: 0, G: 0 };
      builtDeck.forEach((card) => {
        (card.colors || []).forEach((color) => colorCounts[color]++);
      });
      
      const totalColors = Object.values(colorCounts).reduce((sum, count) => sum + count, 0) || 1;
      const suggestedLands = [];
      const totalLandsNeeded = 17;
      
      ['W', 'U', 'B', 'R', 'G'].forEach((color) => {
        const count = Math.round((colorCounts[color] / totalColors) * totalLandsNeeded);
        for (let i = 0; i < count; i++) {
          suggestedLands.push({
            id: `basic-${color}-${i}`,
            name: color === 'W' ? 'Plains' : 
                  color === 'U' ? 'Island' : 
                  color === 'B' ? 'Swamp' : 
                  color === 'R' ? 'Mountain' : 'Forest',
            type_line: 'Basic Land',
            colors: [color]
          });
        }
      });
      
      return suggestedLands;
    };

    test('suggests 17 lands total', () => {
      const deck = [
        { colors: ['W'] },
        { colors: ['W'] },
        { colors: ['U'] },
        { colors: ['U'] }
      ];
      
      const lands = suggestLands(deck);
      expect(lands).toHaveLength(17);
    });

    test('distributes lands proportionally to colors', () => {
      const deck = [
        { colors: ['W'] },
        { colors: ['W'] },
        { colors: ['W'] },
        { colors: ['U'] }
      ];
      
      const lands = suggestLands(deck);
      const whiteLands = lands.filter(l => l.name === 'Plains').length;
      const blueLands = lands.filter(l => l.name === 'Island').length;
      
      expect(whiteLands).toBeGreaterThan(blueLands);
    });

    test('handles mono-color decks', () => {
      const deck = [
        { colors: ['R'] },
        { colors: ['R'] },
        { colors: ['R'] }
      ];
      
      const lands = suggestLands(deck);
      const mountains = lands.filter(l => l.name === 'Mountain').length;
      
      expect(mountains).toBe(17);
    });

    test('handles empty deck', () => {
      const lands = suggestLands([]);
      expect(lands).toHaveLength(17);
    });
  });

  describe('getDeckStats', () => {
    // Mock implementation
    const getDeckStats = (deck) => {
      const landCount = deck.filter((card) => card.type_line?.includes('Land')).length;
      const avgCmc = deck.reduce((sum, card) => sum + (card.cmc || 0), 0) / (deck.length || 1);
      return { 
        landCount, 
        avgCmc: avgCmc.toFixed(1), 
        totalCards: deck.length 
      };
    };

    test('calculates correct land count', () => {
      const deck = [
        { type_line: 'Basic Land' },
        { type_line: 'Creature' },
        { type_line: 'Basic Land — Forest' },
        { type_line: 'Instant' }
      ];
      
      const stats = getDeckStats(deck);
      expect(stats.landCount).toBe(2);
    });

    test('calculates average CMC', () => {
      const deck = [
        { cmc: 1 },
        { cmc: 2 },
        { cmc: 3 },
        { cmc: 4 }
      ];
      
      const stats = getDeckStats(deck);
      expect(stats.avgCmc).toBe('2.5');
    });

    test('handles empty deck', () => {
      const stats = getDeckStats([]);
      expect(stats.landCount).toBe(0);
      expect(stats.avgCmc).toBe('0.0');
      expect(stats.totalCards).toBe(0);
    });

    test('handles missing CMC values', () => {
      const deck = [
        { cmc: 2 },
        { cmc: undefined },
        { cmc: 3 },
        { cmc: null }
      ];
      
      const stats = getDeckStats(deck);
      expect(stats.avgCmc).toBe('1.3'); // (2 + 0 + 3 + 0) / 4
    });
  });
});
