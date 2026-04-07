name: Feature Request
description: Suggest a new feature or improvement
title: "[Feature] "
labels: ["enhancement"]
assignees: []
body:

- type: markdown
  attributes:
  value: | ## Feature Description
  Describe the feature or improvement you'd like to see.

- type: textarea
  id: problem
  attributes:
  label: Problem Statement
  description: What problem does this solve?
  placeholder: "I encounter this problem when..."

- type: textarea
  id: solution
  attributes:
  label: Proposed Solution
  description: How should this feature work?
  placeholder: "This feature should..."

- type: textarea
  id: alternatives
  attributes:
  label: Alternatives Considered
  description: Any alternative solutions you've considered?

- type: textarea
  id: context
  attributes:
  label: Additional Context
  description: Any other context, mockups, or examples?

- type: checkboxes
  id: checkbox
  attributes:
  label: Checklist
  options: - label: I have searched existing feature requests
  required: true - label: This is not a duplicate request
  required: true
