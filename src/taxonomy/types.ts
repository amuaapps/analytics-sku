export interface EventDefinition<T = unknown> {
  eventName: string;
  eventVersion: number;
  schemaId: string;
  domain: string;
  validate?: (payload: T) => boolean;
}
