# Auto-Compact Mechanism for Claude Code

## Overview

This document describes how to implement an auto-compact mechanism for Claude Code to automatically trigger `/compact` when hitting context window limits.

## The Problem

Claude Code has a context window limit (typically 128K tokens for Claude 3.5 Sonnet). When conversations exceed this limit, performance degrades or the model may fail. The `/compact` command compresses conversation history but must be triggered manually.

## Solution: Auto-Compact Implementation

### 1. Basic Principle

Monitor conversation length and automatically trigger `/compact` when approaching context limits.

### 2. Detection Methods

#### Token Estimation

```javascript
// Simple token estimation (approx 4 chars = 1 token)
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// Monitor conversation
function monitorConversation(conversation) {
  const totalTokens = conversation.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);

  const contextLimit = 128000; // Claude 3.5 Sonnet limit
  const warningThreshold = 0.8; // 80% usage
  const compactThreshold = 0.9; // 90% usage

  const usagePercentage = totalTokens / contextLimit;

  return {
    totalTokens,
    usagePercentage,
    shouldWarn: usagePercentage >= warningThreshold,
    shouldCompact: usagePercentage >= compactThreshold,
  };
}
```

#### Message Counting

```javascript
// Track by message count
const MAX_MESSAGES = 50; // Adjust based on average message size
const WARNING_MESSAGES = 40;

function checkMessageCount(messages) {
  return {
    count: messages.length,
    shouldWarn: messages.length >= WARNING_MESSAGES,
    shouldCompact: messages.length >= MAX_MESSAGES,
  };
}
```

### 3. Implementation Approaches

#### Option A: Hook-Based (If Claude Code supports hooks)

```typescript
// Extend Claude Code hook system
interface CompactHook {
  onContextLimitApproaching: () => void;
  onContextLimitReached: () => void;
  autoCompact: (strategy: CompactStrategy) => Promise<void>;
}

// Example hook implementation
class AutoCompactHook implements CompactHook {
  async onContextLimitApproaching() {
    console.warn("Context limit approaching. Consider using /compact");
  }

  async onContextLimitReached() {
    console.error("Context limit reached! Auto-compacting...");
    await this.autoCompact("summarize_oldest");
  }

  async autoCompact(strategy: CompactStrategy) {
    // Implementation depends on Claude Code API
    // This would trigger /compact command
  }
}
```

#### Option B: Manual Monitoring Script

```bash
#!/bin/bash
# auto-compact-monitor.sh
# Run this periodically to check and trigger compact

# Configuration
CONTEXT_LIMIT=128000
WARNING_THRESHOLD=0.8
COMPACT_THRESHOLD=0.9
CHECK_INTERVAL=60 # seconds

while true; do
  # Estimate current context usage (this is a placeholder)
  # You would need to implement actual context monitoring
  CURRENT_USAGE=$(estimate_current_context_usage)

  if (( $(echo "$CURRENT_USAGE >= $COMPACT_THRESHOLD" | bc -l) )); then
    echo "Context limit reached! Triggering /compact..."
    # Trigger compact command
    # This depends on how Claude Code accepts commands
    trigger_compact_command
  elif (( $(echo "$CURRENT_USAGE >= $WARNING_THRESHOLD" | bc -l) )); then
    echo "Warning: Context usage at ${CURRENT_USAGE}%"
  fi

  sleep $CHECK_INTERVAL
done
```

#### Option C: Browser Extension (For Web Interface)

```javascript
// Content script for Claude Code web interface
class ContextMonitor {
  constructor() {
    this.observer = new MutationObserver(this.checkContext.bind(this));
    this.setupMonitoring();
  }

  setupMonitoring() {
    // Monitor conversation container
    const target = document.querySelector(".conversation-container");
    if (target) {
      this.observer.observe(target, { childList: true, subtree: true });
    }
  }

  checkContext() {
    const messages = document.querySelectorAll(".message-content");
    const totalLength = Array.from(messages).reduce((sum, msg) => sum + msg.textContent.length, 0);

    const estimatedTokens = totalLength / 4;
    const usage = estimatedTokens / 128000;

    if (usage > 0.9) {
      this.triggerCompact();
    } else if (usage > 0.8) {
      this.showWarning();
    }
  }

  triggerCompact() {
    // Find and click compact button or trigger command
    const compactBtn = document.querySelector('[aria-label="Compact"]');
    if (compactBtn) {
      compactBtn.click();
    } else {
      // Fallback: Type /compact in input
      const input = document.querySelector("textarea");
      if (input) {
        input.value = "/compact";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        // Trigger submit
        input.form?.submit();
      }
    }
  }

  showWarning() {
    // Show warning notification
    const warning = document.createElement("div");
    warning.className = "context-warning";
    warning.textContent = "⚠️ Context usage high. Consider using /compact";
    document.body.appendChild(warning);

    setTimeout(() => warning.remove(), 5000);
  }
}

// Initialize when page loads
if (window.location.href.includes("claude.ai")) {
  new ContextMonitor();
}
```

### 4. Configuration File

Create `.claude/auto-compact.json`:

```json
{
  "enabled": true,
  "thresholds": {
    "warning": 0.75,
    "compact": 0.85,
    "critical": 0.95
  },
  "strategies": {
    "default": "summarize_oldest",
    "options": ["summarize_oldest", "remove_oldest", "compress_all"]
  },
  "preservation": {
    "keepImportant": true,
    "importantKeywords": ["requirement", "instruction", "spec", "todo"],
    "maxPreserved": 10
  },
  "monitoring": {
    "interval": 30,
    "method": "token_estimation",
    "verbose": false
  }
}
```

### 5. Integration with Existing Claude Code Hooks

If your project has Claude Code hooks (like DemandPulse), extend them:

```typescript
// types/claude-code.ts
export type HookEvent =
  | "conversation_start"
  | "message_sent"
  | "message_received"
  | "conversation_end"
  | "code_generated"
  | "requirement_detected"
  | "context_limit_approaching" // New
  | "context_limit_reached" // New
  | "auto_compact_triggered"; // New

// Extend hook handler
export class ExtendedHookHandler extends HookHandler {
  private contextMonitor: ContextMonitor;

  constructor() {
    super();
    this.contextMonitor = new ContextMonitor();
    this.setupContextMonitoring();
  }

  private setupContextMonitoring() {
    // Monitor after each message
    this.on("message_received", () => {
      const status = this.contextMonitor.checkStatus();

      if (status.shouldCompact) {
        this.trigger("context_limit_reached");
        this.executeCompact();
      } else if (status.shouldWarn) {
        this.trigger("context_limit_approaching");
      }
    });
  }

  private async executeCompact() {
    this.trigger("auto_compact_triggered");

    // Implementation depends on Claude Code API
    // This might involve:
    // 1. Sending /compact command
    // 2. Using internal API
    // 3. Modifying conversation state
  }
}
```

### 6. Practical Implementation Steps

1. **Estimate Your Workload**: Determine typical conversation lengths
2. **Set Thresholds**: Start with 80% warning, 90% auto-compact
3. **Choose Strategy**:
   - `summarize_oldest`: Keep summaries of old messages
   - `remove_oldest`: Remove oldest messages first
   - `compress_all`: Apply compression to entire history
4. **Test Gradually**: Start with warnings only, then enable auto-compact
5. **Monitor Results**: Check if important context is preserved

### 7. Manual Compact Triggers

Even with auto-compact, provide manual controls:

```bash
# Manual compact trigger
/claude compact --strategy=summarize_oldest --preserve=10

# Check context status
/claude context-status

# Set custom thresholds
/claude set-compact-threshold --warning=0.8 --compact=0.9
```

### 8. Limitations and Considerations

1. **Token Estimation**: Approximate, not exact
2. **Important Context**: Risk of losing critical instructions
3. **Performance Impact**: Monitoring adds overhead
4. **False Positives**: May trigger unnecessarily
5. **API Limitations**: Depends on Claude Code's exposed APIs

### 9. Recommended Default Configuration

```json
{
  "autoCompact": {
    "enabled": true,
    "warningThreshold": 0.75,
    "compactThreshold": 0.85,
    "strategy": "summarize_oldest",
    "preserveLast": 10,
    "checkInterval": 30,
    "notifyUser": true
  }
}
```

### 10. Testing the Implementation

1. **Simulate Long Conversations**: Create test conversations
2. **Verify Thresholds**: Ensure triggers work at correct levels
3. **Check Context Preservation**: Important info shouldn't be lost
4. **Monitor Performance**: Ensure no significant slowdown
5. **User Feedback**: Allow users to disable/reconfigure

## Conclusion

Implementing auto-compact requires careful consideration of context preservation and user experience. Start with conservative thresholds and monitor the results. The exact implementation will depend on Claude Code's available APIs and hooks.

**Note**: As of now, Claude Code may not expose all necessary APIs for full auto-compact implementation. Consider this a framework for when such APIs become available or for manual context management.
