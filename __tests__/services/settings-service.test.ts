import fs from "fs/promises";
import os from "os";
import path from "path";

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

import { SettingsService, DEFAULT_SETTINGS } from "@/services/settings-service";

describe("SettingsService", () => {
  let service: SettingsService;
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `settings-test-${Date.now()}`);
    jest.spyOn(process, "cwd").mockReturnValue(tempDir);
    service = new SettingsService();
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
    jest.restoreAllMocks();
  });

  describe("getSettings", () => {
    it("should return default settings when no file exists", async () => {
      const settings = await service.getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe("updateSettings", () => {
    it("should update and return merged settings", async () => {
      const updates = { clusteringEnabled: false, apiRateLimit: 50 };
      const result = await service.updateSettings(updates, "test-user");

      expect(result.clusteringEnabled).toBe(false);
      expect(result.apiRateLimit).toBe(50);
      expect(result.updatedBy).toBe("test-user");
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should persist settings to file", async () => {
      await service.updateSettings({ maintenanceMode: true }, "test-user");

      const fileContent = await fs.readFile(
        path.join(tempDir, "data", "system-settings.json"),
        "utf-8"
      );
      const saved = JSON.parse(fileContent);
      expect(saved.maintenanceMode).toBe(true);
    });
  });

  describe("getSetting", () => {
    it("should return single setting value", async () => {
      const value = await service.getSetting("clusteringEnabled");
      expect(value).toBe(true);
    });
  });

  describe("clearCache", () => {
    it("should clear the cache", async () => {
      await service.getSettings();
      service.clearCache();
      const settings = await service.getSettings();
      expect(settings.clusteringEnabled).toBe(true);
    });

    it("should return cached settings when cache is valid", async () => {
      await service.getSettings();
      const settings1 = await service.getSettings();
      expect(settings1.clusteringEnabled).toBe(true);
    });
  });

  describe("updateSettings error handling", () => {
    it("should throw error when save fails", async () => {
      // First make sure settings file exists
      await service.getSettings();
      // Now mock writeFile to fail
      const writeFileSpy = jest
        .spyOn(fs, "writeFile")
        .mockRejectedValueOnce(new Error("Write error"));
      await expect(service.updateSettings({ apiRateLimit: 100 }, "test-user")).rejects.toThrow(
        "Failed to update system settings"
      );
      writeFileSpy.mockRestore();
    });
  });
});
