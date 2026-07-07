import { Notification } from "../db/models.js";

export function createNotificationRepository() {
  return {
    async findAll() {
      const list = await Notification.find().lean();
      return list.sort((a, b) => b.date.localeCompare(a.date));
    },

    async findUnreadDuplicate(type, messageRegex) {
      return Notification.findOne({ type, message: { $regex: messageRegex }, isRead: false }).lean();
    },

    async create(noti) {
      await Notification.create(noti);
    },

    async markRead(id) {
      const result = await Notification.updateOne({ id }, { $set: { isRead: true } });
      return result.matchedCount > 0;
    },

    async clearAll() {
      await Notification.deleteMany({});
    },
  };
}
