import type { ClientBrief, Fact, WorkspaceMeeting, Readiness, PartnerEnrichments } from "@/lib/workspace-data";
export type { ClientBrief, Fact, WorkspaceMeeting, Readiness };
export type Enrichments = PartnerEnrichments;
export type WorkspaceRecord = Enrichments & { id: string; title: string; account: string; date: string; summary: string; stage: string; nextAction: string; pointPerson?: string; pilotUsers?: string; portalNeeded?: boolean; portalEvidence?: string; demoContacts: { name: string; email: string; evidence?: string }[] };
type InputRecord = Enrichments & { id: string; date: string; stage: string; partner?: Enrichments & { title: string; account: string; summary: string; nextAction: string; pointPerson?: string; pilotUsers?: string; portalNeeded?: boolean; portalStatus?: string; demoContacts: { name: string; email: string; evidence?: string }[] }; title: string; account: string; summary: string; nextAction: string; pointPerson?: string; pilotUsers?: string; portalNeeded?: boolean; portalEvidence?: string; demoContacts?: { name: string; email: string; evidence?: string }[] };
export function curatedRecords(records: InputRecord[], ownerView: boolean): WorkspaceRecord[] {
  return records.map(r => {
    const content = ownerView ? r.partner : r;
    return { id: r.id, date: r.date, stage: r.stage, title: content?.title || "iBoss account update", account: content?.account || "", summary: content?.summary || "", nextAction: content?.nextAction || "", pointPerson: content?.pointPerson || "", pilotUsers: content?.pilotUsers || "", portalNeeded: content?.portalNeeded === true, portalEvidence: ownerView ? r.partner?.portalStatus || "" : r.portalEvidence || "", demoContacts: content?.demoContacts || [], clientBrief: content?.clientBrief, meetings: content?.meetings, readiness: content?.readiness };
  });
}
export function knownClient(_value?: string): { id: string; name: string } | undefined { return undefined; }
export function isInternalAccount(name: string) { return !name.trim() || /\b(partnership|internal|provisioning)\b/i.test(name) || /^(iboss|ait|intelligent it|get ?it ?sense)$/i.test(name.trim()); }
export function clientIdentity(record: WorkspaceRecord) { const brief = record.clientBrief; const known = knownClient(brief?.clientId || brief?.name || record.account); const name = brief?.name || known?.name || record.account.trim(); if (isInternalAccount(name)) return null; return { id: known?.id || brief?.clientId || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name }; }
export const dateValue = (value: string) => Date.parse(value) || 0;
export function eventOccursOnDay(event: WorkspaceMeeting, day: string) { const start = dayKey(event.start); if (event.allDay) return start <= day && (event.end ? day < event.end : day === start); const last = event.end ? dayKey(new Date(Date.parse(event.end) - 1).toISOString()) : start; return day >= start && day <= last; }
export function dateText(value?: string) { if (!value) return "Date not recorded"; const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value + "T12:00:00Z" : value); return Number.isNaN(date.valueOf()) ? "Date not recorded" : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }).format(date); }
export function dayKey(value: string) { if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value; const date = new Date(value); if (Number.isNaN(date.valueOf())) return ""; const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/New_York" }).formatToParts(date); return `${parts.find(p => p.type === "year")?.value}-${parts.find(p => p.type === "month")?.value}-${parts.find(p => p.type === "day")?.value}`; }
export function dedupeMeetings(records: WorkspaceRecord[]) { const byId = new Map<string, WorkspaceMeeting>(); for (const event of records.flatMap(r => r.meetings || [])) { if (!event.id || !dayKey(event.start)) continue; const prev = byId.get(event.id); const currentTime = new Date(event.updatedAt).valueOf() || 0; const previousTime = prev ? new Date(prev.updatedAt).valueOf() || 0 : -1; if (!prev || currentTime > previousTime || (currentTime === previousTime && event.status === "cancelled")) byId.set(event.id, event); } return [...byId.values()].sort((a,b) => dayKey(a.start).localeCompare(dayKey(b.start)) || Number(b.allDay) - Number(a.allDay) || Date.parse(a.start) - Date.parse(b.start)); }

const clientKey = (value: string) => knownClient(value)?.id || value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/** Resolve only curated, same-client context; record activity dates never create events. */
export function getMeetingBrief(event: WorkspaceMeeting, records: WorkspaceRecord[]) {
  const key = clientKey(event.clientId);
  const matching = records.filter(record => key && clientKey(record.clientBrief?.clientId || record.account) === key);
  const parents = matching.filter(record => (record.meetings || []).some(meeting => meeting.id === event.id && clientKey(meeting.clientId) === key)).sort((a,b) => {
    const latest = (record: WorkspaceRecord) => Math.max(...(record.meetings || []).filter(meeting => meeting.id === event.id && clientKey(meeting.clientId) === key).map(meeting => dateValue(meeting.updatedAt)));
    return latest(b) - latest(a) || dateValue(b.date) - dateValue(a.date);
  });
  const parentRecord = parents[0] || null;
  const latestMatching = [...matching].sort((a,b) => dateValue(b.date) - dateValue(a.date));
  const contextRecord = parentRecord || latestMatching[0] || null;
  const briefRecord = parentRecord?.clientBrief !== undefined ? parentRecord : latestMatching.find(record => record.clientBrief !== undefined);
  const clientBrief = briefRecord?.clientBrief && clientKey(briefRecord.clientBrief.clientId) === key ? briefRecord.clientBrief : null;
  const readinessRecord = parentRecord?.readiness !== undefined ? parentRecord : [...matching].filter(record => record.readiness !== undefined).sort((a,b) => dateValue(b.readiness?.asOf || b.date) - dateValue(a.readiness?.asOf || a.date))[0];
  const readiness = readinessRecord?.readiness || null;
  const isCancelled = event.status === "cancelled";
  const isRelatedFollowUps = isInternalAccount(event.clientId.replaceAll("-", " ")) || (!!readinessRecord && readinessRecord.id !== parentRecord?.id);
  return { parentRecord, clientBrief, readiness, isCancelled, isRelatedFollowUps, contextRecord, clientContext: contextRecord?.summary || "", contextDate: contextRecord?.date || "", stage: readinessRecord?.stage || contextRecord?.stage || "", pendingItems: isCancelled ? [] : (readiness?.pendingItems || []).filter(item => item.status !== "done"), completedItems: isCancelled ? [] : (readiness?.pendingItems || []).filter(item => item.status === "done"), nextMilestone: isCancelled ? "" : readiness?.nextMilestone || "", talkingPoints: isCancelled ? [] : clientBrief?.presentation || [] };
}
