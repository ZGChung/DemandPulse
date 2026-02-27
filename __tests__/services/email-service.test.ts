// Email service tests

import { EmailService, type EmailRecipient } from "../../services/email-service";

describe("EmailService", () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = new EmailService({ enabled: true, useMock: true });
  });

  describe("constructor", () => {
    it("should use default values when no config provided", () => {
      const service = new EmailService();
      expect(service).toBeDefined();
    });

    it("should accept custom configuration", () => {
      const service = new EmailService({
        enabled: false,
        useMock: true,
        fromEmail: "test@example.com",
      });
      expect(service).toBeDefined();
    });
  });

  describe("sendEmail", () => {
    const mockRecipient: EmailRecipient = {
      email: "test@example.com",
      name: "Test User",
      userId: "user-123",
    };

    const mockTemplate = {
      subject: "Test Email",
      body: "This is a test email",
      htmlBody: "<p>This is a test email</p>",
    };

    it("should skip sending when disabled", async () => {
      const disabledService = new EmailService({ enabled: false, useMock: true });
      const result = await disabledService.sendEmail({
        to: mockRecipient,
        template: mockTemplate,
      });
      expect(result.success).toBe(false);
    });

    it("should send mock email when useMock is true", async () => {
      const result = await emailService.sendEmail({
        to: mockRecipient,
        template: mockTemplate,
      });
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it("should include metadata in mock email", async () => {
      const result = await emailService.sendEmail({
        to: mockRecipient,
        template: mockTemplate,
        metadata: {
          requirementId: "req-123",
          clusterId: "cluster-456",
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("sendWelcomeEmail", () => {
    const mockRecipient: EmailRecipient = {
      email: "newuser@example.com",
      name: "New User",
    };

    it("should send welcome email successfully", async () => {
      const result = await emailService.sendWelcomeEmail(mockRecipient);
      expect(result.success).toBe(true);
    });
  });

  describe("sendRequirementSubmittedEmail", () => {
    const mockRecipient: EmailRecipient = {
      email: "user@example.com",
      name: "User",
    };

    it("should send requirement submitted email", async () => {
      const result = await emailService.sendRequirementSubmittedEmail(
        mockRecipient,
        "Test Requirement",
        "req-123"
      );
      expect(result.success).toBe(true);
    });
  });

  describe("sendMilestoneEmail", () => {
    const mockRecipient: EmailRecipient = {
      email: "user@example.com",
      name: "User",
    };

    it("should send milestone email", async () => {
      const result = await emailService.sendMilestoneEmail(
        mockRecipient,
        "First Requirement",
        "milestone-1",
        "completed"
      );
      expect(result.success).toBe(true);
    });
  });

  describe("sendWeeklyDigest", () => {
    const mockRecipient: EmailRecipient = {
      email: "user@example.com",
      name: "User",
    };

    it("should send weekly digest email", async () => {
      const result = await emailService.sendWeeklyDigest(mockRecipient, [
        { name: "Cluster 1", growth: 10, requirements: 5 },
        { name: "Cluster 2", growth: -5, requirements: 3 },
      ]);
      expect(result.success).toBe(true);
    });
  });
});
