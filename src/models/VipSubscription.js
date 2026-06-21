export class VipSubscription {
  constructor({ 
    id, 
    userId, 
    plan, 
    amount, 
    reference, 
    status = 'active', // 'active', 'expired', 'cancelled'
    startDate = new Date(), 
    endDate 
  }) {
    this.id = id;
    this.userId = userId;
    this.plan = plan;             // e.g., 'monthly', 'yearly'
    this.amount = amount;         // Amount paid
    this.reference = reference;   // Transaction reference (from Paystack, Stripe, etc.)
    this.status = status; 
    this.startDate = startDate;
    this.endDate = endDate;       // Date when the VIP status should be revoked
  }

  toFirestore() {
    return {
      userId: this.userId,
      plan: this.plan,
      amount: this.amount,
      reference: this.reference,
      status: this.status,
      startDate: this.startDate,
      endDate: this.endDate,
    };
  }
}