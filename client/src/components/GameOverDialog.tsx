import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { NeonButton } from "./NeonButton";
import { Input } from "@/components/ui/input";
import { useSubmitScore } from "@/hooks/use-scores";
import { useToast } from "@/hooks/use-toast";

interface GameOverDialogProps {
  isOpen: boolean;
  score: number;
  gameId: number;
  gameTitle: string;
  onClose: () => void;
  onRestart: () => void;
}

export function GameOverDialog({ isOpen, score, gameId, gameTitle, onClose, onRestart }: GameOverDialogProps) {
  const [name, setName] = useState("");
  const { mutate: submit, isPending } = useSubmitScore();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    submit(
      { gameId, playerName: name, score },
      {
        onSuccess: () => {
          setIsSubmitted(true);
          toast({
            title: "SCORE UPLOADED",
            description: "Your legacy has been recorded in the database.",
          });
        },
        onError: (err) => {
          toast({
            title: "UPLOAD FAILED",
            description: err.message,
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleRestart = () => {
    setIsSubmitted(false);
    setName("");
    onRestart();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-primary/50 text-foreground font-rajdhani">
        <DialogHeader>
          <DialogTitle className="text-3xl font-orbitron text-center text-primary text-glow">
            GAME OVER
          </DialogTitle>
          <DialogDescription className="text-center font-mono text-lg text-white">
            FINAL SCORE: <span className="text-accent font-retro text-2xl ml-2">{score}</span>
          </DialogDescription>
        </DialogHeader>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                Pilot Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="ENTER INITIALS..."
                className="bg-black/50 border-primary/30 text-center font-retro text-lg tracking-widest uppercase focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex gap-4">
              <NeonButton 
                type="button" 
                variant="secondary" 
                onClick={onRestart}
                className="flex-1"
              >
                RETRY
              </NeonButton>
              <NeonButton 
                type="submit" 
                isLoading={isPending}
                disabled={!name.trim()}
                className="flex-1"
              >
                SUBMIT
              </NeonButton>
            </div>
          </form>
        ) : (
          <div className="text-center space-y-6 py-4">
            <p className="text-accent text-xl font-bold">SCORE RECORDED!</p>
            <NeonButton onClick={handleRestart} className="w-full">
              PLAY AGAIN
            </NeonButton>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
