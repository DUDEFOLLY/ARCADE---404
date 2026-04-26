import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { NeonButton } from "./NeonButton";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { MessageSquare, Send, Users } from "lucide-react";

export function LiveChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [playerName, setPlayerName] = useState(() => localStorage.getItem("playerName") || "Guest" + Math.floor(Math.random() * 1000));
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial messages
  const { data: initialMessages } = useQuery({
    queryKey: ["/api/messages"],
  });

  useEffect(() => {
    if (Array.isArray(initialMessages)) setMessages(initialMessages);
    else if (initialMessages) setMessages([]); // Fallback to empty array if response is not an array
  }, [initialMessages]);

  useEffect(() => {
    localStorage.setItem("playerName", playerName);
  }, [playerName]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "chat") {
        setMessages((prev) => [...prev, msg.data]);
      }
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;

    const payload = {
      type: "chat",
      playerName,
      content: input,
    };

    socketRef.current.send(JSON.stringify(payload));
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-black/40 border-l border-white/10 w-80">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/60">
        <div className="flex items-center gap-2 text-primary font-orbitron">
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm tracking-wider">LIVE COMMS</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-green-500 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          ONLINE
        </div>
      </div>

      <div className="p-3 border-b border-white/5">
        <label className="text-[10px] text-muted-foreground uppercase font-mono mb-1 block">ID Tag</label>
        <Input 
          value={playerName} 
          onChange={(e) => setPlayerName(e.target.value)}
          className="h-7 bg-black/20 border-white/10 text-xs font-mono text-primary focus-visible:ring-primary/30"
        />
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">{msg.playerName}</span>
              <div className="bg-white/5 border border-white/5 p-2 rounded text-xs text-white/90 break-words shadow-sm">
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-black/60 flex gap-2">
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Transmit..."
          className="h-9 bg-black/40 border-white/10 text-xs font-mono"
        />
        <Button size="icon" type="submit" className="h-9 w-9 shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

function Button({ className, ...props }: any) {
  return (
    <button 
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 ${className}`}
      {...props}
    />
  );
}
