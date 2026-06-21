import crypto from 'crypto';
import { env } from '../config/env.js';
import { db } from '../config/firebase.js';
import { VipSubscription } from '../models/VipSubscription.js';
import { logger } from '../utils/logger.js';
import { VIP_PLANS } from '../config/plans.js';

// @desc    Handle incoming Paystack webhooks
// @route   POST /api/webhooks/paystack
// @access  Public (Protected by HMAC Signature)
export const paystackWebhook = async (req, res) => {
  try {
    // 1. Verify the signature to ensure it's actually from Paystack
    const secret = env.PAYSTACK_SECRET_KEY;
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      logger.warn('Webhook blocked: Invalid Paystack signature');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;

    // 2. Acknowledge receipt immediately (Paystack requires a 200 OK fast, or it will keep retrying)
    res.status(200).send('Webhook received');

    // 3. Process the successful charge
    if (event.event === 'charge.success') {
      const { reference, amount, metadata } = event.data;
      const uid = metadata?.uid; // We expect your frontend to pass the user's Firebase UID in the metadata
      const planId = metadata?.planId || 'monthly'; // Fallback to monthly if not specified

      if (!uid) {
        logger.warn(`Webhook processed, but no UID found in metadata for reference: ${reference}`);
        return;
      }

      const selectedPlan = VIP_PLANS[planId] || VIP_PLANS.monthly;
      const durationDays = selectedPlan.durationDays;

      logger.info(`Processing ${selectedPlan.name} upgrade for UID: ${uid}`);

      // Calculate subscription dates based on the selected plan
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      // 4. Create the Subscription Record
      const subscription = new VipSubscription({ id: reference, userId: uid, plan: selectedPlan.id, amount: amount / 100, reference, startDate, endDate });
      await db.collection('subscriptions').doc(reference).set(subscription.toFirestore());

      // 5. Upgrade the User Document in Firestore
      await db.collection('users').doc(uid).set({ isVip: true, role: 'vip', vipExpiry: endDate }, { merge: true });

      logger.info(`Successfully upgraded user ${uid} to VIP.`);
    }
  } catch (error) {
    logger.error('Webhook processing error:', error);
  }
};