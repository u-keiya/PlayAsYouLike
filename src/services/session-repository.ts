export type SessionRecord = {
  sessionId: string;
  url: string;
  colorHex: string;
  seed: number;
  createdAt: Date;
  payload: unknown;
};

export class SessionRepository {
  private readonly records = new Map<string, SessionRecord>();

  save(record: SessionRecord) {
    this.records.set(record.sessionId, record);
  }

  findById(sessionId: string) {
    return this.records.get(sessionId) ?? null;
  }

  clear() {
    this.records.clear();
  }
}
