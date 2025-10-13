import { SeedRepository } from "./seed-repository";

export class ReplayService {
  constructor(private readonly seedRepository: SeedRepository) {}

  async persistSeed(sessionId: string, seed: number): Promise<void> {
    await this.seedRepository.persistSeed(sessionId, seed);
  }

  async getSeed(sessionId: string): Promise<number | null> {
    return this.seedRepository.fetchSeed(sessionId);
  }

  async clearSeed(sessionId: string): Promise<void> {
    await this.seedRepository.deleteSeed(sessionId);
  }
}
