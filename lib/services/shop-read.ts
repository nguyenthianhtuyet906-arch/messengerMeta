import { getConversationsCollection } from "@/lib/db/collections";
import { getOnlineShopNames } from "@/lib/services/ably-publish";
import { asNumber, firstString } from "@/lib/services/etsy-utils";

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
