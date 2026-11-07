/** Partner-safe workspace facts. Source excerpts belong only in EnrichmentEvidence. */
export type Fact = { value: string; asOf: string; confidence: 'confirmed' | 'reported' | 'suggested' };
export type ClientBrief = {
  clientId: string;
  name: string;
  industry: string;
  employeeCount: Fact | null;
  userCount: Fact | null;
  pilotCount: Fact | null;
  stack: { product: string; category: string; status: 'in_use' | 'evaluating' | 'discussed'; asOf: string }[];
  needs: Fact[];
  presentation: Fact[];
  opportunities: Fact[];
  openQuestions: string[];
  history: { date: string; title: string; detail: string }[];
};
export type WorkspaceMeeting = {
  id: string;
  clientId: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  timezone: string;
  status: 'confirmed' | 'proposed' | 'cancelled';
  attendees: { name: string; email?: string; response?: string }[];
  purpose: string;
  updatedAt: string;
};
export type Readiness = {
  stageReason: string;
  pendingItems: { item: string; owner: string; status: 'waiting' | 'in_progress' | 'done' | 'unknown'; dueDate?: string }[];
  nextMilestone: string;
  asOf: string;
};
export type EnrichmentEvidence = { sourceId: string; url: string; excerpt: string; checkedAt: string };
export type PartnerEnrichments = { clientBrief?: ClientBrief | null; meetings?: WorkspaceMeeting[]; readiness?: Readiness | null };

