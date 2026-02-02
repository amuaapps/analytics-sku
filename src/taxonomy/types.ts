export interface EventDefinition<T = unknown> {
  name: string;
  type: "track" | "page" | "identify";
  domain: string;
  validate?: (payload: T) => boolean;
}
