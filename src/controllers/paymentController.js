import { initializePayment } from '../services/paymentService.js';
import { logger } from '../utils/logger.js';
import { VIP_PLANS } from '../config/plans.js';

/**
 * @desc    Get all available VIP plans and their prices
 * @route   GET /api/plans
 * @access  Public
 */
export const getPlans = (req, res) => {
  // Return the plans from our central configuration
  res.status(200).json({ success: true, data: VIP_PLANS });
};

// @desc    Initialize a Paystack checkout for VIP access
// @route   POST /api/payments/create-checkout
// @access  Private (Requires valid Firebase Token)
export const createCheckoutSession = async (req, res, next) => {
  try {
    // `req.user` is populated by your `authMiddleware`
    const { email, uid } = req.user;

    // Extract planId from request body instead of raw amount
    const { planId } = req.body;
    const selectedPlan = VIP_PLANS[planId];

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing VIP plan selection.'
      });
    }

    const planAmount = selectedPlan.price;

    // Embed the user's UID so your webhook knows who to upgrade!
    const metadata = {
      uid: uid,
      planId: selectedPlan.id,
      custom_fields: [
        { display_name: "Firebase UID", variable_name: "uid", value: uid },
        { display_name: "Plan", variable_name: "plan", value: selectedPlan.name }
      ]
    };

    logger.info(`Initializing ${selectedPlan.name} payment checkout for user: ${email}`);

    const paymentData = await initializePayment(email, planAmount, metadata);

    // Send the checkout URL and reference back to the frontend
    res.status(200).json({
      success: true,
      data: paymentData // Contains authorization_url, access_code, and reference
    });
  } catch (error) {
    next(error);
  }
};