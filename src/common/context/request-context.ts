import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  requestId: string;
}

/**
 * Guarda datos propios de cada petición (por ahora el request id) para que
 * cualquier capa (services, filtros, guards) pueda leerlos sin tener que
 * pasar el objeto Request de método en método.
 */
export class RequestContext {
  private static readonly storage =
    new AsyncLocalStorage<RequestContextStore>();

  static run(store: RequestContextStore, callback: () => void): void {
    this.storage.run(store, callback);
  }

  static get requestId(): string | undefined {
    return this.storage.getStore()?.requestId;
  }
}
