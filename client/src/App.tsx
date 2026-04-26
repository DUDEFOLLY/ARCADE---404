import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import GamePage from "@/pages/GamePage";

import { LiveChat } from "@/components/LiveChat";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/play/:slug" component={GamePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <div className="flex-1 flex flex-col min-w-0">
            <Router />
          </div>
          <LiveChat />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
