import { Prisma } from "@prisma/client";

/** Money invariants (PRD 7.1), enforced here and re-checked inside actions.
 *  All arithmetic on Prisma Decimal — never floats. Error strings follow
 *  PRD 5.7 and are safe to render verbatim. */

export type MoneyInput = Prisma.Decimal | string | number;

export function dec(value: MoneyInput): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

/** workerPool + firmMargin must equal grossValue, all three positive and
 *  two-decimal. Returns null when valid, else a renderable sentence. */
export function validateJobMoney(
  grossValue: MoneyInput,
  workerPool: MoneyInput,
  firmMargin: MoneyInput,
): string | null {
  const gross = dec(grossValue);
  const pool = dec(workerPool);
  const margin = dec(firmMargin);
  if (gross.lte(0)) return "Gross value must be greater than zero.";
  if (pool.lt(0) || margin.lt(0)) {
    return "Worker pool and firm margin can't be negative.";
  }
  if ([gross, pool, margin].some((d) => d.decimalPlaces() > 2)) {
    return "Money is tracked to the cent. Use at most two decimals.";
  }
  if (!pool.add(margin).equals(gross)) {
    return "Worker pool and firm margin must add up to the gross value.";
  }
  return null;
}

/** The unallocated remainder of a worker pool after accepted splits. */
export function poolRemainder(
  workerPool: MoneyInput,
  acceptedSplits: MoneyInput[],
): Prisma.Decimal {
  return acceptedSplits.reduce<Prisma.Decimal>(
    (rest, split) => rest.sub(dec(split)),
    dec(workerPool),
  );
}

/** A bid's proposed split must be > 0 and fit the unallocated remainder
 *  (PRD 7.1). Returns null when valid, else a renderable sentence. */
export function validateSplit(
  proposedSplit: MoneyInput,
  workerPool: MoneyInput,
  acceptedSplits: MoneyInput[],
): string | null {
  const split = dec(proposedSplit);
  if (split.lte(0)) return "A split must be greater than zero.";
  if (split.decimalPlaces() > 2) {
    return "Money is tracked to the cent. Use at most two decimals.";
  }
  const remainder = poolRemainder(workerPool, acceptedSplits);
  if (split.gt(remainder)) {
    return `Couldn't place this bid. ${remainder.toFixed(2)} of the pool is unallocated; propose at most that.`;
  }
  return null;
}
