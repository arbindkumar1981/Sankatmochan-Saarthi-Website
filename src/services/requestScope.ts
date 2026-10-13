export interface ScopedRequest { controller: AbortController }

/** Ownership survives a timeout so the current request can report its error. */
export class RequestScope {
  private active: ScopedRequest | undefined;
  start(): ScopedRequest {
    this.invalidate();
    this.active = { controller: new AbortController() };
    return this.active;
  }
  owns(request: ScopedRequest) { return this.active === request; }
  finish(request: ScopedRequest) { if (this.owns(request)) this.active = undefined; }
  invalidate() { this.active?.controller.abort(); this.active = undefined; }
}

export function recordsForIdentity<T>(owner: string, identity: string, records: T[]): T[] {
  return owner === identity ? records : [];
}
