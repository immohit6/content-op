import React, { useEffect, useState } from "react";
import { Modal } from "./common";
import { useStore, ALL_CHANNELS } from "../store/store";
import { ChannelId } from "../types";
import { extractVideoId, fetchLiveVideoStats, fetchUploadsPage, resolveUploadsPlaylistId, UploadedVideo, YouTubeApiError } from "../services/youtubeService";
import { toast } from "../store/uiStore";
import { formatShortDate } from "../lib/utils";

export function ImportYouTubeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useStore((s) => s.settings);
  const videos = useStore((s) => s.videos);
  const addVideo = useStore((s) => s.addVideo);
  const updateVideo = useStore((s) => s.updateVideo);

  const linkedChannels = ALL_CHANNELS.filter((c) => settings.youtube.channelIds?.[c.id]?.trim());
  const [channelId, setChannelId] = useState<ChannelId | "">("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<UploadedVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [uploadsPlaylistId, setUploadsPlaylistId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  const existingVideoIds = new Set(videos.map((v) => v.videoUrl && extractVideoId(v.videoUrl)).filter(Boolean) as string[]);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    if (linkedChannels[0]) {
      loadChannel(linkedChannels[0].id);
    } else {
      setChannelId("");
      setItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadChannel(cid: ChannelId) {
    setChannelId(cid);
    setItems([]);
    setUploadsPlaylistId(null);
    setNextPageToken(undefined);
    setSelected(new Set());
    const ref = settings.youtube.channelIds?.[cid];
    if (!ref) return;
    setLoading(true);
    try {
      const { uploadsPlaylistId: plId } = await resolveUploadsPlaylistId(ref, settings.youtube.apiKey);
      setUploadsPlaylistId(plId);
      const page = await fetchUploadsPage(plId, settings.youtube.apiKey);
      setItems(page.items);
      setNextPageToken(page.nextPageToken);
    } catch (err) {
      toast(err instanceof YouTubeApiError ? err.message : "Couldn't load uploads from YouTube.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!uploadsPlaylistId || !nextPageToken) return;
    setLoading(true);
    try {
      const page = await fetchUploadsPage(uploadsPlaylistId, settings.youtube.apiKey, nextPageToken);
      setItems((prev) => [...prev, ...page.items]);
      setNextPageToken(page.nextPageToken);
    } catch (err) {
      toast(err instanceof YouTubeApiError ? err.message : "Couldn't load more uploads.", "error");
    } finally {
      setLoading(false);
    }
  }

  function toggle(videoId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) next.delete(videoId);
      else next.add(videoId);
      return next;
    });
  }

  async function importSelected() {
    if (!channelId || selected.size === 0) return;
    setImporting(true);
    let ok = 0;
    try {
      for (const item of items) {
        if (!selected.has(item.videoId)) continue;
        // eslint-disable-next-line no-await-in-loop
        const v = addVideo({
          channelId,
          title: item.title,
          stage: "analytics",
          priority: "medium",
          targetPublishDate: item.publishedAt.slice(0, 10),
          nextAction: "Review analytics and log takeaways",
          nextActionMinutes: 15,
          videoUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
          notes: "Imported from YouTube channel uploads.",
        });
        try {
          // eslint-disable-next-line no-await-in-loop
          const stats = await fetchLiveVideoStats(item.videoId, settings.youtube.apiKey);
          updateVideo(v.id, { metrics: { ...stats, syncedAt: new Date().toISOString() } });
        } catch {
          // Import still counts even if the immediate stats pull fails — the
          // video's own "Sync" button on Analytics can retry later.
        }
        ok++;
      }
      toast(`Imported ${ok} video${ok === 1 ? "" : "s"} from YouTube`, "success");
      onClose();
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Import old videos from YouTube" wide>
      {linkedChannels.length === 0 ? (
        <div className="py-6 text-center text-sm text-base-400">
          No channel is linked to a real YouTube channel yet. Go to Settings → YouTube and paste each channel's ID,
          @handle, or URL, then come back here.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {linkedChannels.map((c) => (
              <button
                key={c.id}
                onClick={() => loadChannel(c.id)}
                className={
                  channelId === c.id
                    ? "rounded-full bg-accent px-3 py-1 text-xs font-medium text-white"
                    : "rounded-full bg-base-800 px-3 py-1 text-xs font-medium text-base-300 hover:bg-base-700"
                }
              >
                {c.name}
              </button>
            ))}
          </div>

          {loading && items.length === 0 ? (
            <div className="py-10 text-center text-sm text-base-400">Loading uploads…</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-base-400">No uploads found for this channel.</div>
          ) : (
            <div className="flex max-h-[50vh] flex-col gap-1.5 overflow-y-auto">
              {items.map((item) => {
                const alreadyAdded = existingVideoIds.has(item.videoId);
                return (
                  <label
                    key={item.videoId}
                    className={
                      "flex items-center gap-3 rounded-lg border border-base-700/60 px-3 py-2 " +
                      (alreadyAdded ? "opacity-50" : "cursor-pointer hover:border-base-500")
                    }
                  >
                    <input
                      type="checkbox"
                      checked={alreadyAdded || selected.has(item.videoId)}
                      disabled={alreadyAdded}
                      onChange={() => toggle(item.videoId)}
                    />
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt="" className="h-10 w-16 shrink-0 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-16 shrink-0 rounded bg-base-800" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-base-100">{item.title}</div>
                      <div className="text-[11px] text-base-500">
                        {formatShortDate(item.publishedAt.slice(0, 10))}
                        {alreadyAdded ? " · already added" : ""}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {nextPageToken && (
            <button className="btn-secondary self-center" onClick={loadMore} disabled={loading}>
              {loading ? "Loading…" : "Load more"}
            </button>
          )}

          <div className="flex items-center justify-between border-t border-base-700/60 pt-4">
            <span className="text-xs text-base-500">{selected.size} selected</span>
            <button className="btn-primary" onClick={importSelected} disabled={selected.size === 0 || importing}>
              {importing ? "Importing…" : `Import selected (${selected.size})`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
