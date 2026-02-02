/* eslint-disable */
// Auto-generated from web/experiment_exposed@1.schema.json

/**
 * Fired when a user is exposed to an A/B test experiment
 */
export interface ExperimentExposedEvent {
  /**
   * Unique experiment identifier
   */
  experiment_id: string;
  /**
   * Human-readable experiment name
   */
  experiment_name?: string;
  /**
   * Variant identifier (e.g., control, variant_a)
   */
  variant_id: string;
  /**
   * Human-readable variant name
   */
  variant_name?: string;
  [k: string]: any | undefined;
}
