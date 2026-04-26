import { Link } from "wouter";
import { NeonButton } from "../NeonButton";
import { Construction } from "lucide-react";

export default function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6">
      <Construction className="w-24 h-24 text-muted-foreground animate-pulse" />
      <h2 className="text-3xl font-orbitron text-muted-foreground">
        SYSTEM OFFLINE
      </h2>
      <p className="text-muted-foreground font-mono max-w-md">
        This game protocol has not yet been initialized. Check back later for system updates.
      </p>
      <Link href="/">
        <NeonButton variant="secondary">RETURN TO HUB</NeonButton>
      </Link>
    </div>
  );
}
