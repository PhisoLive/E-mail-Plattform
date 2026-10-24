"use client";

import { Alert, Button, Card, CardBody, CardFooter } from "@ep/ui";
import { Bell, Briefcase, CalendarHeart, Headset, PenLine, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChoiceCards } from "../choice-cards";

const roles = ["allround", "acquisition", "support", "reminders", "events", "custom"] as const;
type Role = (typeof roles)[number];
const icons = {
  allround: Sparkles,
  acquisition: Briefcase,
  support: Headset,
  reminders: Bell,
  events: CalendarHeart,
  custom: PenLine,
} as const;

/** Choose the task of a new agent (concept chapter 11; default "Allrounder"). */
export function AgentTemplatePicker({ onChosen }: { onChosen?: (role: Role) => void }) {
  const t = useTranslations("newAgent");
  const [role, setRole] = useState<Role>("allround");
  const [chosen, setChosen] = useState(false);
  return (
    <Card>
      <CardBody className="flex flex-col gap-4 pt-5">
        <ChoiceCards<Role>
          name="agent-role"
          legend={t("legend")}
          value={role}
          onChange={(value) => {
            setRole(value);
            setChosen(false);
          }}
          columns="sm:grid-cols-2 lg:grid-cols-3"
          choices={roles.map((key) => {
            const Icon = icons[key];
            return {
              value: key,
              title: t(`roles.${key}.name`),
              description: t(`roles.${key}.text`),
              icon: <Icon aria-hidden="true" />,
            };
          })}
        />
        {chosen ? <Alert tone="info">{t("soon", { role: t(`roles.${role}.name`) })}</Alert> : null}
      </CardBody>
      <CardFooter>
        <Button
          onClick={() => {
            setChosen(true);
            onChosen?.(role);
          }}
        >
          {t("choose")}
        </Button>
      </CardFooter>
    </Card>
  );
}
