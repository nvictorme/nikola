import { redis } from "./redis";
import { IChatMessage } from "shared/interfaces";

export class ChatStorage {
  private static CHAT_KEY = "chats:";
  private static MESSAGE_TTL = 60 * 60 * 24 * 30; // 30 days in seconds

  static async saveMessage(message: IChatMessage): Promise<void> {
    const chatId = this.getChatId(message.sender.id, message.recipient.id);
    const messageString = JSON.stringify({
      ...message,
      timestamp: new Date(message.timestamp).toISOString(),
    });

    await redis.rpush(this.CHAT_KEY + chatId, messageString);
    await redis.expire(this.CHAT_KEY + chatId, this.MESSAGE_TTL);
  }

  static async getMessages(
    userId1: string,
    userId2: string
  ): Promise<IChatMessage[]> {
    const chatId = this.getChatId(userId1, userId2);
    const messages = await redis.lrange(this.CHAT_KEY + chatId, 0, -1);

    return messages.map((msg) => {
      const parsed = JSON.parse(msg);
      return {
        ...parsed,
        timestamp: new Date(parsed.timestamp),
      };
    });
  }

  static async getUserChats(userId: string): Promise<string[]> {
    const keys = await redis.keys(this.CHAT_KEY + userId + ":*");
    return keys.map((key) => key.replace(this.CHAT_KEY + userId + ":", ""));
  }

  private static getChatId(userId1: string, userId2: string): string {
    // Sort IDs to ensure consistent chat ID regardless of sender/recipient order
    const sortedIds = [userId1, userId2].sort();
    return `${sortedIds[0]}:${sortedIds[1]}`;
  }
}
