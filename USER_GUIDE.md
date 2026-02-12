# DemandPulse User Guide

Welcome to DemandPulse, the real-time demand radar for AI-native developers. This guide will help you get started with using DemandPulse to collect, analyze, and act on development requirements from your conversations.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Dashboard Overview](#dashboard-overview)
3. [Submitting Requirements](#submitting-requirements)
4. [Claude Code Plugin](#claude-code-plugin)
5. [Understanding Trends](#understanding-trends)
6. [Privacy and Data Management](#privacy-and-data-management)
7. [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/demandpulse.git
cd demandpulse

# Install dependencies
npm install

# Set up database
npm run db:push
npm run db:seed

# Start the development server
npm run dev
```

### 2. First Visit
1. Open `http://localhost:3000` in your browser
2. Sign in with GitHub (or use the demo mode)
3. You'll see the dashboard with sample data

### 3. Initial Configuration
- Set up your `.env.local` file (copy from `.env.example`)
- Configure email settings if needed (optional)
- Set `PLUGIN_API_KEY` if using Claude Code plugin

## Dashboard Overview

The DemandPulse dashboard is your central hub for understanding development trends.

### Main Sections

#### 1. **Header**
- **User Profile**: Your avatar and sign-out option
- **Navigation**: Links to Dashboard, Trends, and Settings
- **Statistics Overview**: Quick glance at total requirements and clusters

#### 2. **Trending Clusters**
Displays the most active requirement clusters based on recent submissions.

Each cluster card shows:
- **Cluster Name**: Thematic grouping of requirements
- **Popular Keywords**: Most common terms in this cluster
- **Requirement Count**: Number of requirements in this cluster
- **Trend Indicator**: Upward/downward arrow showing activity trend

#### 3. **Personal Insights**
Personalized recommendations based on your submission history:
- **Your Top Interests**: Clusters you frequently submit to
- **Recommendations**: Suggested actions based on trends
- **Recent Activity**: Your last 5 submissions

#### 4. **Recent Requirements**
A chronological list of recently submitted requirements with:
- **Requirement Text**: Summarized version
- **Status**: Pending, processed, or rejected
- **Submission Time**: When it was submitted
- **Cluster Assignment**: Which cluster it belongs to (if processed)

#### 5. **Quick Actions**
- **Submit New Requirement**: Manual submission form
- **View Trends**: Link to detailed trends page
- **Plugin Settings**: Configure Claude Code plugin

## Submitting Requirements

### Manual Submission
1. Click "Submit Requirement" in the dashboard or navigation
2. Fill in the requirement details:
   - **Original Requirement**: The full requirement text
   - **Summary**: Brief summary (auto-generated if empty)
   - **Context**: Optional conversation context
3. Set consent preferences:
   - **Data Collection**: Allow storing this requirement
   - **Contact**: Allow follow-up about this requirement
   - **Anonymization**: Remove personal information
4. Click "Submit"

### What Happens After Submission
1. **Immediate**: Requirement appears in "Recent Requirements"
2. **Processing** (within minutes):
   - AI analysis for keywords and categorization
   - Vector embedding generation for clustering
   - Assignment to existing or new cluster
3. **Result**: Requirement moves from "pending" to "processed"

### Submission Best Practices
1. **Be Specific**: "Add dark mode toggle to settings page" vs "Improve UI"
2. **Include Context**: Mention the problem you're trying to solve
3. **Use Natural Language**: Write as you would in a conversation
4. **One Idea Per Submission**: Submit multiple requirements separately

## Claude Code Plugin

The Claude Code plugin automatically detects requirements from your conversations with Claude.

### Installation

#### Option A: npm Installation (Recommended)
```bash
# Install globally
npm install -g claude-plugin-demandpulse

# Run installer
demandpulse-install
```

#### Option B: Manual Installation
1. Copy the `claude-plugin-demandpulse` directory to:
   - `~/.config/claude-code/plugins/demandpulse` (Linux/macOS)
   - `%APPDATA%/claude-code/plugins/demandpulse` (Windows)
2. Restart Claude Code

### Configuration

Set these environment variables in your Claude Code configuration:

```bash
# DemandPulse backend URL
export DEMANDPULSE_API_URL="http://localhost:3000"

# API key (must match PLUGIN_API_KEY in backend)
export DEMANDPULSE_API_KEY="your-secret-key"

# Enable auto-detection (default: false for privacy)
export ENABLE_AUTO_DETECTION="true"

# Consent settings
export DEFAULT_DATA_COLLECTION_CONSENT="true"
export DEFAULT_CONTACT_CONSENT="false"
export DEFAULT_ANONYMIZATION_CONSENT="true"
```

### Usage

#### Automatic Detection
When enabled, the plugin monitors conversations for requirement keywords:
- `need`, `want`, `should`, `must`, `require`
- `feature`, `bug`, `fix`, `improve`, `problem`
- `add`, `create`, `implement`, `build`, `develop`

When a potential requirement is detected:
1. Plugin checks consent settings
2. If consented, sends to DemandPulse backend
3. Logs action to stderr for transparency

#### Manual Submission Skill
Use the `/demandpulse:submit` skill to manually submit from any conversation:

```bash
# Submit current conversation context
/demandpulse:submit

# Submit specific text
/demandpulse:submit "We need to add error tracking to the API"
```

### Privacy Considerations
- **Auto-detection is disabled by default**: You must explicitly enable it
- **Data collection requires consent**: Configure via environment variables
- **Anonymization enabled by default**: Personal data is removed
- **Transparent operation**: All actions are logged for audit

## Understanding Trends

### Trends Page
Access via "Trends" in navigation to see:

#### 1. **Overall Statistics**
- **Total Requirements**: All submissions to date
- **Active Clusters**: Currently trending topics
- **Popular Keywords**: Most frequently used terms
- **Processing Rate**: How quickly requirements are analyzed

#### 2. **Cluster Details**
Click any cluster to see:
- **Cluster Description**: What this cluster represents
- **Top Requirements**: Most representative submissions
- **Keyword Cloud**: Visual representation of terms
- **Activity Timeline**: Submission frequency over time

#### 3. **Search and Filter**
- **Keyword Search**: Find requirements by term
- **Date Range**: Filter by submission time
- **Status Filter**: Show pending/processed/rejected
- **Cluster Filter**: Focus on specific clusters

### Interpreting Data

#### Cluster Metrics
- **Size**: Larger clusters indicate popular topics
- **Growth Rate**: Fast-growing clusters represent emerging trends
- **Keyword Diversity**: Variety of terms suggests broad interest
- **Recency**: Recent activity indicates current priorities

#### Actionable Insights
1. **Prioritize Development**: Focus on large, growing clusters
2. **Identify Gaps**: Small clusters might represent unmet needs
3. **Track Sentiment**: Requirements with urgency indicators (e.g., "must", "critical")
4. **Spot Patterns**: Recurring themes across different conversations

### Example Workflow
1. **Monday Morning**: Review trending clusters from past week
2. **Planning Session**: Use cluster data to prioritize backlog
3. **Development**: Monitor new submissions in relevant clusters
4. **Retrospective**: Compare predicted vs actual development trends

## Privacy and Data Management

### Your Data Rights
DemandPulse is built with privacy as a core principle:

#### 1. **Consent-Based Collection**
- No data is collected without explicit consent
- Consent can be granted per-submission or via defaults
- Consent preferences are stored with each requirement

#### 2. **Anonymization**
- Personal identifiers are removed by default
- Workspace paths and user IDs are optional
- Email addresses are only stored if provided with contact consent

#### 3. **Data Retention**
- Default retention: 365 days
- Configurable via environment variables
- Automated cleanup of expired data

#### 4. **Right to Deletion**
- Request deletion via settings page
- All related data is permanently removed
- Confirmation email sent upon completion

### Data Security
- **Encryption**: Sensitive fields are encrypted at rest
- **Access Control**: Role-based access to data
- **Audit Logs**: All data access is logged
- **Regular Backups**: Database backups (if configured)

### Compliance
- **GDPR**: Consent tracking and right to deletion
- **CCPA**: California Consumer Privacy Act support
- **Industry Standards**: Follows security best practices

## Troubleshooting

### Common Issues

#### 1. **Plugin Not Detecting Requirements**
- **Check**: `ENABLE_AUTO_DETECTION` is set to "true"
- **Verify**: Environment variables are loaded in Claude Code
- **Test**: Use `/demandpulse:submit` skill manually

#### 2. **Requirements Not Appearing in Dashboard**
- **Check**: Database connection is working
- **Verify**: User is signed in (for manual submissions)
- **Confirm**: API key matches between plugin and backend

#### 3. **Slow Processing**
- **Check**: AI processing is enabled (`ENABLE_AI_PROCESSING=true`)
- **Verify**: Database performance
- **Consider**: Reduce embedding dimensions if using vector clustering

#### 4. **Authentication Issues**
- **GitHub OAuth**: Ensure GitHub app is properly configured
- **API Keys**: Verify `PLUGIN_API_KEY` matches in both places
- **Sessions**: Clear browser cookies if experiencing login loops

### Getting Help

#### 1. **Check Logs**
```bash
# Backend logs
npm run dev  # View server logs

# Plugin logs
claude --plugin-dir ./claude-plugin-demandpulse 2>&1 | grep "DemandPulse"
```

#### 2. **Diagnostic Tools**
```bash
# Health check
curl http://localhost:3000/api/health

# Test plugin API
curl -H "x-api-key: your-key" http://localhost:3000/api/plugin/requirements?count=1
```

#### 3. **Community Support**
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check `README.md` and `API.md`
- **Email**: Contact support@demandpulse.dev

### Performance Tips

1. **Database Optimization**:
   - Use PostgreSQL for production (better performance than SQLite)
   - Add indexes for frequently queried fields
   - Regular maintenance (vacuum, analyze)

2. **AI Processing**:
   - Adjust embedding dimensions based on needs
   - Schedule clustering during off-peak hours
   - Cache frequently accessed embeddings

3. **Scalability**:
   - Use Redis for rate limiting in production
   - Consider CDN for static assets
   - Load balance if handling high traffic

## Next Steps

### Advanced Features to Explore
1. **Custom Clusters**: Create manual clusters for specific projects
2. **Team Collaboration**: Share clusters and insights with team members
3. **Integration Webhooks**: Get notified of new trends via Slack/Discord
4. **Export Data**: Download requirements as CSV for external analysis

### Contributing
DemandPulse is open source! Consider:
1. **Reporting Issues**: Help improve stability
2. **Feature Requests**: Suggest new functionality
3. **Code Contributions**: Submit pull requests
4. **Documentation**: Improve guides and examples

### Staying Updated
- **Watch Repository**: Get notifications of new releases
- **Follow Changelog**: Check `CHANGELOG.md` for updates
- **Join Community**: Participate in discussions

---

*Need more help? Contact us at support@demandpulse.dev or open an issue on GitHub.*

*Last Updated: 2025-01-15*