/**
 * Stripe Product / Price setup for Mania Market
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs
 *
 * Creates:
 *   - Product: Mania Market Standard
 *   - Product: Mania Market Premium
 *   - Price: standard_monthly (980 JPY / month)
 *   - Price: premium_monthly (2980 JPY / month)
 */

import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) {
  console.error("STRIPE_SECRET_KEY is required");
  process.exit(1);
}

const stripe = new Stripe(secret, { apiVersion: "2025-02-24.acacia" });

async function ensureProduct(name, lookupKey) {
  const listed = await stripe.products.list({ limit: 100, active: true });
  const existing = listed.data.find((product) => product.metadata.lookup_key === lookupKey);
  if (existing) return existing;

  return stripe.products.create({
    name,
    metadata: { lookup_key: lookupKey }
  });
}

async function ensureMonthlyPrice(productId, lookupKey, amountYen) {
  const listed = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const existing = listed.data.find((price) => price.metadata.lookup_key === lookupKey);
  if (existing) return existing;

  return stripe.prices.create({
    product: productId,
    currency: "jpy",
    unit_amount: amountYen,
    recurring: { interval: "month" },
    metadata: { lookup_key: lookupKey }
  });
}

async function main() {
  const standardProduct = await ensureProduct("Mania Market Standard", "standard");
  const premiumProduct = await ensureProduct("Mania Market Premium", "premium");

  const standardPrice = await ensureMonthlyPrice(standardProduct.id, "standard_monthly", 980);
  const premiumPrice = await ensureMonthlyPrice(premiumProduct.id, "premium_monthly", 2980);

  console.log("\nAdd these to .env.local:\n");
  console.log(`STRIPE_STANDARD_PRICE_ID=${standardPrice.id}`);
  console.log(`STRIPE_PREMIUM_PRICE_ID=${premiumPrice.id}`);
  console.log("\nProducts:");
  console.log(`  standard: ${standardProduct.id}`);
  console.log(`  premium: ${premiumProduct.id}`);
  console.log("\nConfigure Stripe Customer Portal:");
  console.log("  Dashboard > Settings > Billing > Customer portal");
  console.log("  - Enable subscription cancel / switch plans / update payment method");
  console.log("  - Add Standard and Premium prices for plan switching");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});