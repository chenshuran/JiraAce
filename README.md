# JiraAce

A Chrome extension that improves Jira issue operations for Scrum Masters at RingCentral.

## What It Does

- Warns when `Epic Link` is missing on supported issue types
- Warns when `Story Points` is missing on supported issue types
- Lets you jump from a warning directly to the matching edit field
- Adds a floating helper panel for quick ticket copy actions

## Structure

- `content.js`: original single-file implementation kept as reference
- `src/config.js`: selectors, field IDs, route rules, and timing config
- `src/utils.js`: shared helpers such as debounce, sleep, and issue detection
- `src/warnings.js`: missing-field checks and warning UI
- `src/ticket-panel.js`: floating panel and copy actions
- `src/main.js`: startup and Jira page-change listeners
- `tests/mock-issue/browse/TEST-123/index.html`: local mock browser test page

## How To Run

1. Open Chrome and go to `chrome://extensions/`
2. Turn on Developer mode
3. Choose `Load unpacked`
4. Select this project folder
5. Open a Jira issue page under `https://jira.ringcentral.com/`

## How To Run Mock Tests

Open [tests/mock-issue/browse/TEST-123/index.html](C:/MyWork/GitHub/JiraAce/tests/mock-issue/browse/TEST-123/index.html:1) in a browser to run the local mock test suite.
