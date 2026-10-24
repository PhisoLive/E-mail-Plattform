/** Onboarding steps after the workspace exists (concept chapter 13, `/willkommen`). */
export const onboardingFlow = [
  { key: "mailbox", slug: "postfach" },
  { key: "senderProfile", slug: "absender" },
  { key: "agent", slug: "agent" },
  { key: "campaign", slug: "auftrag" },
] as const;

export type OnboardingFlowStep = (typeof onboardingFlow)[number];

export function stepBySlug(slug: string | undefined): OnboardingFlowStep | undefined {
  return onboardingFlow.find((step) => step.slug === slug);
}

export function nextStepHref(slug: string): string {
  const index = onboardingFlow.findIndex((step) => step.slug === slug);
  const next = onboardingFlow[index + 1];
  return next ? `/willkommen?schritt=${next.slug}` : "/start";
}
