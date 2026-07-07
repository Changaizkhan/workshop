export function createTechnicianService(repos) {
  const { technicians } = repos;

  return {
    async ensureDefaults() {
      for (let i = 0; i < technicians.DEFAULT_NAMES.length; i++) {
        const name = technicians.DEFAULT_NAMES[i];
        const exists = await technicians.findByName(name);
        if (!exists) {
          await technicians.create({ id: `tech-${i + 1}-${Date.now()}`, name });
        }
      }
    },

    list: () => technicians.findAll(),

    async add(name) {
      const trimmed = (name || "").trim();
      if (!trimmed) return null;
      const exists = await technicians.findByName(trimmed);
      if (exists) return exists.name;
      await technicians.create({ id: `tech-${Date.now()}`, name: trimmed });
      return trimmed;
    },

    delete: (name) => technicians.delete(name),
  };
}
