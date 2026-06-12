import { allVaultAssets } from "../../prisma/seed-data";
import type { MockVaultAsset } from "./types";

/** Vault assets, re-exported from the canonical seed narrative. */
export const VAULT_ASSETS: MockVaultAsset[] = allVaultAssets();
