"use client";

import { buttonClasses } from "@ep/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AgentTemplatePicker } from "../agents/agent-template-picker";
import { SenderProfileForm } from "../settings/sender-profile-form";

export function OnboardingSender({ canEdit, next }: { canEdit: boolean; next: string }) {
  const router = useRouter();
  return <SenderProfileForm compact canEdit={canEdit} onSaved={() => router.push(next)} />;
}

export function OnboardingAgent({ next }: { next: string }) {
  const t = useTranslations("onboarding.flow");
  const [chosen, setChosen] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <AgentTemplatePicker onChosen={() => setChosen(true)} />
      {chosen ? (
        <div className="flex justify-end">
          <Link href={next} className={buttonClasses()}>
            {t("next")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
