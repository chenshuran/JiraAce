# JiraAce Manual Regression Checklist

Use this checklist after refactors or behavior changes to confirm the extension still works as expected in Jira.

## Setup

- Reload the unpacked extension in Chrome from `C:\MyWork\GitHub\JiraAce`
- Make sure the extension is enabled
- Open a Jira issue page under `https://jira.ringcentral.com/browse/...`
- Keep the browser console open and watch for obvious errors

## Basic Load

- Open a Jira issue page and confirm the JiraAce logo appears in the bottom-right corner
- Confirm the page does not freeze, flicker badly, or render multiple logos
- Refresh the current issue page and confirm the logo still appears
- Navigate from a non-issue page into an issue page and confirm the extension loads correctly

## Warning Rules

- Open a `User Story` that is missing both `Epic Link` and `Story Points`
- Confirm both `NO EPIC LINK` and `NO STORY POINT` appear under the summary
- Open a `QA Task` that is missing `Epic Link`
- Confirm only `NO EPIC LINK` appears
- Open an unsupported type such as `Bug`
- Confirm no JiraAce warning appears
- Open a `User Story` with all required fields filled
- Confirm no JiraAce warning appears

## Warning Actions

- Click `NO EPIC LINK`
- Confirm the Jira edit view opens and scrolls to the `Epic Link` field
- If `Epic Link` is a dropdown in your Jira layout, confirm the dropdown opens or the field receives focus
- Click `NO STORY POINT`
- Confirm the Jira edit view opens and scrolls to the `Story Points` field
- Fill the missing field and save
- Confirm the matching warning disappears
- Fill all missing required fields and save
- Confirm the full warning container disappears

## Floating Panel

- Click the JiraAce logo
- Confirm the floating helper panel appears
- Click the logo again
- Confirm the panel hides
- Expand the panel and confirm it shows four rows:
- `ticket key`
- `summary`
- `summary (KEY)`
- `KEY summary`
- Switch to another issue and reopen the panel
- Confirm the panel content updates to the new issue key and summary

## Copy Behavior

- Click the copy button for `ticket key`
- Confirm the clipboard contains only the issue key, such as `ABC-123`
- Click the copy button for `summary`
- Confirm the clipboard contains the summary text
- Click the copy button for `summary (KEY)`
- Confirm the clipboard format is correct
- Click the copy button for `KEY summary`
- Confirm the clipboard format is correct
- Paste into a rich text editor such as email or docs
- Confirm linked content still pastes correctly when supported
- Confirm the copy button briefly changes to a check mark and then returns to the normal icon

## SPA Navigation

- Switch between issues inside Jira without a full page reload
- Confirm warnings are recalculated for the new issue
- Confirm the JiraAce logo remains stable
- Confirm the panel updates to the new issue and does not keep the old key or summary
- Switch through multiple issues in a row
- Confirm the page does not accumulate duplicate logos or duplicate panels

## Leaving Issue Pages

- Navigate from `/browse/...` to a board, search page, dashboard, or another non-issue Jira page
- Confirm the logo and floating panel are removed
- Return to an issue page
- Confirm the logo and issue helpers appear again

## Edge Cases

- Open an issue with a very long summary
- Confirm the panel truncates the display text but still copies the full content
- Open an issue where Jira fields load slowly
- Confirm warnings still appear or disappear correctly after the delay
- If Jira UI structure has changed, look for console errors, missing warnings, broken clicks, or missing helper UI

## Acceptance Focus

- `Epic Link` and `Story Points` rules still match the original behavior
- Warning clicks still guide the user to the correct field
- The floating panel still toggles correctly and copies the right values
- Jira single-page navigation does not leave behind stale or duplicate UI
