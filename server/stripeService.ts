import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
// Deliberately pinned to the API version this integration was built against.
// The installed SDK's types only name its own default version, so the pin is
// asserted rather than widened — changing it would alter live payment payloads.
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-03-31.basil" as Stripe.StripeConfig["apiVersion"],
    })
  : null;

export { stripe };

// Academy subscription plans
export const SUBSCRIPTION_PLANS = {
  monthly: {
    name: "Monthly Subscription",
    nameAr: "اشتراك شهري",
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || "",
    amount: 50000, // EGP 500 in piastres
    currency: "egp",
    interval: "month" as const,
    features: ["Full access to player portal", "Progress tracking", "Attendance reports"],
    featuresAr: ["وصول كامل لبوابة اللاعب", "تتبع التقدم", "تقارير الحضور"],
  },
  quarterly: {
    name: "Quarterly Subscription",
    nameAr: "اشتراك ربع سنوي",
    priceId: process.env.STRIPE_QUARTERLY_PRICE_ID || "",
    amount: 135000, // EGP 1350 in piastres (10% discount)
    currency: "egp",
    interval: "month" as const,
    intervalCount: 3,
    features: ["Full access + 10% discount", "Priority support", "Video analysis credits"],
    featuresAr: ["وصول كامل + خصم 10%", "دعم أولوية", "رصيد تحليل فيديو"],
  },
  annual: {
    name: "Annual Subscription",
    nameAr: "اشتراك سنوي",
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID || "",
    amount: 480000, // EGP 4800 in piastres (20% discount)
    currency: "egp",
    interval: "year" as const,
    features: ["Full access + 20% discount", "VIP support", "Unlimited video analysis", "FIFA card print"],
    featuresAr: ["وصول كامل + خصم 20%", "دعم VIP", "تحليل فيديو غير محدود", "طباعة بطاقة FIFA"],
  },
};

export async function createCheckoutSession({
  planKey,
  userId,
  userEmail,
  userName,
  playerId,
  successUrl,
  cancelUrl,
}: {
  planKey: keyof typeof SUBSCRIPTION_PLANS;
  userId: number;
  userEmail: string;
  userName: string;
  playerId?: number;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const plan = SUBSCRIPTION_PLANS[planKey];

  // Create a one-time payment checkout (since we may not have Stripe prices set up yet)
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: userEmail,
    allow_promotion_codes: true,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      customer_email: userEmail,
      customer_name: userName,
      plan_key: planKey,
      player_id: playerId?.toString() || "",
    },
    line_items: [
      {
        price_data: {
          currency: "usd", // Use USD for Stripe test mode compatibility
          product_data: {
            name: plan.name,
            description: plan.features.join(", "),
          },
          unit_amount: Math.round(plan.amount / 100), // Convert to cents equivalent
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session;
}
