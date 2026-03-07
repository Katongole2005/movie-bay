import type { Movie, Series, SearchResult } from "@/types/movie";
import { supabase } from "@/integrations/supabase/client";

const fallbackPoster = "https://placehold.co/300x450/1a1a2e/ffffff?text=No+Poster";

export const getImageUrl = (url?: string) => {
  if (!url) return fallbackPoster;
  return url.replace('/original/', '/w500/');
};

export const getOptimizedBackdropUrl = (url?: string): string => {
  if (!url) return fallbackPoster;
  return url.replace('/w1280/', '/w780/').replace('/original/', '/w780/');
};

export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!url) { resolve(); return; }
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload: ${url}`));
    img.src = url;
  });
};

export const preloadMovieBackdrop = (movie: { backdrop_url?: string | null; image_url?: string }): void => {
  const backdropUrl = movie.backdrop_url;
  if (backdropUrl) {
    const optimizedUrl = getOptimizedBackdropUrl(backdropUrl);
    preloadImage(optimizedUrl).catch(() => { });
  }
};

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Strip common site watermarks from scraped titles */
const cleanTitle = (title: string): string => {
  if (!title) return title;
  return title
    .replace(/mobifliks\.com\s*[-–—|:]\s*/gi, "")
    .replace(/\s*[-–—|:]\s*mobifliks\.com/gi, "")
    .replace(/mobifliks\.com/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const normalize = (items: unknown[]): Movie[] =>
  Array.isArray(items)
    ? (items as Movie[])
      .filter((m) => m && (m.type === "movie" || m.type === "series"))
      .map((m) => ({ ...m, title: cleanTitle(m.title ?? "") }))
    : [];

// ─── Data Fetching (Supabase Direct) ─────────────────────────────────────────

export async function fetchTrending(): Promise<Movie[]> {
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("type", "movie")
    .order("views", { ascending: false })
    .limit(50);
  if (error) { console.error("fetchTrending error:", error); return []; }
  return normalize(data ?? []);
}

export async function fetchRecent(
  contentType: string = "movie",
  limit: number = 20,
  page: number = 1
): Promise<Movie[]> {
  const offset = (page - 1) * limit;
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("type", contentType)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) { console.error("fetchRecent error:", error); return []; }
  return normalize(data ?? []);
}

export async function fetchMoviesSorted(
  contentType: string = "movie",
  limit: number = 20,
  page: number = 1
): Promise<Movie[]> {
  const offset = (page - 1) * limit;
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("type", contentType)
    // Order by year first, then release_date for most accurate descending release sort
    .order("year", { ascending: false, nullsFirst: false })
    .order("release_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) { console.error("fetchMoviesSorted error:", error); return []; }
  return normalize(data ?? []);
}

export async function fetchSeries(limit: number = 20, page: number = 1, language?: string): Promise<Movie[]> {
  const offset = (page - 1) * limit;
  let query = supabase
    .from("movies")
    .select("*")
    .eq("type", "series")
    .order("views", { ascending: false })
    .range(offset, offset + limit - 1);

  if (language) {
    query = query.eq("language", language);
  }

  const { data, error } = await query;
  if (error) { console.error("fetchSeries error:", error); return []; }
  return normalize(data ?? []);
}

export async function searchMovies(query: string, page: number = 1, limit: number = 20): Promise<SearchResult> {
  const offset = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from("movies")
    .select("*", { count: "exact" })
    .ilike("title", `%${query}%`)
    .range(offset, offset + limit - 1);
  if (error) { console.error("searchMovies error:", error); return { results: [], total_results: 0, page }; }
  return {
    results: normalize(data ?? []),
    total_results: count ?? 0,
    page,
  };
}

export async function searchAll(query: string, page: number = 1, limit: number = 100): Promise<Movie[]> {
  const offset = (page - 1) * limit;
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .or(`title.ilike.%${query}%,director.ilike.%${query}%,vj_name.ilike.%${query}%`)
    .range(offset, offset + limit - 1);
  if (error) { console.error("searchAll error:", error); return []; }
  return normalize(data ?? []);
}

export async function fetchMovieDetails(id: string): Promise<Movie | null> {
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("mobifliks_id", id)
    .single();
  if (error) { console.error("fetchMovieDetails error:", error); return null; }
  return data as Movie;
}

export async function fetchSeriesDetails(id: string): Promise<Series | null> {
  const { data: series, error } = await supabase
    .from("movies")
    .select("*")
    .eq("mobifliks_id", id)
    .eq("type", "series")
    .single();
  if (error || !series) { console.error("fetchSeriesDetails error:", error); return null; }

  // Fetch episodes for this series
  const { data: episodes } = await supabase
    .from("movies")
    .select("*")
    .eq("series_id", id)
    .eq("type", "episode")
    .order("episode_number", { ascending: true });

  return { ...series, episodes: episodes ?? [] } as Series;
}

export async function fetchSuggestions(query: string): Promise<Movie[]> {
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .ilike("title", `%${query}%`)
    .limit(10);
  if (error) { console.error("fetchSuggestions error:", error); return []; }
  return normalize(data ?? []);
}

export async function fetchStats(): Promise<{ popular_searches: string[] }> {
  const { data, error } = await supabase
    .from("search_history")
    .select("query")
    .order("search_time", { ascending: false })
    .limit(10);
  if (error) { return { popular_searches: [] }; }
  return { popular_searches: (data ?? []).map((r: { query: string }) => r.query) };
}

export async function fetchOriginals(limit: number = 50, page: number = 1): Promise<Movie[]> {
  // "Originals" = items without VJ translations (English Movies)
  const offset = (page - 1) * limit;
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("type", "movie")
    .is("vj_name", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) { console.error("fetchOriginals error:", error); return []; }
  return normalize(data ?? []);
}

export async function fetchByGenre(
  genre: string,
  contentType: "movie" | "series" | "all" = "movie",
  limit: number = 40
): Promise<Movie[]> {
  let query = supabase
    .from("movies")
    .select("*")
    .contains("genres", [genre])
    .limit(limit);

  if (contentType !== "all") {
    query = query.eq("type", contentType);
  }

  const { data, error } = await query;
  if (error) { console.error("fetchByGenre error:", error); return []; }
  return normalize(data ?? []);
}
