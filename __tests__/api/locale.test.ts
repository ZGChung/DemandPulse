// Unit test for locale route logic
import { isLocale, getDefaultLocale } from "@/lib/i18n";

describe("/api/locale logic", () => {
  describe("isLocale", () => {
    it("should return true for valid locales", () => {
      expect(isLocale("en")).toBe(true);
      expect(isLocale("zh")).toBe(true);
    });

    it("should return false for invalid locales", () => {
      expect(isLocale("es")).toBe(false);
      expect(isLocale("fr")).toBe(false);
      expect(isLocale("de")).toBe(false);
      expect(isLocale("ja")).toBe(false);
      expect(isLocale("invalid")).toBe(false);
      expect(isLocale("")).toBe(false);
      expect(isLocale("EN")).toBe(false);
      expect(isLocale("zh-CN")).toBe(false);
    });
  });

  describe("getDefaultLocale", () => {
    it("should return default locale", () => {
      expect(getDefaultLocale()).toBe("en");
    });
  });

  describe("locale selection logic", () => {
    it("should select provided locale when valid", () => {
      const body = { locale: "zh" };
      const locale = body.locale && isLocale(body.locale) ? body.locale : getDefaultLocale();
      expect(locale).toBe("zh");
    });

    it("should use default locale when not provided", () => {
      const body = {};
      const locale = body.locale && isLocale(body.locale) ? body.locale : getDefaultLocale();
      expect(locale).toBe("en");
    });

    it("should use default locale when invalid", () => {
      const body = { locale: "invalid" };
      const locale = body.locale && isLocale(body.locale) ? body.locale : getDefaultLocale();
      expect(locale).toBe("en");
    });
  });
});
