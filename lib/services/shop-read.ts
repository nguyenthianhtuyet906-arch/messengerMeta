import { getConversationsCollection, getStoresCollection } from "@/lib/db/collections";
import { getOnlineShopNames } from "@/lib/services/ably-publish";
import { asNumber, firstString } from "@/lib/services/etsy-utils";

/**
 * Lấy Etsy shop_id THẬT theo tên shop từ dora-master.stores
 * (data.context.data.current_shop.shop_id). Trả null nếu không tìm thấy.
 * Lưu ý: user_id (current_user.user_id) KHÁC shop_id — API Etsy cần shop_id.
 */
export async function resolveShopIdByName(shopName: string): Promise<number | null> {
  const name = shopName.trim();
  if (!name) return null;
  try {
    const coll = await getStoresCollection();
    const doc = await coll.findOne({
      type: "Etsy",
      $or: [{ name }, { "data.context.data.current_shop.shop_name": name }],
    } as Parameters<typeof coll.findOne>[0]);
    const id = doc?.data?.context?.data?.current_shop?.shop_id;
    return typeof id === "number" && id > 0 ? id : null;
  } catch (e) {
    console.warn("[resolveShopIdByName] failed:", (e as Error)?.message);
    return null;
  }
}

export interface ShopItem {
  userId: number;
  shopName: string;
  avatar: string;
  online: boolean;
}

/**
 * Danh sách shop (distinct theo user_data.user_id, 3 tháng gần nhất — mirror dora GetShops)
 * kèm trạng thái online từ Ably presence "all-shops".
 */
export async function getShops(): Promise<ShopItem[]> {
  const coll = await getConversationsCollection();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const rows = await coll
    .aggregate([
      { $match: { created_at: { $gte: threeMonthsAgo } } },
      { $group: { _id: "$user_data.user_id", user_data: { $first: "$user_data" } } },
      { $sort: { "user_data.shop_name": 1 } },
    ])
    .toArray();

  let online = new Set<string>();
  try {
    online = await getOnlineShopNames();
  } catch {
    // Ably không khả dụng → tất cả hiển thị offline, không ẩn shop nào.
  }

  const shops: ShopItem[] = [];
  for (const r of rows) {
    const ud = r.user_data as Record<string, unknown> | undefined;
    if (!ud) continue;
    const userId = asNumber(ud["user_id"]);
    if (!userId) continue;
    const shopName = firstString(ud, ["shop_name"]);
    shops.push({
      userId,
      shopName,
      avatar: firstString(ud, ["shop_avatar_url", "avatar_url"]),
      online: online.has(shopName),
    });
  }

  // Online lên đầu, offline xuống dưới.
  shops.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    return a.shopName.localeCompare(b.shopName);
  });

  return shops;
}
