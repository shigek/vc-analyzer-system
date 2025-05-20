import { asyncLocalStorage } from '../common/middleware/correlation-id.middleware';

export function processTime(): number {
  const store = asyncLocalStorage.getStore();
  if (store) {
    if (store.has('requestStartTime')) {
      return Date.now() - store.get('requestStartTime');
    }
  }
  return 0;
}
