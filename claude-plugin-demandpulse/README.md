# DemandPulse Claude Code Plugin

A Claude Code plugin that detects developer requirements from conversations and sends them to the DemandPulse backend for analysis and clustering.

## Features

- **Automatic requirement detection**: Hooks into Claude Code events to detect potential requirements in real-time
- **Manual submission**: `/demandpulse:submit` skill for manually submitting requirements
- **Privacy-focused**: Built-in consent management and anonymization options
- **Real-time analysis**: Requirements are sent to DemandPulse for clustering and trend analysis

## Installation

### Development Testing

```bash
claude --plugin-dir ./claude-plugin-demandpulse
```

### npm Installation (Recommended)

The plugin is available as an npm package for easy installation:

```bash
# Install the package globally
npm install -g claude-plugin-demandpulse

# Run the installer
demandpulse-install

# Or use npx without global installation
npx claude-plugin-demandpulse@latest install-plugin
```

### Manual Installation

1. Clone or download this repository
2. Copy the `claude-plugin-demandpulse` directory to your Claude Code plugins folder:
   - `~/.config/claude-code/plugins/demandpulse` (Linux/macOS)
   - `%APPDATA%/claude-code/plugins/demandpulse` (Windows)
3. Restart Claude Code

### Production Installation

Once published to a plugin marketplace:

```bash
/plugin install demandpulse
```

## Usage

### Automatic Detection

The plugin automatically monitors conversations for requirement patterns. When a potential requirement is detected, it will be sent to the DemandPulse backend with appropriate consent handling.

### Manual Submission

Use the `/demandpulse:submit` skill to manually submit a requirement from the current conversation context.

## Configuration

### Plugin Configuration

The plugin can be configured through environment variables:

- `DEMANDPULSE_API_URL`: URL of the DemandPulse backend (default: http://localhost:3000)
- `DEMANDPULSE_API_KEY`: API key for authentication (optional, but required if the backend has PLUGIN_API_KEY set)
- `ENABLE_AUTO_DETECTION`: Enable/disable automatic requirement detection (default: false, must be explicitly enabled)
- `DEFAULT_DATA_COLLECTION_CONSENT`: Enable/disable data collection by default (default: false, respects user privacy by default)
- `DEFAULT_CONTACT_CONSENT`: Enable/disable contact by default (default: false)
- `DEFAULT_ANONYMIZATION_CONSENT`: Enable/disable anonymization by default (default: true, anonymizes data by default)

### Backend Configuration

The DemandPulse backend must be configured with a plugin API key:

1. Add `PLUGIN_API_KEY=your-secret-key-here` to your `.env` file
2. Restart the backend server
3. Set the same key as `DEMANDPULSE_API_KEY` in your Claude Code environment

### Privacy & Consent

The DemandPulse plugin is designed with privacy as a core principle:

- **Data collection is disabled by default**: Users must explicitly enable data collection through environment variables or configuration
- **Anonymization enabled by default**: All data is anonymized by default to protect user privacy
- **Consent tracking**: All submissions include consent metadata for GDPR compliance
- **Transparent operation**: The plugin logs its actions to stderr for debugging and transparency

For production deployments, review and configure the consent settings appropriately for your use case and jurisdiction.

## Plugin Structure

```
claude-plugin-demandpulse/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── hooks/
│   └── hooks.json          # Hook definitions
├── skills/
│   └── submit-requirement/
│       └── SKILL.md        # Manual submission skill
├── bin/
│   └── hook-handler.mjs    # Hook handler script
└── README.md               # This file
```

## Development

### Testing Locally

1. Start the DemandPulse backend:

   ```bash
   npm run dev
   ```

2. Load the plugin in Claude Code:

   ```bash
   claude --plugin-dir ./claude-plugin-demandpulse
   ```

3. Test the skill:
   ```
   /demandpulse:submit
   ```

### Building for Distribution

To package the plugin for distribution:

1. Ensure all files are properly structured
2. Update the version in `plugin.json`
3. Create a zip archive of the plugin directory
4. Publish to a plugin marketplace

## License

MIT
