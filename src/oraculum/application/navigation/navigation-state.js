const DEFAULT_ROUTE = 'visao';

export function createNavigationState(initialRoute = DEFAULT_ROUTE, validRoutes = []) {
  const allowed = new Set(validRoutes);
  let current = allowed.has(initialRoute) ? initialRoute : DEFAULT_ROUTE;

  return {
    get() { return current; },
    set(route) {
      if (!allowed.has(route)) return current;
      current = route;
      return current;
    }
  };
}
