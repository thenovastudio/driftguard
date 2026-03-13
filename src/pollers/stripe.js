import Stripe from 'stripe';
import { logger } from '../logger.js';

export async function pollStripe() {
  const apiKey = process.env.STRIPE_API_KEY;
  if (!apiKey) {
    logger.warn('STRIPE_API_KEY not set, skipping');
    return { skipped: true };
  }
  
  const stripe = new Stripe(apiKey);
  
  try {
    // Fetch account settings
    const account = await stripe.accounts.retrieve();
    
    // Fetch webhook endpoints
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    
    // Fetch billing portal configuration
    let billingPortal = null;
    try {
      billingPortal = await stripe.billingPortal.configurations.list({ limit: 1 });
    } catch (e) {
      // May not have access
    }
    
    return {
      account: {
        id: account.id,
        business_type: account.business_type,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        default_currency: account.default_currency,
        country: account.country,
        email: account.email,
        settings: {
          branding: account.settings?.branding,
          card_payments: account.settings?.card_payments,
          payments: account.settings?.payments,
          payouts: account.settings?.payouts,
          dashboard: account.settings?.dashboard,
        },
      },
      webhooks: webhooks.data.map(w => ({
        id: w.id,
        url: w.url,
        status: w.status,
        enabled_events: w.enabled_events,
        api_version: w.api_version,
      })),
      billing_portal: billingPortal?.data?.map(c => ({
        id: c.id,
        business_profile: c.business_profile,
        features: c.features,
        default_return_url: c.default_return_url,
      })) || [],
    };
  } catch (error) {
    logger.error(`Stripe poll failed: ${error.message}`);
    throw error;
  }
}
