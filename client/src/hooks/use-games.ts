import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useGames() {
  return useQuery({
    queryKey: [api.games.list.path],
    queryFn: async () => {
      const res = await fetch(api.games.list.path);
      if (!res.ok) throw new Error("Failed to fetch games");
      return api.games.list.responses[200].parse(await res.json());
    },
  });
}

export function useGame(slug: string) {
  return useQuery({
    queryKey: [api.games.get.path, slug],
    queryFn: async () => {
      const url = buildUrl(api.games.get.path, { slug });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch game details");
      return api.games.get.responses[200].parse(await res.json());
    },
  });
}
