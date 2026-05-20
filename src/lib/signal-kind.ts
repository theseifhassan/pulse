export type SignalKind = "article" | "post" | "tweet" | "video";

const TWEET_HOSTS = ["x.com", "twitter.com", "t.co"];
const VIDEO_HOSTS = [
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "tiktok.com",
  "loom.com",
];
const POST_HOSTS = [
  "substack.com",
  "medium.com",
  "stratechery.com",
  "ghost.io",
  "buttondown.email",
  "hey.com",
];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function endsWithAny(host: string, suffixes: readonly string[]): boolean {
  return suffixes.some((s) => host === s || host.endsWith(`.${s}`));
}

export function inferKind(sourceUrl: string): SignalKind {
  const host = hostOf(sourceUrl);
  if (!host) return "article";
  if (endsWithAny(host, TWEET_HOSTS)) return "tweet";
  if (endsWithAny(host, VIDEO_HOSTS)) return "video";
  if (endsWithAny(host, POST_HOSTS)) return "post";
  return "article";
}

export const KIND_LABEL: Record<SignalKind, string> = {
  article: "ARTICLE",
  post: "POST",
  tweet: "TWEET",
  video: "VIDEO",
};

const WORDS_PER_MIN = 220;

// Estimate read time from summary word count. Tweets/short summaries get a SEC label.
export function inferReadLabel(summary: string, kind: SignalKind): string {
  const words = summary.trim().split(/\s+/).filter(Boolean).length;
  if (kind === "tweet" || words < 80) return "30 SEC";
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MIN));
  if (minutes < 60) return `${minutes} MIN`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}H` : `${h}H ${m} MIN`;
}
