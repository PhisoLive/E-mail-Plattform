import { Badge, Button, Card, CardBody, Textarea } from "@ep/ui";
import { Bot, Mic, SendHorizontal } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NotFoundState, placeholderMetadata } from "../../../../../components/placeholder-page";
import { requireAppContext } from "../../../../../server/app-context";
import { lookup } from "../../../../../server/lookup";

export async function generateMetadata(): Promise<Metadata> {
  return placeholderMetadata("chat");
}

/** Agent chat (concept chapter 11) – layout and composer; the agent itself comes in phase 7. */
export default async function ChatPage({
  params,
}: {
  params: Promise<{ agentId: string; conversationId: string }>;
}) {
  const { agentId, conversationId } = await params;
  await requireAppContext({ path: `/chat/${agentId}/${conversationId}` });
  const t = await getTranslations("chat");
  const tActions = await getTranslations("actions");
  const tCommon = await getTranslations("common");
  const [agent, conversation] = await Promise.all([
    lookup("agent", agentId),
    lookup("conversation", conversationId),
  ]);
  if (!agent || !conversation || conversation.parentId !== agent.id)
    return <NotFoundState backHref="/agenten" backLabel={tActions("backToAgents")} />;
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-10rem)] w-full max-w-3xl flex-col gap-4">
      <header className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <Bot aria-hidden="true" className="size-[18px]" />
        </span>
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-[17px] font-semibold tracking-tight">
            {conversation.title || t("newConversation")}
          </h1>
          <p className="truncate text-[13px] text-text-muted">{agent.title}</p>
        </div>
        <Badge tone="info" className="ml-auto">
          {tCommon("soon")}
        </Badge>
      </header>
      <section
        aria-label={t("messages")}
        className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong px-6 py-12 text-center"
      >
        <p className="text-[15px] font-semibold">{t("emptyTitle")}</p>
        <p className="max-w-md text-[13px] text-text-muted">{t("emptyText")}</p>
      </section>
      <Card className="sticky bottom-4">
        <CardBody className="flex flex-col gap-2 pt-4">
          <label htmlFor="chat-input" className="sr-only">
            {t("inputLabel")}
          </label>
          <Textarea
            id="chat-input"
            rows={2}
            disabled
            placeholder={t("placeholder")}
            aria-describedby="chat-hint"
            className="resize-none border-0 px-1 shadow-none focus-visible:outline-none"
          />
          <div className="flex items-center justify-between gap-2">
            <p id="chat-hint" className="text-xs text-text-subtle">
              {t("hint")}
            </p>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" disabled icon={<Mic aria-hidden="true" />}>
                <span className="sr-only sm:not-sr-only">{t("voice")}</span>
              </Button>
              <Button size="sm" disabled icon={<SendHorizontal aria-hidden="true" />}>
                {t("send")}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
