import { OpenFromRoute } from "@/components/messenger/RouteSync";

// /messages/<conversation_id> — mở/kích hoạt tab tương ứng. UI nằm ở layout.
export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversation_id: string }>;
}) {
  const { conversation_id } = await params;
  return <OpenFromRoute id={Number(conversation_id)} />;
}
