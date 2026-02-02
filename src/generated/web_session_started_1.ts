/* eslint-disable */
// Auto-generated from web/session_started@1.schema.json

/**
 * Fired when a new session is started (captures attribution)
 */
export interface SessionStartedEvent {
  /**
   * UTM source parameter
   */
  utm_source?: string;
  /**
   * UTM medium parameter
   */
  utm_medium?: string;
  /**
   * UTM campaign parameter
   */
  utm_campaign?: string;
  /**
   * UTM term parameter
   */
  utm_term?: string;
  /**
   * UTM content parameter
   */
  utm_content?: string;
  /**
   * Referrer hostname
   */
  referrer_host?: string;
  /**
   * Landing page path
   */
  landing_page?: string;
  [k: string]: any | undefined;
}
