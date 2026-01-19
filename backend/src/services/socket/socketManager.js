export class SocketManager {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map();
  }

  registerUser(userId, socketId) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socketId);
  }

  unregisterUser(userId, socketId) {
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(socketId);
      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  emitToUser(userId, event, data) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  emitProgress(migrationId, progressData) {
    this.io.emit(`migration:progress:${migrationId}`, progressData);
  }

  emitLog(migrationId, logData) {
    this.io.emit(`migration:log:${migrationId}`, logData);
  }

  emitMigrationComplete(migrationId) {
    this.io.emit(`migration:complete:${migrationId}`, {
      migrationId,
      completedAt: new Date(),
    });
  }

  emitMigrationError(migrationId, error) {
    this.io.emit(`migration:error:${migrationId}`, {
      migrationId,
      error: error.message,
      timestamp: new Date(),
    });
  }
}
