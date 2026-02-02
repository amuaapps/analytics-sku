/* eslint-disable */
// Auto-generated from checkout/purchase_completed@1.schema.json

/**
 * Fired when a purchase is successfully completed
 */
export interface PurchaseCompletedEvent {
  /**
   * Unique order identifier
   */
  order_id: string;
  /**
   * Total purchase amount
   */
  total_amount: number;
  /**
   * ISO 4217 currency code
   */
  currency: string;
  /**
   * Payment method used
   */
  payment_method?: "credit_card" | "debit_card" | "paypal" | "apple_pay" | "google_pay";
  /**
   * Items in the order
   */
  items?: {
    /**
     * Product identifier
     */
    product_id: string;
    /**
     * Product name
     */
    product_name?: string;
    quantity: number;
    price: number;
    [k: string]: any | undefined;
  }[];
  /**
   * Total discount applied
   */
  discount_amount?: number;
  /**
   * Total tax amount
   */
  tax_amount?: number;
  /**
   * Shipping cost
   */
  shipping_amount?: number;
  [k: string]: any | undefined;
}
