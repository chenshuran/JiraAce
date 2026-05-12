(() => {
    const JiraAce = globalThis.JiraAce || (globalThis.JiraAce = {});

    JiraAce.config = {
        selectors: {
            issueSummary: '#summary-val',
            issueType: '#type-val',
            epicLinkValue: '#customfield_11450-val',
            epicLinkAnchor: 'a.aui-label',
            storyPointsRow: '#rowForcustomfield_10422',
            warningsContainer: '#warnings-container',
            floatingTicketKey: '#floating-ticket-key',
            ticketInfoLogo: '#ticket-info-logo',
            editIssueButtons: [
                '#edit-issue',
                'button[id="edit-issue"]',
                'button[aria-label="Edit issue"]'
            ],
            epicLinkDropdownButton: 'button[aria-haspopup="listbox"]'
        },
        fieldIds: {
            epicLink: 'customfield_11450-field',
            storyPoints: 'customfield_10422'
        },
        issueTypes: {
            requireChecks: ['Technical task', 'Improvement', 'User Story', 'QA Task', 'Task'],
            requireStoryPoints: ['Technical task', 'Improvement', 'User Story']
        },
        route: {
            issuePathSegment: '/browse/',
            ticketKeyPattern: /\/browse\/([^/]+)/
        },
        delays: {
            debounceMs: 1000,
            pageReadyMs: 3000,
            elementRetryMs: 1000,
            maxElementAttempts: 10,
            maxFieldAttempts: 20
        }
    };
})();
