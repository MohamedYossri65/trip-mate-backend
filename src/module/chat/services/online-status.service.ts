import { Injectable } from '@nestjs/common';

/**
 * Service to track and query user online status in real-time chat
 */
@Injectable()
export class OnlineStatusService {
  private userSockets = new Map<string, Set<string>>();

  /**
   * Mark a user as online with a socket connection
   */
  markOnline(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId) ?? new Set<string>();
    sockets.add(socketId);
    this.userSockets.set(userId, sockets);
  }

  /**
   * Mark a user's socket connection as offline
   */
  markOffline(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  /**
   * Check if a specific user is currently online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get online status for multiple users
   */
  getOnlineStatus(userIds: string[]): Map<string, boolean> {
    const status = new Map<string, boolean>();
    for (const userId of userIds) {
      status.set(userId, this.isUserOnline(userId));
    }
    return status;
  }
}
