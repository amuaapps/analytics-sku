/* eslint-disable */
// Auto-generated from web/page_viewed@1.schema.json

/**
 * Fired when a user views a page
 */
export interface PageViewedEvent {
  /**
   * Page path (e.g., /home, /products/123)
   */
  page_path?: string;
  /**
   * Page title
   */
  page_title?: string;
  /**
   * Page category (e.g., landing, product, checkout)
   */
  page_category?: string;
  /**
   * Navigation context
   */
  navigation?: {
    /**
     * Previous page path
     */
    from_path?: string;
    /**
     * Referrer hostname
     */
    referrer_host?: string;
    [k: string]: any | undefined;
  };
  [k: string]: any | undefined;
}
