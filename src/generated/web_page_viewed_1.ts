/* eslint-disable */
// Auto-generated from web/page_viewed@1.schema.json

/**
 * Fired when a user views a page
 */
export interface PageViewedEvent {
  /**
   * Page path (e.g., /home, /products/123)
   */
  page: string;
  /**
   * Page title
   */
  title: string;
  /**
   * Page category (e.g., landing, product, checkout)
   */
  category?: string;
  /**
   * Additional page-specific properties
   */
  properties?: {
    [k: string]: any | undefined;
  };
}
