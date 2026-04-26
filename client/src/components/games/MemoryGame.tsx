import { useState, useEffect } from "react";
import { NeonButton } from "../NeonButton";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Ghost, Rocket, Zap, Heart, Star, Skull, Crown } from "lucide-react";

interface MemoryGameProps {
  onGameOver: (score: number) => void;
}

const ICONS = [Gamepad2, Ghost, Rocket, Zap, Heart, Star, Skull, Crown];

type Card = {
  id: number;
  iconId: number;
  isFlipped: boolean;
  isMatched: boolean;
};

export default function MemoryGame({ onGameOver }: MemoryGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const initGame = () => {
    // Duplicate and shuffle
    const gameCards = [...ICONS, ...ICONS]
      .sort(() => Math.random() - 0.5)
      .map((_, index) => ({
        id: index,
        iconId: Math.floor(index < 8 ? index : index - 8), // Simplify logic: logic above is buggy for shuffling mapped icons.
        // Better:
        // create pairs of IDs 0-7, then shuffle.
      }));
      
    // Proper shuffle logic
    const pairs = [...Array(8).keys(), ...Array(8).keys()];
    const shuffled = pairs.sort(() => Math.random() - 0.5);
    
    setCards(shuffled.map((iconId, id) => ({
      id,
      iconId,
      isFlipped: false,
      isMatched: false
    })));
    
    setFlipped([]);
    setMoves(0);
    setMatches(0);
    setIsPlaying(true);
  };

  const handleCardClick = (id: number) => {
    if (!isPlaying) return;
    if (flipped.length === 2) return; 
    if (cards[id].isMatched || cards[id].isFlipped) return;

    // Flip card
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
    
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    // Check match
    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      
      if (cards[first].iconId === cards[second].iconId) {
        // Match!
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === first || c.id === second ? { ...c, isMatched: true } : c
          ));
          setFlipped([]);
          setMatches(m => {
            const newMatches = m + 1;
            if (newMatches === 8) {
              const finalScore = Math.max(100, 1000 - ((moves + 1) * 20));
              setTimeout(() => onGameOver(finalScore), 500);
              setIsPlaying(false);
            }
            return newMatches;
          });
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === first || c.id === second) ? { ...c, isFlipped: false } : c
          ));
          setFlipped([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4">
      <div className="flex justify-between w-full mb-6 text-xl font-retro text-primary">
        <span>MOVES: {moves}</span>
        <span>MATCHES: {matches}/8</span>
      </div>

      {!isPlaying && matches === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <NeonButton onClick={initGame} className="text-xl px-12 py-6">
            START MEMORY
          </NeonButton>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 w-full aspect-square md:aspect-auto">
        {cards.map((card) => {
          const Icon = ICONS[card.iconId];
          return (
            <motion.div
              key={card.id}
              className="relative aspect-square cursor-pointer"
              onClick={() => handleCardClick(card.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`w-full h-full transition-all duration-500 preserve-3d transform ${card.isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: card.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                {/* Back of card */}
                <div 
                  className="absolute inset-0 bg-card border-2 border-primary/30 rounded-lg flex items-center justify-center backface-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20" />
                </div>
                
                {/* Front of card */}
                <div 
                  className={`absolute inset-0 bg-primary/10 border-2 ${card.isMatched ? 'border-accent shadow-[0_0_15px_theme(\'colors.accent.DEFAULT\')]' : 'border-primary shadow-[0_0_15px_theme(\'colors.primary.DEFAULT\')]'} rounded-lg flex items-center justify-center backface-hidden`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <Icon className={`w-8 h-8 md:w-12 md:h-12 ${card.isMatched ? 'text-accent' : 'text-primary'}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
