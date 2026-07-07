export function createNotificationService(repos) {
  const { notifications } = repos;

  return {
    list: () => notifications.findAll(),

    async add(noti) {
      await notifications.create({
        id: noti.id || `ntf-${Date.now()}`,
        isRead: false,
        date: new Date().toISOString(),
        ...noti,
      });
    },

    markRead: (id) => notifications.markRead(id),

    clearAll: () => notifications.clearAll(),
  };
}
