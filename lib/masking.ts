/**
 * Data Masking Utilities
 *
 * Provides functions to mask sensitive data for display in admin views
 * while maintaining data structure for processing.
 */

/**
 * Mask email address - shows only first part and domain
 * @param email Email address to mask
 * @returns Masked email (e.g., "j*****@example.com")
 */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "*****@*****";

  // Keep first character, mask the rest of local part
  const maskedLocal = localPart.charAt(0) + "*".repeat(Math.min(localPart.length - 1, 5));
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask requirement text - shows only beginning and end with ellipsis
 * @param text Text to mask
 * @param visibleChars Number of characters to show at start and end
 * @returns Masked text
 */
export function maskRequirementText(text: string, visibleChars: number = 20): string {
  if (!text) return "";
  if (text.length <= visibleChars * 2) {
    // For short text, mask all but first and last character
    const firstChar = text.charAt(0);
    const lastChar = text.charAt(text.length - 1);
    return `${firstChar}${"*".repeat(text.length - 2)}${lastChar}`;
  }

  const start = text.substring(0, visibleChars);
  const end = text.substring(text.length - visibleChars);
  return `${start}...${end}`;
}

/**
 * Mask UUID - shows only first and last segments
 * @param uuid UUID to mask
 * @returns Masked UUID (e.g., "550e8400-...-446655440000")
 */
export function maskUUID(uuid: string): string {
  if (!uuid) return "********-****-****-****-***********";
  const parts = uuid.split("-");
  if (parts.length !== 5) return "********-****-****-****-***********";

  return `${parts[0]}-****-****-****-${parts[4]}`;
}

/**
 * Mask workspace path - hides user-specific directories
 * @param path Workspace path to mask
 * @returns Masked path
 */
export function maskWorkspacePath(path: string | null | undefined): string | null {
  if (!path) return null;

  // Replace home directory with ~
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  if (homeDir && path.startsWith(homeDir)) {
    path = "~" + path.substring(homeDir.length);
  }

  // Mask intermediate directories
  const parts = path.split("/");
  if (parts.length <= 3) return path;

  // Show first and last directory, mask middle ones
  const maskedParts = parts.map((part, index) => {
    if (index === 0 || index === parts.length - 1) return part;
    return "*".repeat(Math.min(part.length, 3));
  });

  return maskedParts.join("/");
}

/**
 * Mask conversation ID - similar to UUID masking
 * @param conversationId Conversation ID to mask
 * @returns Masked ID
 */
export function maskConversationId(conversationId: string): string {
  if (!conversationId) return "********";
  if (conversationId.length <= 8) {
    return "*".repeat(conversationId.length);
  }

  const visibleChars = Math.min(4, Math.floor(conversationId.length / 4));
  const start = conversationId.substring(0, visibleChars);
  const end = conversationId.substring(conversationId.length - visibleChars);
  return `${start}...${end}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

/**
 * Masking options interface
 */
interface MaskOptions {
  maskEmail?: boolean;
  maskRequirementText?: boolean;
  maskWorkspacePath?: boolean;
  maskConversationId?: boolean;
  maskUUID?: boolean;
}

/**
 * Apply masking to a requirement object for admin display
 * @param requirement Requirement object (potentially with sensitive fields)
 * @param options Masking options
 * @returns Requirement object with masked fields
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function maskRequirementForAdmin<T extends AnyRecord>(
  requirement: T,
  options: MaskOptions = {}
): T {
  const {
    maskEmail: doMaskEmail = true,
    maskRequirementText: doMaskRequirementText = false,
    maskWorkspacePath: doMaskWorkspacePath = true,
    maskConversationId: doMaskConversationId = true,
    maskUUID: doMaskUUID = true,
  } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const masked: any = { ...requirement };

  // Mask userProvidedEmail if present
  if (doMaskEmail && masked.consent?.userProvidedEmail) {
    masked.consent.userProvidedEmail = maskEmail(masked.consent.userProvidedEmail);
  }

  // Mask workspace path in context
  if (doMaskWorkspacePath && masked.context?.workspacePath) {
    masked.context.workspacePath = maskRequirementText(masked.context.workspacePath, 20);
  }

  // Mask conversation ID
  if (doMaskConversationId && masked.context?.conversationId) {
    masked.context.conversationId = maskUUID(masked.context.conversationId);
  }

  // Mask requirement IDs
  if (doMaskUUID) {
    if (masked.id) masked.id = maskUUID(masked.id);
    if (masked.requirementId) masked.requirementId = maskUUID(masked.requirementId);
    if (masked.clusterId) masked.clusterId = maskUUID(masked.clusterId);
  }

  // Mask requirement text if requested
  if (doMaskRequirementText) {
    if (masked.originalRequirement) {
      masked.originalRequirement = maskRequirementText(masked.originalRequirement);
    }
    if (masked.summarizedRequirement) {
      masked.summarizedRequirement = maskRequirementText(masked.summarizedRequirement, 10);
    }
  }

  return masked;
}

/**
 * Apply masking to an array of requirements for admin display
 */
export function maskRequirementsForAdmin<T extends AnyRecord>(
  requirements: T[],
  options?: MaskOptions
): T[] {
  return requirements.map((req) => maskRequirementForAdmin(req, options));
}

/**
 * Check if user has permission to view unmasked data
 * Based on user role and context
 */
export function canViewUnmaskedData(
  userRole?: string,
  context?: "admin" | "analyst" | "viewer"
): boolean {
  // Admin users can see unmasked data in admin context
  if (userRole === "admin" && context === "admin") return true;

  // In production, apply stricter rules
  if (process.env.NODE_ENV === "production") {
    return userRole === "admin" && context === "admin";
  }

  // In development, be more permissive
  return userRole === "admin" || userRole === "analyst";
}
