import Stripe from "stripe";
import { requireEnv } from "@/lib/supabase/server";

export function getStripe() {
  return new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2025-02-24.acacia",
    typescript: true
  });
}
