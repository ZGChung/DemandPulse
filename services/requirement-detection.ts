import { RequirementDetection, HookEvent } from '@/types/claude-code'

export class RequirementDetectionService {
  private detectionKeywords = [
    'build', 'create', 'make', 'develop', 'implement',
    'feature', 'tool', 'script', 'automation', 'workflow', 'automates',
    'need', 'want', 'require', 'looking for', 'wish',
    'problem', 'issue', 'pain point', 'challenge',
    'would be great', 'should have', 'missing', 'add', 'fix'
  ]

  private intentPatterns = {
    feature_request: /\b(feature|functionality|capability)\b/i,
    bug_fix: /\b(bug|fix|error|issue|problem)\b/i,
    improvement: /\b(improve|better|enhance|optimize|refactor)\b/i,
    new_tool: /\b(tool|script|automation|workflow|pipeline)\b/i,
  }

  detectRequirement(text: string, context: any): RequirementDetection | null {
    // Check if text contains requirement-like language
    const hasRequirementKeywords = this.detectionKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    )

    if (!hasRequirementKeywords) {
      return null
    }

    // Calculate confidence based on various factors
    const confidence = this.calculateConfidence(text)
    
    if (confidence < 0.3) { // Threshold for detection
      return null
    }

    // Determine intent
    const intent = this.determineIntent(text)

    return {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      context: {
        conversationId: context.conversationId || 'unknown',
        userId: context.userId,
        workspacePath: context.workspacePath,
        timestamp: new Date(),
      },
      requirementText: text,
      detectedAt: new Date(),
      confidence,
      metadata: {
        conversationLength: context.conversationLength || 0,
        keywords: this.extractKeywords(text),
        intent,
      },
    }
  }

  private calculateConfidence(text: string): number {
    let confidence = 0

    // Keyword density
    const keywordMatches = this.detectionKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    ).length
    
    confidence += Math.min(keywordMatches * 0.1, 0.3)

    // Sentence structure indicators
    if (text.includes('I need') || text.includes('I want') || text.includes('I wish')) {
      confidence += 0.2
    }

    if (text.includes('would be great') || text.includes('should have')) {
      confidence += 0.15
    }

    // Question marks often indicate requirements
    if (text.includes('?')) {
      confidence += 0.1
    }

    // Length consideration (very short texts are less likely to be requirements)
    const wordCount = text.split(/\s+/).length
    if (wordCount >= 10 && wordCount <= 100) {
      confidence += 0.1
    } else if (wordCount > 100) {
      confidence += 0.05
    }

    return Math.min(confidence, 1.0)
  }

  private determineIntent(text: string): RequirementDetection['metadata']['intent'] {
    const lowerText = text.toLowerCase()

    for (const [intent, pattern] of Object.entries(this.intentPatterns)) {
      if (pattern.test(lowerText)) {
        return intent as RequirementDetection['metadata']['intent']
      }
    }

    return 'other'
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/)
    const keywords: string[] = []

    for (const keyword of this.detectionKeywords) {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        keywords.push(keyword)
      }
    }

    // Add some context-specific keywords
    const techKeywords = ['api', 'database', 'ui', 'ux', 'backend', 'frontend', 'mobile', 'web']
    for (const techKeyword of techKeywords) {
      if (text.toLowerCase().includes(techKeyword)) {
        keywords.push(techKeyword)
      }
    }

    return [...new Set(keywords)] // Remove duplicates
  }

  summarizeRequirement(text: string): string {
    // Simple summarization - in production, this would use AI
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    if (sentences.length === 0) return text.trim()
    
    // Take the first sentence as summary, limit length
    const firstSentence = sentences[0].trim()
    if (firstSentence.length <= 200) {
      return firstSentence
    }
    
    // If first sentence is too long, truncate
    return firstSentence.substring(0, 197) + '...'
  }
}