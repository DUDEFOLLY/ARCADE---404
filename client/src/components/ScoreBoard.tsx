import { useScores } from "@/hooks/use-scores";
import { Trophy, Loader2, User } from "lucide-react";

interface ScoreBoardProps {
  gameId?: number;
}

export function ScoreBoard({ gameId }: ScoreBoardProps) {
  const { data: scores, isLoading } = useScores(gameId);

  return (
    <div className="w-full md:w-80 border-l border-white/10 bg-black/40 backdrop-blur-sm p-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-6 text-accent">
        <Trophy className="w-5 h-5" />
        <h3 className="font-orbitron font-bold text-lg">LEADERBOARD</h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {scores && scores.length > 0 ? (
            scores.map((score, index) => (
              <div 
                key={score.id}
                className={`
                  flex items-center justify-between p-3 rounded border border-white/5 
                  ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5'}
                  hover:bg-white/10 transition-colors
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={`
                    font-mono font-bold text-sm w-6
                    ${index === 0 ? 'text-yellow-500' : 'text-muted-foreground'}
                  `}>
                    #{index + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm truncate max-w-[120px]">
                      {score.playerName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(score.createdAt!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className="font-retro text-primary text-sm">
                  {score.score.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground font-mono text-sm">
              NO RECORDS FOUND
            </div>
          )}
        </div>
      )}
    </div>
  );
}
