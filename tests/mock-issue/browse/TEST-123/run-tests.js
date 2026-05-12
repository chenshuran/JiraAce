(async () => {
    const summaryNode = document.getElementById('summary');
    const resultsNode = document.getElementById('results');
    const fixtureNode = document.getElementById('fixture');
    const clipboardWrites = [];

    window.ClipboardItem = class ClipboardItem {
        constructor(data) {
            this.data = data;
        }
    };

    const previousClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
            async write(items) {
                clipboardWrites.push(items);
            }
        }
    });

    JiraAce.config.delays.pageReadyMs = 0;
    JiraAce.config.delays.elementRetryMs = 0;
    JiraAce.config.delays.maxFieldAttempts = 2;

    function setIssueMode(enabled) {
        JiraAce.config.route.issuePathSegment = enabled ? '/browse/' : '/mock/';
    }

    function resetFixture({
        issueType = 'User Story',
        summary = 'Mock summary',
        epicLink = '',
        storyPoints = '',
        includeEditButton = false
    } = {}) {
        clipboardWrites.length = 0;
        setIssueMode(true);

        document.querySelector('#floating-ticket-key')?.remove();
        document.querySelector('#ticket-info-logo')?.remove();
        document.querySelector('#warnings-container')?.remove();
        document.querySelector('#customfield_11450-field')?.remove();

        const editButton = includeEditButton ? '<button id="edit-issue" type="button">Edit</button>' : '';
        const epicLinkHtml = epicLink ? `<a class="aui-label">${epicLink}</a>` : '';

        fixtureNode.innerHTML = `
            <div id="summary-shell">
                ${editButton}
                <div id="summary-val">${summary}</div>
            </div>
            <div id="type-val">${issueType}</div>
            <div id="customfield_11450-val">${epicLinkHtml}</div>
            <div id="rowForcustomfield_10422">${storyPoints}</div>
        `;
    }

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    async function record(name, fn) {
        const line = document.createElement('div');
        line.className = 'result';
        line.textContent = `Running: ${name}`;
        resultsNode.appendChild(line);

        try {
            await fn();
            line.className = 'result pass';
            line.textContent = `PASS: ${name}`;
            return true;
        } catch (error) {
            line.className = 'result fail';
            line.textContent = `FAIL: ${name} - ${error.message}`;
            return false;
        }
    }

    const tests = [
        {
            name: 'User Story missing Epic Link and Story Points shows two warnings',
            fn: async () => {
                resetFixture({ issueType: 'User Story' });
                await JiraAce.warnings.checkIssueFields();

                assert(document.getElementById('no-epic-link'), 'Missing Epic Link warning');
                assert(document.getElementById('no-story-point'), 'Missing Story Points warning');
            }
        },
        {
            name: 'QA Task only shows Epic Link warning',
            fn: async () => {
                resetFixture({ issueType: 'QA Task' });
                await JiraAce.warnings.checkIssueFields();

                assert(document.getElementById('no-epic-link'), 'Missing Epic Link warning');
                assert(!document.getElementById('no-story-point'), 'Unexpected Story Points warning');
            }
        },
        {
            name: 'Task shows Epic Link warning without Story Points warning',
            fn: async () => {
                resetFixture({ issueType: 'Task' });
                await JiraAce.warnings.checkIssueFields();

                assert(document.getElementById('no-epic-link'), 'Missing Epic Link warning');
                assert(!document.getElementById('no-story-point'), 'Unexpected Story Points warning');
            }
        },
        {
            name: 'Unsupported type removes warnings container',
            fn: async () => {
                resetFixture({ issueType: 'User Story' });
                await JiraAce.warnings.checkIssueFields();
                assert(document.getElementById('warnings-container'), 'Expected warning container before cleanup');

                document.getElementById('type-val').textContent = 'Bug';
                await JiraAce.warnings.checkIssueFields();
                assert(!document.getElementById('warnings-container'), 'Expected warning container to be removed');
            }
        },
        {
            name: 'Warning click opens edit field and dropdown',
            fn: async () => {
                resetFixture({ issueType: 'User Story', includeEditButton: true });

                let focused = false;
                let dropdownOpened = false;

                document.getElementById('edit-issue').addEventListener('click', () => {
                    const field = document.createElement('div');
                    field.id = 'customfield_11450-field';
                    field.tabIndex = 0;
                    field.scrollIntoView = () => {};
                    field.focus = () => {
                        focused = true;
                    };

                    const dropdown = document.createElement('button');
                    dropdown.setAttribute('aria-haspopup', 'listbox');
                    dropdown.addEventListener('click', () => {
                        dropdownOpened = true;
                    });

                    field.appendChild(dropdown);
                    document.body.appendChild(field);
                });

                await JiraAce.warnings.checkIssueFields();
                document.getElementById('no-epic-link').click();
                await Promise.resolve();
                await Promise.resolve();

                assert(focused, 'Expected field focus');
                assert(dropdownOpened, 'Expected dropdown to open');
            }
        },
        {
            name: 'Panel render creates logo and hidden panel',
            fn: async () => {
                resetFixture({
                    issueType: 'User Story',
                    summary: 'A long summary that is enough to exercise truncation and ticket rendering'
                });

                JiraAce.ticketPanel.renderTicketPanel();

                const panel = document.getElementById('floating-ticket-key');
                const logo = document.getElementById('ticket-info-logo');

                assert(logo, 'Expected logo');
                assert(panel, 'Expected panel');
                assert(panel.style.display === 'none', 'Expected hidden panel by default');
                assert(panel.textContent.includes('TEST-123'), 'Expected ticket key in panel');
            }
        },
        {
            name: 'Copy button writes plain text and html clipboard values',
            fn: async () => {
                resetFixture({ issueType: 'User Story', summary: 'Clipboard summary' });
                JiraAce.ticketPanel.renderTicketPanel();

                const firstButton = document.querySelector('#floating-ticket-key button');
                await firstButton.click();

                assert(clipboardWrites.length === 1, 'Expected clipboard write');
                const clipboardItem = clipboardWrites[0][0];
                assert(clipboardItem.data['text/plain'], 'Expected text/plain payload');
                assert(clipboardItem.data['text/html'], 'Expected text/html payload');

                const plainText = await clipboardItem.data['text/plain'].text();
                const htmlText = await clipboardItem.data['text/html'].text();

                assert(plainText === 'TEST-123', 'Expected plain text ticket key');
                assert(htmlText.includes('TEST-123'), 'Expected HTML payload to contain ticket key');
            }
        },
        {
            name: 'Non-issue mode clears helper UI',
            fn: async () => {
                resetFixture({ issueType: 'User Story' });
                JiraAce.ticketPanel.renderTicketPanel();

                setIssueMode(false);
                JiraAce.ticketPanel.renderTicketPanel();

                assert(!document.getElementById('floating-ticket-key'), 'Expected panel removed');
                assert(!document.getElementById('ticket-info-logo'), 'Expected logo removed');
            }
        }
    ];

    let passed = 0;
    for (const test of tests) {
        if (await record(test.name, test.fn)) {
            passed += 1;
        }
    }

    summaryNode.textContent = `Passed ${passed} of ${tests.length} tests`;
    summaryNode.className = passed === tests.length ? 'summary pass' : 'summary fail';

    if (previousClipboard) {
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: previousClipboard
        });
    }
})();
