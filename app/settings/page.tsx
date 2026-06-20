import { SheetConfigManager } from "@/components/settings/SheetConfigManager";
import { OrderStatusManager } from "@/components/settings/OrderStatusManager";

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-1 text-2xl font-medium tracking-tight text-foreground">Cài đặt</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Kết nối Google Sheets để cập nhật trạng thái đơn ngay trên Meta.
        </p>
        <SheetConfigManager />
        <OrderStatusManager />
      </div>
    </div>
  );
}
