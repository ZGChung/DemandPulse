import { isLocale, getDefaultLocale, getMessage, SUPPORTED_LOCALES } from "@/lib/i18n";

describe("i18n", () => {
  describe("isLocale", () => {
    it("should return true for valid locales", () => {
      expect(isLocale("en")).toBe(true);
      expect(isLocale("zh")).toBe(true);
    });

    it("should return false for invalid locales", () => {
      expect(isLocale("fr")).toBe(false);
      expect(isLocale("")).toBe(false);
      expect(isLocale("EN")).toBe(false);
    });
  });

  describe("getDefaultLocale", () => {
    it("should return en as default", () => {
      expect(getDefaultLocale()).toBe("en");
    });
  });

  describe("getMessage", () => {
    it("should return message for valid key", () => {
      const messages = { hello: "Hello!" };
      expect(getMessage(messages, "hello")).toBe("Hello!");
    });

    it("should return key for missing message", () => {
      const messages = {};
      expect(getMessage(messages, "missing")).toBe("missing");
    });
  });

  describe("SUPPORTED_LOCALES", () => {
    it("should contain expected locales", () => {
      expect(SUPPORTED_LOCALES).toContain("en");
      expect(SUPPORTED_LOCALES).toContain("zh");
    });
  });
});
