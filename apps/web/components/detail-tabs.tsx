import { Badge, EmptyState, PageHeader, Tabs, TabsContent, TabsList, TabsTrigger } from "@ep/ui";
import { CircleDashed } from "lucide-react";
import type { ReactNode } from "react";
import { ActionLinks, type PageAction } from "./placeholder-page";

export interface DetailTab {
  value: string;
  label: string;
  title: string;
  text: string;
}

/** Detail page with tabs whose contents come in later phases (concept chapter 13). */
export function DetailTabs({
  title,
  eyebrow,
  status,
  description,
  actions,
  tabs,
  label,
  soon,
}: {
  title: string;
  eyebrow: string;
  status?: ReactNode;
  description: string;
  actions: PageAction[];
  tabs: DetailTab[];
  label: string;
  soon: string;
}) {
  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow={eyebrow}
        title={
          <span className="flex flex-wrap items-center gap-2.5">
            <span className="min-w-0 break-words">{title}</span>
            {status ? <Badge tone="neutral">{status}</Badge> : null}
          </span>
        }
        description={description}
        actions={<ActionLinks actions={actions} />}
      />
      <Tabs defaultValue={tabs[0]?.value}>
        <TabsList aria-label={label}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <EmptyState
              icon={<CircleDashed aria-hidden="true" />}
              title={tab.title}
              description={tab.text}
              action={<Badge tone="info">{soon}</Badge>}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
