# Thiết kế lại tính năng "Gợi ý tin nhắn AI" (Grounded Reply)

> Tài liệu thiết kế nội bộ — DORA / dora-1
> Trạng thái: Đề xuất (chờ duyệt)
> Phạm vi: Frontend `dora-1` + Backend `Dora-backend`

---

## 1. Tóm tắt (Executive Summary)

Tính năng gợi ý tin nhắn AI hiện tại **không dùng được trong thực tế**: gợi ý chung chung, thường đi hỏi lại chính những thông tin (mã đơn, tracking) mà nhân viên đã có sẵn trước mặt. Nguyên nhân **không phải do model yếu**, mà do **kiến trúc**: AI đang "sinh mù" — chỉ nhìn 12 tin nhắn cuối, không được cấp dữ liệu đơn hàng, không có knowledge base, không có ví dụ trả lời thật của nhân viên, và bị prompt **cấm** nói ra thông tin cụ thể.

**Giải pháp:** chuyển từ *zero-shot sinh mù* sang **Grounded Reply** — trả lời có căn cứ, dựa trên:
1. **Dữ liệu đơn hàng thật** (tracking, ngày ship, sản phẩm, chính sách) — *tác động lớn nhất*.
2. **Ví dụ trả lời thật** của nhân viên trong các case tương tự (few-shot động qua embedding).
3. **Vòng lặp học**: mỗi tin nhân viên gửi đi làm giàu kho ví dụ → hệ thống tự tốt lên.

**Triển khai 3 giai đoạn**, ưu tiên tác động/công sức:

| Giai đoạn | Nội dung | Tác động | Công sức |
|---|---|---|---|
| **1** | Grounding bằng dữ liệu đơn hàng + KB chính sách + sửa bug prompt | ★★★★★ | Thấp–Trung |
| **2** | Few-shot động + KB ngữ nghĩa (embeddings + Vector Search) | ★★★★ | Trung |
| **3** | Vòng lặp học + đo lường chất lượng | ★★★ | Trung |

---

## 2. Chẩn đoán hiện trạng

### 2.1 Luồng hiện tại

```
ConversationView → GET /api/conversations/[id]/ai
   → createAIResponse()            (lib/services/ai/conversation-ai.ts)
       → lấy 40 tin, dùng 12 tin cuối
       → prepareDifyPrompt()       (lib/services/ai/chatgpt.ts)
       → callGeminiAPI()  gemini-3.5-flash, thinking OFF
       → processAIResponse()
       → lưu suggested_messages vào conversation, auto-tag
```

Provider: **Gemini 3.5 Flash** (chính) → ChatGPT (gpt-5) → Dify (fallback).

### 2.2 Vì sao "không dùng được" — nguyên nhân gốc

| # | Vấn đề | Vị trí | Hậu quả |
|---|---|---|---|
| 1 | **Không có dữ liệu đơn hàng** trong prompt — chỉ có 12 tin nhắn | `chatgpt.ts` `prepareDifyPrompt()` | Khách hỏi "đơn tôi đâu?" → AI không biết tracking/ngày ship → trả lời chung chung |
| 2 | **Prompt CẤM nói thông tin cụ thể** (khối *DON'T INVENT FACTS*) | `chatgpt.ts:191-212` | AI chỉ được đi hỏi *"cho mình xin mã đơn"* — thứ nhân viên **đã có** → vô dụng |
| 3 | **Không có knowledge base** chính sách (ship, đổi trả, xử lý lỗi in) | — | AI không nắm chính sách thật → né tránh hoặc bịa |
| 4 | **Không có ví dụ trả lời thật** của nhân viên (few-shot) | — | Văn phong "chay", generic — đúng cái prompt cố tránh |
| 5 | **Không học từ tin đã gửi** | — | Đứng yên, không cải thiện theo thời gian |
| 6 | **Bug: prompt yêu cầu 3 đáp án nhưng schema khoá cứng 2** → ✅ đã sửa, chốt **2** đồng bộ | prompt vs `responseSchema` (`chatgpt.ts`) | Output nghịch hướng dẫn, model bối rối |
| 7 | Model rẻ + tắt thinking cho mọi case → ✅ đã **bật thinking nhỏ** (512) | `chatgpt.ts` `thinkingConfig` | Case khó (khiếu nại/refund) bị xử lý hời hợt |

> **Điểm mấu chốt:** #1 + #2 kết hợp tạo ra nghịch lý — AI *bị buộc* trả lời mơ hồ vì không có dữ liệu và bị cấm nói cụ thể. Đây là lý do chính khiến gợi ý không gửi được.

---

## 3. Mô hình tham khảo (state-of-the-art 2025–2026)

Các hệ thống gợi ý tin nhắn hiệu quả (Intercom Fin, Sprinklr Smart Responses, các nghiên cứu học thuật) **không dùng zero-shot**. Chúng dựa trên 3 trụ cột:

1. **RAG (Retrieval-Augmented Generation):** nhúng embedding hội thoại/ticket cũ + knowledge base, truy xuất case liên quan rồi đưa vào prompt làm bằng chứng → trả lời chính xác, đúng nghiệp vụ. *(AWS RAG; StackAI RAG prompt engineering)*
2. **Few-shot động:** chọn 3–5 ví dụ *gần nhất về ngữ nghĩa* qua embedding + kNN, không phải ví dụ cố định; thứ tự và chất lượng ví dụ ảnh hưởng rõ đến kết quả. *(RAG4Tickets, arXiv 2510.08667)*
3. **Two-step (phân loại → sinh)** + nút regenerate + cho sửa trước khi gửi. Nghiên cứu LSR ghi nhận **+40% năng suất**. *(LLM-based Smart Reply, arXiv 2306.11980)*

**Nguồn:**
- https://aws.amazon.com/what-is/retrieval-augmented-generation/
- https://www.stackai.com/blog/prompt-engineering-for-rag-pipelines-the-complete-guide-to-prompt-engineering-for-retrieval-augmented-generation
- https://arxiv.org/pdf/2510.08667 (RAG4Tickets)
- https://arxiv.org/html/2306.11980v4 (LLM-based Smart Reply)
- https://www.intercom.com/help/en/articles/7120684-fin-ai-agent-explained

---

## 4. Kiến trúc mới đề xuất — "Grounded Reply"

```
Tin khách đến
    │
    ├─▶ [1] PHÂN LOẠI Ý ĐỊNH  (hỏi đơn / lỗi in / đổi trả / refund / gửi ảnh design…)
    │
    ├─▶ [2] TRUY XUẤT BẰNG CHỨNG (song song):
    │        • ĐƠN HÀNG thật của khách   ← qua buyer_id  (Giai đoạn 1)
    │        • KNOWLEDGE BASE chính sách  ← theo ý định  (Giai đoạn 1→2)
    │        • VÍ DỤ trả lời thật của NV   ← embedding kNN (Giai đoạn 2)
    │
    ├─▶ [3] SINH câu trả lời CÓ CĂN CỨ (Gemini/Claude)
    │        → dùng đúng tracking, đúng chính sách, đúng văn phong shop
    │
    └─▶ [4] Nhân viên sửa & GỬI → LƯU tin cuối theo ý định
             → làm giàu kho ví dụ few-shot → lần sau tốt hơn  (Giai đoạn 3)
```

Khác biệt cốt lõi so với hiện tại nằm ở **[2]** (bơm sự thật) và **[4]** (vòng lặp học).

---

## 5. Giai đoạn 1 — Grounding bằng dữ liệu đơn hàng (ưu tiên cao nhất)

Mục tiêu: AI **biết** và **được phép nói** thông tin đơn hàng thật. Chỉ riêng bước này giải quyết phần lớn câu "đơn tôi đâu / khi nào tới / sao chưa ship".

> **✅ Trạng thái: ĐÃ TRIỂN KHAI.**
> - `(a)(b)` Lấy đơn theo `buyer_id` + chèn khối `<orders>` vào prompt → `lib/services/ai/order-context.ts`, nối trong `lib/services/ai/conversation-ai.ts`.
> - `(c)` Đảo khối "DON'T INVENT FACTS" → AI dùng dữ liệu đơn, chỉ cấm bịa cái không có.
> - `(d)` Đã chốt 2 đáp án + bật thinking nhỏ (xem mục 2.2).
> - `(e)` KB chính sách: scaffold `lib/services/ai/knowledge-base.ts` — **team cần điền chính sách thật** vào `SHOP_POLICIES` (để trống thì không ảnh hưởng gì).

### 5.1 Dữ liệu sẵn có (đã xác minh trong code)

- **Khóa liên kết:** `conversations.etsy.other_user.user_id` ⇄ `etsy_orders.data.buyer_id` (fallback: `buyer.username`). Đã có tiền lệ ở `lib/services/order-conversation.ts` (chiều order→conversation).
- **Nguồn đơn:** MongoDB `dora-master.etsy_orders` (`lib/db/collections.ts` → `getEtsyOrdersCollection()`).
- **Tracking:** collection `order_tracking` (`lib/services/orders-tracking.ts` → `getOrderTrackingMap()`).
- **Ảnh personalization khách gửi:** `personalization_files` theo `receipt_id = order_id`.
- **DTO sẵn có để tái dùng:** `OrderListItem`, `OrderTransaction`, `OrderTracking`, `OrderShipping` (`lib/types/etsy.ts`).

### 5.2 Việc cần làm

**(a) Hàm mới: lấy đơn theo khách (chiều conversation → orders).**
Bổ sung vào `lib/services/orders-read.ts` (hoặc file mới `lib/services/ai/order-context.ts`):

```ts
// Trả về tối đa 3–5 đơn gần nhất của buyer, kèm tracking + sản phẩm.
export async function getOrderContextForConversation(
  buyerId: number,
): Promise<OrderContext[]> {
  // etsy_orders.find({ "data.buyer_id": buyerId })
  //   .sort({ "data.order_date": -1 }).limit(5)
  // → join order_tracking (getOrderTrackingMap)
  // → map sang OrderContext (rút gọn, chỉ field cần cho reply)
}
```

`OrderContext` rút gọn (đủ để trả lời, không dư token):

```ts
interface OrderContext {
  orderId: number;
  orderDate: string;          // đã format
  status: string;             // "Shipped" | "Completed" | "New"…
  shippingStatus: string;     // "Delivered" | "In transit" | "Not shipped"
  shipDate?: string;
  dispatchBy?: string;        // hạn dispatch
  shippingMethod: string;
  items: { title: string; qty: number; variants: string; personalization?: string }[];
  trackings: { code: string; carrier: string; url: string; isDelivered: boolean }[];
}
```

**(b) Nhét order context vào prompt.**
Trong `conversation-ai.ts` `createAIResponse()`: sau khi có `customerId`, gọi `getOrderContextForConversation(customerId)` và truyền vào `prepareDifyPrompt()`. Thêm khối `<orders>` vào prompt:

```
<orders>
Order #123456 — Shipped (In transit), ship date 2026-06-25, Standard Delivery
  Items: "Custom Dad Shirt" x1 (Size: L, Color: Black) — personalization: "BEST DAD 2026"
  Tracking: USPS 9400... (not delivered) — https://…
</orders>
```

**(c) Đảo ngược khối "DON'T INVENT FACTS".**
Sửa `buildGeminiSystemInstruction` (`chatgpt.ts:191-212`): AI **được phép và nên** dùng dữ liệu trong `<orders>`; chỉ **không** bịa thông tin *không có* trong khối đó. Ví dụ mong muốn:

> ✗ Cũ: "Could you send me the order number? I want to check the tracking."
> ✓ Mới: "Your order shipped on Jun 25 via USPS and it's currently in transit — here's the tracking: 9400… It usually takes 3–5 more days to arrive."

**(d) Sửa bug schema 2-vs-3. ✅ ĐÃ ÁP DỤNG**
Quyết định: **chốt 2 đáp án** (1 ấm áp / 1 thẳng-hoặc-hỏi-thêm). Đã thống nhất số đáp án = 2 ở toàn bộ prompt, `responseSchema` (`minItems/maxItems: 2`), và mock; UI render động theo `options` nên tự khớp.

**(e) KB chính sách tối giản (bản tĩnh).**
Tạo `lib/services/ai/knowledge-base.ts` chứa các đoạn chính sách cố định của shop (thời gian ship theo khu vực, chính sách đổi/hoàn, quy trình xử lý lỗi in). Chèn đoạn liên quan theo ý định vào prompt. (Giai đoạn 2 sẽ nâng cấp thành truy xuất ngữ nghĩa.)

### 5.3 Tiêu chí hoàn thành GĐ1
- Khi khách hỏi tracking/ngày giao, ≥80% gợi ý chứa **thông tin đơn thật** và gửi được **không cần sửa**.
- Không còn gợi ý đi hỏi lại mã đơn khi đơn đã có trong hệ thống.
- Prompt/schema/mock nhất quán về số đáp án.

---

## 6. Giai đoạn 2 — Few-shot động + KB ngữ nghĩa

Mục tiêu: sửa **văn phong** (giống nhân viên thật) và **độ chính xác nghiệp vụ** (đúng chính sách).

> **✅ Trạng thái: ĐÃ TRIỂN KHAI (few-shot động).**
> - Embeddings: `lib/services/ai/embeddings.ts` — Gemini `text-embedding-004` (768 chiều), dùng chung `GEMINI_API_KEY`.
> - Kho ví dụ: collection `reply_examples` (type trong `lib/types/etsy.ts`, accessor trong `lib/db/collections.ts`, index trong `lib/db/indexes.ts`).
> - Truy xuất + inject: `lib/services/ai/reply-examples.ts` (`$vectorSearch` của Atlas, **fallback cosine in-app** nếu chưa có index) → chèn khối `<examples>` vào prompt qua `conversation-ai.ts`; system instruction thêm mục **STYLE EXAMPLES**.
> - Seed lịch sử: `POST /api/ai/reply-examples/seed` (xem 6.2).
> - `(6.3)` KB ngữ nghĩa (embedding chính sách) **để lại** — KB tĩnh ở GĐ1 đủ dùng trước; nâng cấp sau nếu chính sách phình to.
>
> **⚙️ Việc hạ tầng cần làm (để truy xuất nhanh khi scale):** tạo Atlas Vector Search index tên `reply_examples_vector` trên collection `reply_examples`:
> ```json
> {
>   "fields": [
>     { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
>     { "type": "filter", "path": "shopId" }
>   ]
> }
> ```
> Chưa tạo cũng **vẫn chạy** (tự fallback cosine in-app, đủ ở quy mô vài nghìn ví dụ/shop).

### 6.1 Kho ví dụ trả lời (few-shot bank)
- Collection mới `reply_examples`: mỗi bản ghi = `{ intent_tag, customer_snippet, staff_reply, embedding, shop_id }`.
- Nguồn khởi tạo: trích các cặp (tin khách → tin nhân viên trả lời) chất lượng cao từ lịch sử hội thoại hiện có.

### 6.2 Embeddings + Vector Search
- Sinh embedding cho tin nhắn kích hoạt của khách bằng Gemini `text-embedding-004` (768 chiều).
- Truy xuất top-k (mặc định **k=3**) ví dụ gần nhất theo cosine similarity, lọc theo `shopId`. Ưu tiên Atlas `$vectorSearch`, fallback cosine in-app.
- Chèn vào prompt làm few-shot (khối `<examples>`).

**Chạy seed backfill từ lịch sử** (để có ví dụ ngay, khỏi chờ vòng lặp học GĐ3):
```bash
# Đăng nhập rồi gọi (cookie phiên); limit = số hội thoại gần nhất quét
curl -X POST https://<host>/api/ai/reply-examples/seed \
  -H "Content-Type: application/json" -d '{"limit": 200}'
# → { scannedConversations, pairsFound, alreadyStored, inserted }
```
Idempotent (dedupKey) → chạy lại nhiều lần an toàn, chỉ chèn cặp mới.

### 6.3 KB ngữ nghĩa
- Chuyển KB chính sách (GĐ1e) sang dạng chunk + embedding, truy xuất theo ý định thay vì map cứng.

### 6.4 Tiêu chí hoàn thành GĐ2
- Văn phong gợi ý được nhân viên đánh giá "giống mình viết".
- Gợi ý trích đúng chính sách shop (thời gian ship, điều kiện đổi/hoàn).

---

## 7. Giai đoạn 3 — Vòng lặp học + đo lường

Mục tiêu: hệ thống **tự tốt lên** và **đo được** là đang tốt lên.

> **✅ Trạng thái: ĐÃ TRIỂN KHAI.**
> - Hook học: `lib/services/ai/learning.ts` `captureSentReply()` — gọi nền (fire-and-forget) từ `createOutgoingMessage` (`lib/services/message-send.ts`). Mỗi tin gửi: (1) nạp ví dụ mới `source:"sent"` vào kho few-shot, (2) ghi event so tin gửi vs gợi ý.
> - Phân loại outcome bằng Levenshtein đã chuẩn hoá: `sent_asis` (≥0.985) / `edited` (≥0.6) / `custom` / `no_suggestion`.
> - Đo lường: collection `ai_suggestion_events`; tổng hợp `lib/services/ai/metrics.ts`; API `GET /api/ai/metrics?days=30`; **dashboard `/ai-metrics`** (thẻ tỉ lệ dùng + bảng theo tag).
> - ⚠️ Caveat: acceptance đo dựa trên `suggested_messages` gần nhất lưu trên hội thoại — là proxy tốt cho xu hướng, không tuyệt đối (gợi ý có thể cũ nếu sinh từ lượt trước).

### 7.1 Vòng lặp học
- Khi nhân viên gửi tin (qua luồng gửi hiện có, vd `POST /api/orders/message` và endpoint gửi trong hội thoại): ghi lại `{ context, intent_tag, final_text, đã_sửa_từ_gợi_ý? }` vào `reply_examples` (kèm embedding).
- Ví dụ mới được ưu tiên trong truy xuất few-shot → chất lượng tăng dần theo thời gian.

### 7.2 Chỉ số đo lường (dashboard)
- **Acceptance rate:** % gợi ý được gửi **không sửa**.
- **Edit distance:** mức độ nhân viên phải sửa gợi ý.
- **Ignore rate:** % gợi ý bị bỏ qua.
- Theo dõi theo `intent_tag` để biết loại tình huống nào AI còn yếu.

### 7.3 Tiêu chí hoàn thành GĐ3
- Acceptance rate tăng theo tuần.
- Có báo cáo phân loại điểm yếu để cải thiện prompt/KB có mục tiêu.

---

## 8. Cân nhắc kỹ thuật

- **Chọn model & thinking:** giữ Gemini Flash cho case thường (rẻ/nhanh). **Đã bật thinking nhỏ** (`thinkingBudget: 512`, có thể chỉnh 256–1024) để model cân nhắc ngữ cảnh/đơn hàng trước khi trả lời. Bước tiếp: cân nhắc **định tuyến case khó** (refund, khiếu nại, `broken_item_AI`/`refund_request_AI`) sang model mạnh hơn hoặc tăng thinking budget — vì đây là lúc chất lượng quan trọng hơn chi phí. (Fallback ChatGPT/Dify đã có sẵn để A/B.)
- **Chi phí/độ trễ:** order context + few-shot làm prompt dài hơn → theo dõi token & latency; giới hạn 3–5 đơn / 3–5 ví dụ; cân nhắc cache theo hội thoại (React Query `staleTime` đã có).
- **Bảo mật (prompt injection):** giữ nguyên tắc hiện có — nội dung khách **chỉ là dữ liệu**, không phải chỉ thị. Order context và KB là nguồn tin cậy, tách bạch rõ trong prompt (thẻ `<orders>`, `<policy>`, `<examples>`).
- **Chất lượng dữ liệu:** đơn phải được sync đầy đủ (extension → `etsy_orders`); nếu thiếu tracking, AI vẫn nên nói được trạng thái "chưa ship / đang xử lý" thay vì im lặng.
- **Riêng tư:** không đưa dữ liệu nhạy cảm (email/địa chỉ đầy đủ) vào text gợi ý gửi cho khách trừ khi cần thiết.

---

## 9. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Đơn sync thiếu/trễ → AI nói sai trạng thái | Ưu tiên field `status`/`shippingStatus` đã có; fallback câu an toàn khi thiếu tracking |
| Prompt dài → tốn token/chậm | Giới hạn số đơn/ví dụ; rút gọn `OrderContext`; cache |
| Few-shot học phải tin nhân viên trả lời kém | Chỉ nạp ví dụ từ hội thoại đã giải quyết tốt; lọc theo chỉ số ở GĐ3 |
| Vector Search phát sinh hạ tầng | Dùng Atlas Vector Search ngay trên MongoDB hiện tại, không thêm service |

---

## 10. Lộ trình đề xuất

1. **GĐ1 (tuần 1–2):** order context + đảo khối facts + KB tĩnh + fix bug schema. → *Đưa tính năng từ "vô dụng" lên "dùng được".*
2. **GĐ2 (tuần 3–5):** `reply_examples` + embeddings + Atlas Vector Search + few-shot động. → *Đúng văn phong & nghiệp vụ.*
3. **GĐ3 (tuần 6+):** vòng lặp học + dashboard chỉ số. → *Tự cải thiện & đo lường.*

---

## Phụ lục — Bản đồ file liên quan

| Mục đích | Đường dẫn |
|---|---|
| Prompt & Gemini call hiện tại | `lib/services/ai/chatgpt.ts` |
| Luồng sinh gợi ý | `lib/services/ai/conversation-ai.ts` |
| Endpoint gợi ý | `app/api/conversations/[conversation_id]/ai/route.ts` |
| Đọc đơn (tái dùng) | `lib/services/orders-read.ts` |
| Tracking | `lib/services/orders-tracking.ts` |
| Liên kết order ⇄ conversation | `lib/services/order-conversation.ts` |
| Collections DB | `lib/db/collections.ts` (`etsy_orders`, `order_tracking`, `personalization_files`) |
| Types đơn hàng | `lib/types/etsy.ts` (`OrderListItem`, `OrderTransaction`, `OrderTracking`) |
| Order model (Go) | `Dora-backend/models/order.go`, `models/etsy_order.go`, `models/fulfillment.go` |
| Order service (Go) | `Dora-backend/modules/web/order/services/order_get.go` |
