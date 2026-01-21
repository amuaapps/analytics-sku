/* eslint-disable */
// Auto-generated from checkout/payment_submitted@1.schema.json

/**
 * Fired when a user submits payment information
 */
export interface PaymentSubmittedEvent {
  /**
   * Unique order identifier
   */
  orderId: string;
  /**
   * Payment amount
   */
  amount: number;
  /**
   * ISO 4217 currency code
   */
  currency: string;
  /**
   * Payment method used
   */
  paymentMethod:
    | "credit_card"
    | "debit_card"
    | "paypal"
    | "apple_pay"
    | "google_pay";
  /**
   * Items in the order
   */
  items?: {
    productId: string;
    quantity: number;
    price: number;
    [k: string]: any | undefined;
  }[];
}
