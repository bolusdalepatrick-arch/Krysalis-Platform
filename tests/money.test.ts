import { describe, expect, it } from "vitest";
import { dec, poolRemainder, validateJobMoney, validateSplit } from "@/lib/money";

describe("validateJobMoney", () => {
  it("accepts pool + margin = gross", () => {
    expect(validateJobMoney("6500.00", "4200.00", "2300.00")).toBeNull();
  });

  it("rejects a broken invariant", () => {
    expect(validateJobMoney(6500, 4200, 2400)).toMatch(/add up/);
  });

  it("rejects zero and negative gross", () => {
    expect(validateJobMoney(0, 0, 0)).toMatch(/greater than zero/);
    expect(validateJobMoney(-5, -3, -2)).toMatch(/greater than zero/);
  });

  it("rejects sub-cent precision", () => {
    expect(validateJobMoney("100.005", "60.005", "40.00")).toMatch(/two decimals/);
  });

  it("survives decimal edge cases floats would break", () => {
    // 0.1 + 0.2 style trap: 6500.10 = 4200.07 + 2300.03
    expect(validateJobMoney("6500.10", "4200.07", "2300.03")).toBeNull();
  });
});

describe("poolRemainder and validateSplit", () => {
  it("computes the unallocated remainder", () => {
    expect(poolRemainder("6500.00", ["1200.00", "1800.00"]).toFixed(2)).toBe("3500.00");
  });

  it("accepts a split that exactly fills the remainder", () => {
    expect(validateSplit("3500.00", "6500.00", ["1200.00", "1800.00"])).toBeNull();
  });

  it("rejects a split over the remainder, naming the remainder", () => {
    const error = validateSplit("3500.01", "6500.00", ["1200.00", "1800.00"]);
    expect(error).toContain("3500.00");
  });

  it("rejects zero and negative splits", () => {
    expect(validateSplit(0, "6500.00", [])).toMatch(/greater than zero/);
    expect(validateSplit("-10", "6500.00", [])).toMatch(/greater than zero/);
  });

  it("keeps Decimal identity for string and number inputs", () => {
    expect(dec(6500).equals(dec("6500.00"))).toBe(true);
  });
});
