import fs from "fs/promises";
import path from "path";
import { apiLogger } from "@/lib/logger";

export interface SystemSettings {
  // Clustering settings
  clusteringEnabled: boolean;
  clusteringThreshold: number;
  autoClusterFrequency: "hourly" | "daily" | "weekly" | "manual";

  // Email settings
  emailNotifications: boolean;
  adminEmail: string;
  notificationThreshold: number;

  // Privacy settings
  dataRetentionDays: number;
  autoAnonymization: boolean;
  requireConsentForCollection: boolean;

  // System settings
  maintenanceMode: boolean;
  apiRateLimit: number;
  enablePublicApi: boolean;

  // Timestamps
  updatedAt?: Date;
  updatedBy?: string;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  clusteringEnabled: true,
  clusteringThreshold: 0.7,
  autoClusterFrequency: "daily",
  emailNotifications: true,
  adminEmail: "",
  notificationThreshold: 10,
  dataRetentionDays: 365,
  autoAnonymization: true,
  requireConsentForCollection: true,
  maintenanceMode: false,
  apiRateLimit: 100,
  enablePublicApi: false,
};

export class SettingsService {
  private cache: SystemSettings | null = null;
  private cacheTimestamp: number = 0;
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private settingsFilePath: string;

  constructor() {
    this.settingsFilePath = path.join(process.cwd(), "data", "system-settings.json");
  }

  private async ensureSettingsFile(): Promise<void> {
    try {
      await fs.access(this.settingsFilePath);
    } catch {
      // File doesn't exist, create directory and file with defaults
      await fs.mkdir(path.dirname(this.settingsFilePath), { recursive: true });
      await this.saveSettingsToFile(DEFAULT_SETTINGS);
    }
  }

  private async loadSettingsFromFile(): Promise<SystemSettings> {
    await this.ensureSettingsFile();
    const data = await fs.readFile(this.settingsFilePath, "utf-8");
    const fileSettings = JSON.parse(data);
    return { ...DEFAULT_SETTINGS, ...fileSettings };
  }

  private async saveSettingsToFile(settings: SystemSettings): Promise<void> {
    await fs.mkdir(path.dirname(this.settingsFilePath), { recursive: true });
    const data = JSON.stringify(settings, null, 2);
    await fs.writeFile(this.settingsFilePath, data, "utf-8");
  }

  async getSettings(): Promise<SystemSettings> {
    // Check cache
    const now = Date.now();
    if (this.cache && now - this.cacheTimestamp < this.CACHE_TTL) {
      return this.cache;
    }

    try {
      const settings = await this.loadSettingsFromFile();
      this.cache = settings;
      this.cacheTimestamp = now;
      return settings;
    } catch (error) {
      apiLogger.error("Failed to load settings from file", { error: String(error) });
      return DEFAULT_SETTINGS;
    }
  }

  async updateSettings(settings: Partial<SystemSettings>, updatedBy: string): Promise<SystemSettings> {
    try {
      const currentSettings = await this.getSettings();
      const mergedSettings = {
        ...currentSettings,
        ...settings,
        updatedAt: new Date(),
        updatedBy
      };

      await this.saveSettingsToFile(mergedSettings);

      // Update cache
      this.cache = mergedSettings;
      this.cacheTimestamp = Date.now();

      apiLogger.info("System settings updated", { updatedBy, changes: settings });

      return mergedSettings;
    } catch (error) {
      apiLogger.error("Failed to update settings", { error: String(error), updatedBy });
      throw new Error("Failed to update system settings");
    }
  }

  async getSetting<T extends keyof SystemSettings>(key: T): Promise<SystemSettings[T]> {
    const settings = await this.getSettings();
    return settings[key];
  }

  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

export const settingsService = new SettingsService();