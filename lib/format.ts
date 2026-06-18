/** Viết tắt tên (tối đa 2 ký tự) cho avatar fallback. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

let _decoderEl: HTMLTextAreaElement | null = null;

/** Decode HTML message của Etsy: <br> → xuống dòng, bỏ tag, giải mã entity (&#39; …). */
export function etsyText(raw: string): string {
  if (!raw) return "";
  let s = raw.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
  if (typeof document !== "undefined") {
    _decoderEl = _decoderEl ?? document.createElement("textarea");
    _decoderEl.innerHTML = s;
    s = _decoderEl.value;
  }
  return s;
}

/** Thời gian tương đối (vừa xong / 5 phút trước / 3 giờ trước …) từ unix seconds. */
export function timeAgo(unixSeconds: number): string {
  if (!unixSeconds) return "";
  const diffMs = Date.now() - unixSeconds * 1000;
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(unixSeconds * 1000).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

/** Format giờ/ngày từ unix seconds. */
export function formatTime(unixSeconds: number): string {
  if (!unixSeconds) return "";
  const d = new Date(unixSeconds * 1000);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}
