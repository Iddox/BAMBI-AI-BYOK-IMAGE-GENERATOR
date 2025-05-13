import Stripe from 'stripe';

// Initialisation du client Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * Crée une session de paiement Stripe pour l'abonnement premium
 * @param userId ID de l'utilisateur
 * @param customerEmail Email de l'utilisateur
 * @returns URL de la session de paiement
 */
export async function createCheckoutSession(userId: string, customerEmail: string) {
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    billing_address_collection: 'auto',
    customer_email: customerEmail,
    client_reference_id: userId,
    line_items: [
      {
        price: process.env.STRIPE_PREMIUM_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans?canceled=true`,
    subscription_data: {
      metadata: {
        userId,
      },
    },
  });

  return checkoutSession.url;
}

/**
 * Crée une session de portail client Stripe
 * @param customerId ID client Stripe
 * @returns URL de la session du portail
 */
export async function createPortalSession(customerId: string) {
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
  });

  return portalSession.url;
}
