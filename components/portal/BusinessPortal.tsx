import AvatarBadge from "@/components/AvatarBadge";
import Eyebrow from "@/components/Eyebrow";
import EngagementsTable from "@/components/portal/EngagementsTable";
import StartHerePanel from "@/components/portal/StartHerePanel";
import { formatMoney } from "@/lib/format";
import type { ClientJobView, PortalContact } from "@/lib/queries/portal";

/**
 * The business composition (PRD 7.8): figures, the contact, the engagements
 * table, the thread, and — until dismissed — the start-here panel, which sits
 * last so it lands directly above the guide (PRD 7.13). Gross only; the firm's
 * margin never renders here.
 */
export default function BusinessPortal({
  accountName,
  jobs,
  contact,
  thread,
  showStartHere,
}: {
  accountName: string;
  jobs: ClientJobView[];
  contact: PortalContact | null;
  thread: React.ReactNode;
  showStartHere: boolean;
}) {
  const completed = jobs.filter((job) => job.isCompleted);
  const inFlight = jobs.filter((job) => !job.isCompleted);
  const invested = completed.reduce((sum, job) => sum + Number(job.grossValue), 0);

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-3 gap-6 rounded-m border border-line bg-surface p-6">
        <div>
          <Eyebrow as="h2">Engagements completed</Eyebrow>
          <p className="figure mt-2 text-lg text-primary">{completed.length}</p>
        </div>
        <div>
          <Eyebrow as="h2">In flight</Eyebrow>
          <p className="figure mt-2 text-lg text-primary">{inFlight.length}</p>
        </div>
        <div>
          <Eyebrow as="h2">Total invested</Eyebrow>
          <p className="figure mt-2 text-lg text-primary">{formatMoney(invested)}</p>
        </div>
      </section>

      {contact ? (
        <section className="rounded-m border border-line bg-surface p-6">
          <Eyebrow as="h2">Your contact</Eyebrow>
          <div className="mt-3 flex items-center gap-3">
            <AvatarBadge id={contact.email} name={contact.name} size={36} />
            <div className="min-w-0">
              <p className="font-medium text-primary">{contact.name}</p>
              {contact.title ? <p className="text-sm text-secondary">{contact.title}</p> : null}
            </div>
            <a
              href={`mailto:${contact.email}`}
              className="figure ml-auto shrink-0 text-sm text-accent underline-offset-2 hover:underline"
            >
              {contact.email}
            </a>
          </div>
        </section>
      ) : null}

      <EngagementsTable jobs={jobs} />

      {thread}

      {showStartHere ? (
        <StartHerePanel accountName={accountName} contactName={contact?.name ?? "Mara Voss"} />
      ) : null}
    </div>
  );
}
