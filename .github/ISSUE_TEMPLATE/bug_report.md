name: Bug Report
description: Report something that is not working correctly
title: "[Bug] "
labels: ["bug"]
assignees: []
body:

- type: markdown
  attributes:
  value: | ## Bug Description
  Describe the bug clearly. What did you expect to happen? What actually happened?

- type: textarea
  id: steps
  attributes:
  label: Steps to Reproduce
  description: How can we reproduce this issue?
  placeholder: | 1. Go to '...' 2. Click on '...' 3. See error

- type: textarea
  id: expected
  attributes:
  label: Expected Behavior
  description: What should happen?

- type: textarea
  id: actual
  attributes:
  label: Actual Behavior
  description: What actually happens?

- type: input
  id: environment
  attributes:
  label: Environment
  description: "Browser, OS, Claude Code version, etc."
  placeholder: "e.g., macOS 14, Claude Code 1.x, Chrome 120"

- type: textarea
  id: logs
  attributes:
  label: Relevant Logs
  description: Any error messages or logs (please remove sensitive info)
  placeholder: Paste relevant logs here...

- type: checkboxes
  id: checkbox
  attributes:
  label: Checklist
  options: - label: I have searched existing issues
  required: true - label: I can reproduce the issue
  required: true
