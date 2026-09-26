/**
 * Supabase Database Client Abstraction
 * Configures typed client connection using application environment settings.
 */

import { config } from '../../config/env';

export interface DatabaseClientInterface {
  isConfigured(): boolean;
  status(): string;
}

export class DatabaseClient implements DatabaseClientInterface {
  private url: string;
  private key: string;

  constructor() {
    this.url = config.supabase.url;
    this.key = config.supabase.anonKey;
  }

  public isConfigured(): boolean {
    return (
      Boolean(this.url) &&
      !this.url.includes('placeholder') &&
      Boolean(this.key) &&
      !this.key.includes('placeholder')
    );
  }

  public status(): string {
    return this.isConfigured() ? 'CONFIGURED' : 'PENDING_ENVIRONMENT_SETUP';
  }
}

export const dbClient = new DatabaseClient();
