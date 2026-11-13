import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not defined in environment variables.');
}

const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build';

export const stripe = new Stripe(apiKey, {
  apiVersion: '2024-09-30.acacia' as any,
  appInfo: {
    name: 'Polaris SocialWorkHub',
    version: '0.1.0',
  },
});

export const STRIPE_CONFIG = {
  productId: process.env.STRIPE_PRODUCT_ID || 'prod_VcXOayy3fqC9mm',
  teamPriceId: process.env.STRIPE_TEAM_PRICE_ID || 'price_1UbIK9EFxqhrZdwx7T23WYos',
  extraSeatPriceId: process.env.STRIPE_EXTRA_SEAT_PRICE_ID || 'price_1UbOshEFxqhrZdwx5rDAWLXm',
};
