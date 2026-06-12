import AvatarBadge from "@/components/AvatarBadge";
import Eyebrow from "@/components/Eyebrow";
import AccountThread from "@/components/portal/AccountThread";
import EngagementsTable from "@/components/portal/EngagementsTable";
import StartHerePanel from "@/components/portal/StartHerePanel";
import { formatMoney } from "@/lib/format";
import { DEALS, personById } from "@/lib/mock";
import type { MockAccount, MockJob, MockMessage, MockPerson } from "@/lib/mock";

const MANAGING_DIRECTOR_ID = "u-mara";

/** The owning employee from the account's won deal, else the managing
 *  director (PRD 7.8). */
function accountContact(accountId: string): MockPerson | undefined {
  const won = DEALS.find((deal) => deal.accountId === accountId && deal.stage === "WON");
  return (won && personById(won.ownerId)) ?? personById(MANAGING_DIRECTOR_ID);
}

/**
 * The business composition (PRD 7.8): figures, the contact, the engagements
 * table, the thread, and — until dismissed — the start-here panel, which sits
 * last so it lands directly above the guide (PRD 7.13).
 */
export default function BusinessPortal({
  account,
  jobs,
  messages,
}: {
  account: MockAccount;
  jobs: MockJob[];
  messages: MockMessage[];
}) {
  const completed = jobs.filter((job) => job.status === "COMPLETED");
  const inFlight = jobs.filter((job) => job.status !== "COMPLETED");
  const invested = completed.reduce((sum, job) => sum + job.grossValue, 0);
  const contact = accountContact(account.id);

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
            <AvatarBadge id={contact.id} name={contact.name} size={36} />
            <div className="min-w-0">
              <p className="font-medium text-primary">{contact.name}</p>
              <p className="text-sm text-secondary">{contact.title}</p>
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

      <AccountThread messages={messages} />

      <StartHerePanel accountName={account.name} contactName={contact?.name ?? "Mara Voss"} />
    </div>
  );
}
