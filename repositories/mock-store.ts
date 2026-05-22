function clone<T>(data: T): T {
  return structuredClone(data);
}

export function createMockStore<T extends { id: string }>(seed: T[]) {
  let items = clone(seed);

  return {
    getAll: () => clone(items),
    getById: (id: string) => items.find((i) => i.id === id) ?? null,
    create: (item: T) => {
      items = [...items, item];
      return clone(item);
    },
    update: (id: string, patch: Partial<T>) => {
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) return null;
      items[index] = { ...items[index], ...patch };
      return clone(items[index]);
    },
    remove: (id: string) => {
      const prev = items.length;
      items = items.filter((i) => i.id !== id);
      return prev !== items.length;
    },
    reset: (next?: T[]) => {
      items = clone(next ?? seed);
    },
  };
}

export function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
