/**
 * Giai đoạn 1 — Knowledge base chính sách shop (TĨNH).
 *
 * Team điền nội dung THẬT vào SHOP_POLICIES bên dưới. Prompt chỉ chèn khối
 * <policy> khi có nội dung → khi CHƯA điền thì không ảnh hưởng gì tới AI.
 *
 * Giai đoạn 2 sẽ nâng cấp thành truy xuất ngữ nghĩa (embeddings + Atlas Vector
 * Search) để chỉ lấy đúng đoạn chính sách liên quan tới từng tình huống.
 */

interface PolicySnippet {
  /** Từ khóa chủ đề (để lọc theo tình huống ở GĐ2). GĐ1 chèn tất cả. */
  topics: string[];
  /** Nội dung chính sách — 1–2 câu ngắn, viết như hướng dẫn cho nhân viên. */
  text: string;
}

/**
 * ⚠️ ĐIỀN NỘI DUNG THẬT CỦA SHOP VÀO ĐÂY.
 * Để trống thì tính năng vẫn chạy bình thường (không chèn <policy>).
 *
 * Ví dụ mẫu (bỏ comment và sửa lại theo chính sách thật):
 *
 *   { topics: ["shipping", "delivery", "lost", "late"],
 *     text: "US orders ship in 3–5 business days via USPS; delivery 5–10 days after that." },
 *   { topics: ["refund", "return", "wrong", "broken", "damaged"],
 *     text: "Free replacement or full refund for wrong/damaged items reported within 30 days." },
 *   { topics: ["design", "proof", "personalization"],
 *     text: "We send a design proof for approval before printing personalized items." },
 */
const SHOP_POLICIES: PolicySnippet[] = [];

/**
 * Dựng khối <policy> cho prompt. GĐ1: chèn toàn bộ chính sách đã cấu hình
 * (số lượng ít, token nhỏ). Trả "" nếu chưa cấu hình.
 */
export function formatKnowledgeBaseForPrompt(): string {
  if (SHOP_POLICIES.length === 0) return "";
  const lines = ["<policy>"];
  for (const p of SHOP_POLICIES) lines.push(`- ${p.text}`);
  lines.push("</policy>");
  return lines.join("\n");
}
