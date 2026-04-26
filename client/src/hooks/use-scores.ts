import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type SubmitScoreInput } from "@shared/routes";

export function useScores(gameId?: number) {
  return useQuery({
    queryKey: [api.scores.list.path, gameId],
    queryFn: async () => {
      if (!gameId) return [];
      const url = buildUrl(api.scores.list.path, { gameId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch scores");
      return api.scores.list.responses[200].parse(await res.json());
    },
    enabled: !!gameId,
  });
}

export function useSubmitScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SubmitScoreInput) => {
      const validated = api.scores.submit.input.parse(data);
      const res = await fetch(api.scores.submit.path, {
        method: api.scores.submit.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.scores.submit.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to submit score");
      }
      return api.scores.submit.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [api.scores.list.path, variables.gameId] 
      });
    },
  });
}
