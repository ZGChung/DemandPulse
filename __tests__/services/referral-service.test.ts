import { ReferralService } from "../../services/referral-service";

describe("ReferralService", () => {
  let service: ReferralService;

  beforeEach(() => {
    service = new ReferralService();
  });

  describe("generateReferralCode", () => {
    it("should generate a valid referral code", () => {
      const code = service.generateReferralCode("user123", "test@example.com");
      expect(code).toMatch(/^DP[A-Z0-9]+$/);
    });

    it("should store the referral", () => {
      const code = service.generateReferralCode("user123", "test@example.com");
      const referral = service.getReferralByCode(code);
      expect(referral).toBeDefined();
      expect(referral?.referrerUserId).toBe("user123");
    });
  });

  describe("getReferralByCode", () => {
    it("should return undefined for non-existent code", () => {
      const result = service.getReferralByCode("INVALID");
      expect(result).toBeUndefined();
    });
  });

  describe("getUserReferrals", () => {
    it("should return empty array for new user", () => {
      const referrals = service.getUserReferrals("newuser");
      expect(referrals).toEqual([]);
    });

    it("should return user's referrals", () => {
      service.generateReferralCode("user1", "a@test.com");
      service.generateReferralCode("user1", "b@test.com");
      const referrals = service.getUserReferrals("user1");
      expect(referrals).toHaveLength(2);
    });
  });

  describe("getUserReferralStats", () => {
    it("should return correct stats for new user", () => {
      const stats = service.getUserReferralStats("user999");
      expect(stats.totalReferrals).toBe(0);
      expect(stats.completedReferrals).toBe(0);
      expect(stats.pendingReferrals).toBe(0);
      expect(stats.rewardEligible).toBe(false);
      expect(stats.nextRewardAt).toBe(3);
    });

    it("should be reward eligible after 3 completed referrals", () => {
      const code1 = service.generateReferralCode("user1");
      const code2 = service.generateReferralCode("user1");
      const code3 = service.generateReferralCode("user1");

      service.processReferralSignup(code1, "referred1");
      service.processReferralSignup(code2, "referred2");

      let stats = service.getUserReferralStats("user1");
      expect(stats.rewardEligible).toBe(false);
      expect(stats.nextRewardAt).toBe(1);

      service.processReferralSignup(code3, "referred3");

      stats = service.getUserReferralStats("user1");
      expect(stats.rewardEligible).toBe(true);
      expect(stats.nextRewardAt).toBeUndefined();
    });
  });

  describe("processReferralSignup", () => {
    it("should return false for invalid code", () => {
      const result = service.processReferralSignup("INVALID", "newuser");
      expect(result).toBe(false);
    });

    it("should complete referral successfully", () => {
      const code = service.generateReferralCode("referrer");
      const result = service.processReferralSignup(code, "referredUser");
      expect(result).toBe(true);

      const referral = service.getReferralByCode(code);
      expect(referral?.status).toBe("completed");
      expect(referral?.referredUserId).toBe("referredUser");
      expect(referral?.completedAt).toBeDefined();
    });

    it("should not process already completed referral", () => {
      const code = service.generateReferralCode("referrer");
      service.processReferralSignup(code, "user1");
      const result = service.processReferralSignup(code, "user2");
      expect(result).toBe(false);
    });
  });

  describe("getShareableLink", () => {
    it("should generate correct shareable link", () => {
      const link = service.getShareableLink("TEST123");
      expect(link).toBe("https://demandpulse.app/auth/signin?ref=TEST123");
    });

    it("should use custom base URL", () => {
      const link = service.getShareableLink("TEST123", "https://staging.demandpulse.app");
      expect(link).toBe("https://staging.demandpulse.app/auth/signin?ref=TEST123");
    });
  });

  describe("getShareMessage", () => {
    it("should generate share message with link", () => {
      const msg = service.getShareMessage("TEST123");
      expect(msg).toContain("TEST123");
      expect(msg).toContain("DemandPulse");
    });
  });

  describe("getLeaderboard", () => {
    it("should return empty leaderboard initially", () => {
      const leaderboard = service.getLeaderboard();
      expect(leaderboard).toEqual([]);
    });

    it("should rank users by completed referrals", () => {
      const code1 = service.generateReferralCode("topuser");
      const code2 = service.generateReferralCode("topuser");
      service.processReferralSignup(code1, "r1");
      service.processReferralSignup(code2, "r2");

      const code3 = service.generateReferralCode("otheruser");
      service.processReferralSignup(code3, "r3");

      const leaderboard = service.getLeaderboard();
      expect(leaderboard[0].userId).toBe("topuser");
      expect(leaderboard[0].completedReferrals).toBe(2);
    });
  });
});
