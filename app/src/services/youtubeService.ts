/**
 * Live video stats via the public YouTube Data API v3 (read-only, API-key
 * auth — no OAuth). This covers views/likes/comments, which are public
 * data. It does NOT cover CTR, average view duration, average % viewed, or
 * subscribers gained from a specific video — those live behind the private
 * YouTube Analytics API, which requires the channel owner to OAuth-authorize
 * this app against their own channel. That's a much bigger integration
 * (Google Cloud OAuth client, consent screen, token storage) and isn't
 * wired up here — those four fields stay manual-entry, clearly labeled as
 * such in the UI rather than silently faked.
 *
 * Cost: free. The Data API's default quota is 10,000 units/day; a single
 * video stats lookup costs 1 unit, so this is nowhere near a real limit for
 * personal use.
 */

export interface LiveVideoStats {
  views: number;
  likes: number;
  comments: number;
}

export class YouTubeApiError extends Error {}

/** Extracts an 11-character YouTube video ID from any common URL shape, or a bare ID. */
export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const shortsMatch = url.pathname.match(/\/shorts\/([\w-]{11})/);
      if (shortsMatch) return shortsMatch[1];
      const embedMatch = url.pathname.match(/\/embed\/([\w-]{11})/);
      if (embedMatch) return embedMatch[1];
    }
  } catch {
    // not a valid URL — fall through to null
  }
  return null;
}

export async function fetchLiveVideoStats(videoId: string, apiKey: string): Promise<LiveVideoStats> {
  if (!apiKey.trim()) throw new YouTubeApiError("No YouTube API key configured. Add one in Settings.");

  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch {
    throw new YouTubeApiError("Couldn't reach YouTube — check your connection and try again.");
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    if (res.status === 403) throw new YouTubeApiError("YouTube rejected the API key (invalid key, or the YouTube Data API isn't enabled for it).");
    if (res.status === 400) throw new YouTubeApiError("YouTube rejected the request — the API key looks malformed.");
    throw new YouTubeApiError(`YouTube API request failed (HTTP ${res.status}).`);
  }

  const json = await res.json();
  const item = json.items?.[0];
  if (!item) throw new YouTubeApiError("No video found with that ID — check the video URL is correct and the video is public.");

  const stats = item.statistics ?? {};
  return {
    views: Number(stats.viewCount ?? 0),
    likes: Number(stats.likeCount ?? 0),
    comments: Number(stats.commentCount ?? 0),
  };
}
