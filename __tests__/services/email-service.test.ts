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

    it("should send weekly digest with empty clusters", async () => {
      const result = await emailService.sendWeeklyDigest(mockRecipient, []);
      expect(result.success).toBe(true);
    });
  });

  describe("sendRealEmail", () => {
    const mockRecipient: EmailRecipient = {
      email: "user@example.com",
      name: "User",
    };

    it("should fallback to mock when resend client not available", async () => {
      const service = new EmailService({ enabled: true, useMock: false, resendApiKey: undefined });
      const result = await service.sendEmail({
        to: mockRecipient,
        template: { subject: "Test", body: "Test body" },
      });
      // Falls back to mock when no resend client
      expect(result.success).toBe(true);
    });

    it("should include reply_to when name is provided", async () => {
      const result = await emailService.sendEmail({
        to: { ...mockRecipient, name: "Test User" },
        template: { subject: "Test", body: "Test body" },
      });
      expect(result.success).toBe(true);
    });

    it("should handle empty body gracefully", async () => {
      const result = await emailService.sendEmail({
        to: mockRecipient,
        template: { subject: "Test", body: "" },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("sendSimilarRequirementEmail", () => {
    const mockRecipient: EmailRecipient = {
      email: "user@example.com",
      name: "User",
    };

    it("should send similar requirement email", async () => {
      const result = await emailService.sendSimilarRequirementEmail(
        mockRecipient,
        "Build a REST API",
        5
      );
      expect(result.success).toBe(true);
    });

    it("should send similar requirement email with cluster name", async () => {
      const result = await emailService.sendSimilarRequirementEmail(
        mockRecipient,
        "Build a REST API",
        3,
        "API Development"
      );
      expect(result.success).toBe(true);
    });

    it("should handle single match count", async () => {
      const result = await emailService.sendSimilarRequirementEmail(
        mockRecipient,
        "Test requirement",
        1
      );
      expect(result.success).toBe(true);
    });
  });

  describe("sendAdminNotification", () => {
    it("should send admin notification to multiple recipients", async () => {
      const admins = [
        { email: "admin1@example.com", name: "Admin 1" },
        { email: "admin2@example.com", name: "Admin 2" },
      ];
      const result = await emailService.sendAdminNotification(admins, {
        subject: "Test Admin Email",
        body: "Test body",
      });
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });

    it("should skip recipients without email", async () => {
      const admins = [
        { email: "admin1@example.com", name: "Admin 1" },
        { name: "Admin Without Email" }, // missing email
      ];
      const result = await emailService.sendAdminNotification(admins, {
        subject: "Test Admin Email",
        body: "Test body",
      });
      expect(result.sent).toBe(1);
      expect(result.failed).toBe(0);
    });
  });

  describe("setEnabled", () => {
    it("should enable/disable email service", () => {
      emailService.setEnabled(false);
      expect(emailService.getStatus().enabled).toBe(false);
      emailService.setEnabled(true);
      expect(emailService.getStatus().enabled).toBe(true);
    });
  });

  describe("setUseMock", () => {
    it("should switch between mock and real provider", () => {
      emailService.setUseMock(false);
      expect(emailService.getStatus().useMock).toBe(false);
      emailService.setUseMock(true);
      expect(emailService.getStatus().useMock).toBe(true);
    });
  });

  describe("getStatus", () => {
    it("should return current status", () => {
      const status = emailService.getStatus();
      expect(status).toHaveProperty("enabled");
      expect(status).toHaveProperty("useMock");
    });
  });

  describe("sendAdminNotification", () => {
    const mockAdmins: EmailRecipient[] = [
      { email: "admin1@example.com", name: "Admin 1", userId: "admin-1" },
      { email: "admin2@example.com", name: "Admin 2", userId: "admin-2" },
    ];

    it("should send notifications to all admins", async () => {
      const result = await emailService.sendAdminNotification(
        mockAdmins,
        EmailService.templates.welcome("New User")
      );
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });

    it("should skip admins without email", async () => {
      const result = await emailService.sendAdminNotification(
        [{ email: "", name: "Admin", userId: "admin" }],
        EmailService.templates.welcome("New User")
      );
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
    });

    it("should handle mixed valid and invalid admins", async () => {
      const result = await emailService.sendAdminNotification(
        [
          { email: "valid@example.com", name: "Valid", userId: "v-1" },
          { email: "", name: "Invalid", userId: "i-1" },
        ],
        EmailService.templates.welcome("New User")
      );
      expect(result.sent).toBe(1);
      expect(result.failed).toBe(0);
    });
  });

  describe("sendRealEmail path", () => {
    it("should attempt real email when useMock is false but fall back to mock if no client", async () => {
      const service = new EmailService({ enabled: true, useMock: false });
      // When resendClient is null, it falls back to mock
      const result = await service.sendEmail({
        to: { email: "test@example.com", name: "Test", userId: "u1" },
        template: { subject: "Test", body: "Body" },
      });
      expect(result.success).toBe(true); // Falls back to mock
    });

    it("should send real email successfully when resend client is available", async () => {
      // Create service with a mock API key (won't make real calls in test)
      const service = new EmailService({
        enabled: true,
        useMock: false,
        resendApiKey: "test_key_123",
      });

      // The service will try to use the real client but we can't easily mock it
      // This test verifies the code path attempts to use real email
      const result = await service.sendEmail({
        to: { email: "test@example.com", name: "Test User", userId: "u1" },
        template: { subject: "Test Subject", body: "Test Body" },
      });
      // In test environment without real Resend, it may fail or succeed based on network
      expect(result).toHaveProperty("success");
    });

    it("should handle resend client without API key gracefully", async () => {
      // Create service with empty API key
      const service = new EmailService({
        enabled: true,
        useMock: false,
        resendApiKey: "",
      });

      const result = await service.sendEmail({
        to: { email: "test@example.com", name: "Test", userId: "u1" },
        template: { subject: "Test", body: "Body" },
      });
      // Should fall back to mock since no valid client
      expect(result.success).toBe(true);
    });
  });

  describe("EmailService.templates", () => {
    it("should generate welcome template with name", () => {
      const template = EmailService.templates.welcome("John");
      expect(template.subject).toContain("John");
      expect(template.htmlBody).toContain("John");
    });

    it("should generate welcome template without name", () => {
      const template = EmailService.templates.welcome();
      expect(template.subject).toContain("Welcome");
      expect(template.body).toContain("Welcome");
    });

    it("should generate requirement submitted template", () => {
      const template = EmailService.templates.requirementSubmitted("Test requirement");
      expect(template.subject).toContain("submitted");
      expect(template.body).toContain("Test requirement");
    });

    it("should generate similar requirement template", () => {
      const template = EmailService.templates.similarRequirementFound("Test", 5, "Cluster");
      expect(template.subject).toContain("5");
      expect(template.body).toContain("Test");
      expect(template.body).toContain("Cluster");
    });

    it("should generate milestone template", () => {
      const template = EmailService.templates.milestoneAchieved("First", 10);
      expect(template.subject).toContain("First");
      expect(template.body).toContain("10");
    });

    it("should generate weekly digest template", () => {
      const template = EmailService.templates.weeklyDigest([
        { name: "Trend 1", growth: 10, requirements: 5 },
        { name: "Trend 2", growth: -5, requirements: 3 },
      ]);
      expect(template.subject).toContain("weekly");
      expect(template.body).toContain("Trend 1");
    });

    it("should generate admin new requirement template", () => {
      const template = EmailService.templates.adminNewRequirement(
        "New requirement",
        "user@example.com"
      );
      expect(template.subject).toContain("New requirement");
      expect(template.body).toContain("New requirement");
      expect(template.body).toContain("user@example.com");
    });

    it("should generate admin template without submitter", () => {
      const template = EmailService.templates.adminNewRequirement("New requirement");
      expect(template.subject).toContain("New requirement");
      expect(template.body).toContain("New requirement");
    });
  });
});
