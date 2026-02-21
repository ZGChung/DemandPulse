// Email notification service for DemandPulse
// Supports Resend for real emails with mock fallback

import { Resend } from "resend";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface EmailRecipient {
  email: string;
  name?: string;
  userId?: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
  htmlBody?: string;
}

export interface EmailOptions {
  to: EmailRecipient;
  template: EmailTemplate;
  metadata?: {
    requirementId?: string;
    clusterId?: string;
    milestone?: string;
    digest?: string;
  };
}

export class EmailService {
  private enabled: boolean;
  private useMock: boolean;
  private resendClient: Resend | null;
  private fromEmail: string;

  constructor(config?: {
    enabled?: boolean;
    useMock?: boolean;
    resendApiKey?: string;
    fromEmail?: string;
  }) {
    this.enabled = config?.enabled ?? true;
    this.useMock = config?.useMock ?? true;

    // Initialize Resend client if API key is provided
    if (config?.resendApiKey) {
      this.resendClient = new Resend(config.resendApiKey);
    } else {
      this.resendClient = null;
    }

    this.fromEmail = config?.fromEmail ?? "notifications@demandpulse.dev";
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    if (!this.enabled) {
      console.log(
        "[EmailService] Email service disabled, skipping send:",
        options.template.subject
      );
      return { success: false };
    }

    if (this.useMock) {
      return this.sendMockEmail(options);
    }

    // Try to send real email if Resend client is available
    if (this.resendClient) {
      return this.sendRealEmail(options);
    }

    console.warn("[EmailService] Real email provider not configured, using mock");
    return this.sendMockEmail(options);
  }

  private async sendMockEmail(
    options: EmailOptions
  ): Promise<{ success: boolean; messageId?: string }> {
    const messageId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[EmailService] Mock email sent:
  To: ${options.to.email}${options.to.name ? ` (${options.to.name})` : ""}
  Subject: ${options.template.subject}
  Body: ${options.template.body.substring(0, 100)}...
  Metadata: ${JSON.stringify(options.metadata || {})}
  Message ID: ${messageId}
    `);

    // Simulate async sending
    await new Promise((resolve) => setTimeout(resolve, 100));

    return { success: true, messageId };
  }

  private async sendRealEmail(
    options: EmailOptions
  ): Promise<{ success: boolean; messageId?: string }> {
    if (!this.resendClient) {
      console.error("[EmailService] Resend client not initialized");
      return { success: false };
    }

    try {
      const response = await this.resendClient.emails.send({
        from: this.fromEmail,
        to: options.to.email,
        subject: options.template.subject,
        text: options.template.body,
        html: options.template.htmlBody || options.template.body,
        ...(options.to.name && { reply_to: options.to.name }),
      });

      if (response.error) {
        console.error("[EmailService] Resend error:", response.error);
        return { success: false };
      }

      console.log(`[EmailService] Real email sent:
  To: ${options.to.email}${options.to.name ? ` (${options.to.name})` : ""}
  Subject: ${options.template.subject}
  Message ID: ${response.data?.id || "unknown"}
      `);

      return { success: true, messageId: response.data?.id };
    } catch (error) {
      console.error("[EmailService] Failed to send email:", error);
      return { success: false };
    }
  }

  // Email templates
  static templates = {
    welcome: (name?: string): EmailTemplate => ({
      subject: `Welcome to DemandPulse${name ? `, ${name}` : ""}!`,
      body: `Welcome to DemandPulse!

Thank you for joining our community of developers tracking emerging trends.

With DemandPulse, you can:
- Discover what other developers are building
- See real-time trends in developer requirements
- Contribute your own requirements to help the community
- Get alerts when similar needs are detected

Get started by exploring the dashboard or installing our Claude Code plugin.

Best,
The DemandPulse Team`,
      htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h1 style="color: #2563eb;">Welcome to DemandPulse${name ? `, ${name}` : ""}!</h1>
        <p>Thank you for joining our community of developers tracking emerging trends.</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #111827; margin-top: 0;">With DemandPulse, you can:</h3>
          <ul style="color: #4b5563;">
            <li>Discover what other developers are building</li>
            <li>See real-time trends in developer requirements</li>
            <li>Contribute your own requirements to help the community</li>
            <li>Get alerts when similar needs are detected</li>
          </ul>
        </div>

        <p>Get started by exploring the dashboard or installing our Claude Code plugin.</p>

        <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          Best,<br>
          The DemandPulse Team
        </p>
      </div>`,
    }),

    requirementSubmitted: (requirementSummary: string): EmailTemplate => ({
      subject: "Your requirement has been submitted",
      body: `Thank you for submitting your requirement to DemandPulse!

Requirement: "${requirementSummary}"

We've received your submission and will process it shortly. You'll be notified when we find similar requirements from other developers.

View your submissions in your dashboard.

Best,
The DemandPulse Team`,
    }),

    similarRequirementFound: (
      requirementSummary: string,
      count: number,
      clusterName?: string
    ): EmailTemplate => ({
      subject: `Similar requirement detected (${count} ${count === 1 ? "match" : "matches"})`,
      body: `We found similar requirements to yours!

Your requirement: "${requirementSummary}"
${clusterName ? `Cluster: ${clusterName}\n` : ""}
Number of similar requirements: ${count}

This suggests other developers are working on similar challenges. You can explore this trend in your dashboard to see details and connect with the community.

Best,
The DemandPulse Team`,
    }),

    milestoneAchieved: (milestone: string, contributionCount: number): EmailTemplate => ({
      subject: `Milestone achieved: ${milestone}`,
      body: `Congratulations! You've reached the ${milestone} milestone on DemandPulse.

You've contributed ${contributionCount} requirements to the community. Thank you for helping developers everywhere understand emerging needs!

Keep sharing requirements to unlock more achievements and help build the most comprehensive dataset of developer needs.

Best,
The DemandPulse Team`,
    }),

    adminNewRequirement: (summary: string, submitterEmail?: string | null): EmailTemplate => ({
      subject: "[DemandPulse] New requirement submitted",
      body: `A new requirement was submitted to DemandPulse.\n\nSummary: "${summary}"${submitterEmail ? `\nSubmitted by: ${submitterEmail}` : ""}\n\nView in Admin: Requirements.`,
      htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2563eb;">New requirement submitted</h2>
        <p><strong>Summary:</strong> ${escapeHtml(summary)}</p>
        ${submitterEmail ? `<p><strong>Submitted by:</strong> ${escapeHtml(submitterEmail)}</p>` : ""}
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://demandpulse.app"}/admin/requirements">View in Admin → Requirements</a></p>
      </div>`,
    }),

    weeklyDigest: (
      trends: Array<{ name: string; growth: number; requirements: number }>
    ): EmailTemplate => {
      const lines = trends.map(
        (t, i) =>
          `${i + 1}. ${t.name}: ${t.requirements} requirements${t.growth !== 0 ? ` (${t.growth > 0 ? "+" : ""}${t.growth}% growth)` : ""}`
      );
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://demandpulse.app";
      return {
        subject: "Your weekly DemandPulse digest",
        body: `Here are the top trends from this week:\n\n${lines.join("\n")}\n\nExplore these trends in detail on your dashboard.\n\nBest,\nThe DemandPulse Team`,
        htmlBody: `<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">Your weekly DemandPulse digest</h1>
  <p>Here are the top trends from the community this week.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    ${trends
      .map(
        (t, i) =>
          `<tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 10px 0;">${i + 1}. <strong>${escapeHtml(t.name)}</strong></td><td style="text-align: right; padding: 10px 0;">${t.requirements} requirements${t.growth !== 0 ? ` <span style="color: ${t.growth > 0 ? "#059669" : "#dc2626"};">(${t.growth > 0 ? "+" : ""}${t.growth}%)</span>` : ""}</td></tr>`
      )
      .join("")}
  </table>
  <p><a href="${appUrl}/trends" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View trends</a></p>
  <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px;">Best,<br>The DemandPulse Team</p>
</body></html>`,
      };
    },
  };

  // Convenience methods
  async sendWelcomeEmail(to: EmailRecipient): Promise<{ success: boolean; messageId?: string }> {
    return this.sendEmail({
      to,
      template: EmailService.templates.welcome(to.name),
      metadata: { milestone: "welcome" },
    });
  }

  async sendRequirementSubmittedEmail(
    to: EmailRecipient,
    requirementSummary: string
  ): Promise<{ success: boolean; messageId?: string }> {
    return this.sendEmail({
      to,
      template: EmailService.templates.requirementSubmitted(requirementSummary),
      metadata: { requirementId: "submitted" },
    });
  }

  async sendSimilarRequirementEmail(
    to: EmailRecipient,
    requirementSummary: string,
    count: number,
    clusterName?: string
  ): Promise<{ success: boolean; messageId?: string }> {
    return this.sendEmail({
      to,
      template: EmailService.templates.similarRequirementFound(
        requirementSummary,
        count,
        clusterName
      ),
      metadata: { clusterId: clusterName },
    });
  }

  async sendMilestoneEmail(
    to: EmailRecipient,
    milestone: string,
    contributionCount: number
  ): Promise<{ success: boolean; messageId?: string }> {
    return this.sendEmail({
      to,
      template: EmailService.templates.milestoneAchieved(milestone, contributionCount),
      metadata: { milestone },
    });
  }

  async sendWeeklyDigest(
    to: EmailRecipient,
    trends: Array<{ name: string; growth: number; requirements: number }>
  ): Promise<{ success: boolean; messageId?: string }> {
    return this.sendEmail({
      to,
      template: EmailService.templates.weeklyDigest(trends),
      metadata: { digest: "weekly" },
    });
  }

  /** Send a notification to multiple admin recipients (e.g. new requirement). */
  async sendAdminNotification(
    admins: EmailRecipient[],
    template: EmailTemplate
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;
    for (const to of admins) {
      if (!to.email) continue;
      const result = await this.sendEmail({ to, template, metadata: {} });
      if (result.success) sent++;
      else failed++;
    }
    return { sent, failed };
  }

  // Configuration
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`[EmailService] Email service ${enabled ? "enabled" : "disabled"}`);
  }

  setUseMock(useMock: boolean): void {
    this.useMock = useMock;
    console.log(`[EmailService] Using ${useMock ? "mock" : "real"} email provider`);
  }

  getStatus(): { enabled: boolean; useMock: boolean } {
    return {
      enabled: this.enabled,
      useMock: this.useMock,
    };
  }
}

// Singleton instance
export const emailService = new EmailService({
  enabled: process.env.EMAIL_ENABLED === "true",
  useMock: process.env.EMAIL_USE_MOCK === "true",
  resendApiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.RESEND_FROM_EMAIL || "notifications@demandpulse.dev",
});
