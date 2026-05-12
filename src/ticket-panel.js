(() => {
    const JiraAce = globalThis.JiraAce || (globalThis.JiraAce = {});
    const { selectors } = JiraAce.config;
    const { isIssuePage, getTicketKey } = JiraAce.utils;

    function getSummaryText() {
        const summary = document.querySelector(selectors.issueSummary);
        return summary ? summary.textContent.trim() : '';
    }

    function shortenText(text, head, tail) {
        const limit = head + tail + 3;
        if (text.length <= limit) {
            return text;
        }

        return `${text.slice(0, head)}...${text.slice(-tail)}`;
    }

    function createRow(withBorder = true) {
        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            ${withBorder ? 'border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 8px;' : ''}
        `;
        return row;
    }

    function createLink(text, href) {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = text;
        link.target = '_blank';
        link.style.cssText = `
            color: white;
            text-decoration: none;
            cursor: pointer;
        `;
        return link;
    }

    function createCopyButton(contentType, ticketKey, summary) {
        const button = document.createElement('button');
        button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z"
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5"
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        button.style.cssText = `
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.8;
            transition: opacity 0.2s ease;
        `;

        button.addEventListener('mouseover', () => {
            button.style.opacity = '1';
        });

        button.addEventListener('mouseout', () => {
            button.style.opacity = '0.8';
        });

        button.addEventListener('click', async () => {
            try {
                const fullUrl = `${window.location.origin}/browse/${ticketKey}`;
                let plainText = '';
                let htmlText = '';

                switch (contentType) {
                    case 'key':
                        plainText = ticketKey;
                        htmlText = `<a href="${fullUrl}" target="_blank">${ticketKey}</a>`;
                        break;
                    case 'summary':
                        plainText = summary;
                        htmlText = `<a href="${fullUrl}" target="_blank">${summary}</a>`;
                        break;
                    case 'summaryWithKey':
                        plainText = `${summary} (${ticketKey})`;
                        htmlText = `${summary} (<a href="${fullUrl}" target="_blank">${ticketKey}</a>)`;
                        break;
                    case 'keyWithSummary':
                        plainText = `${ticketKey} ${summary}`;
                        htmlText = `<a href="${fullUrl}" target="_blank">${ticketKey}</a> ${summary}`;
                        break;
                    default:
                        return;
                }

                const clipboardItem = new ClipboardItem({
                    'text/plain': new Blob([plainText], { type: 'text/plain' }),
                    'text/html': new Blob([htmlText], { type: 'text/html' })
                });

                await navigator.clipboard.write([clipboardItem]);

                const originalIcon = button.innerHTML;
                button.innerHTML = '✓';
                setTimeout(() => {
                    button.innerHTML = originalIcon;
                }, 1000);
            } catch (error) {
                console.error('Failed to copy ticket data:', error);
            }
        });

        return button;
    }

    function createPanel(ticketKey) {
        const summary = getSummaryText();
        const href = `/browse/${ticketKey}`;

        const panel = document.createElement('div');
        panel.id = 'floating-ticket-key';
        panel.style.cssText = `
            position: fixed;
            bottom: 70px;
            right: 20px;
            background-color: #0052CC;
            color: white;
            padding: 8px 12px;
            border-radius: 3px;
            font-size: 13px;
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            z-index: 9998;
            display: flex;
            flex-direction: column;
            gap: 8px;
            transition: all 0.2s ease;
        `;

        panel.addEventListener('mouseover', () => {
            panel.style.backgroundColor = '#0065FF';
            panel.style.transform = 'translateY(-1px)';
            panel.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
        });

        panel.addEventListener('mouseout', () => {
            panel.style.backgroundColor = '#0052CC';
            panel.style.transform = 'translateY(0)';
            panel.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        });

        const keyRow = createRow(false);
        keyRow.appendChild(createLink(ticketKey, href));
        keyRow.appendChild(createCopyButton('key', ticketKey, summary));

        const summaryRow = createRow();
        const summaryLink = createLink(shortenText(summary, 20, 20), href);
        summaryLink.style.maxWidth = '300px';
        summaryLink.style.display = 'inline-block';
        summaryLink.title = summary;
        summaryRow.appendChild(summaryLink);
        summaryRow.appendChild(createCopyButton('summary', ticketKey, summary));

        const summaryWithKeyRow = createRow();
        const summaryText = document.createElement('span');
        summaryText.textContent = `${shortenText(summary, 20, 20)} (`;
        summaryText.title = summary;
        summaryText.style.cssText = `
            color: white;
            max-width: 300px;
            display: inline-block;
        `;
        const closingBracket = document.createElement('span');
        closingBracket.textContent = ')';
        closingBracket.style.color = 'white';
        summaryWithKeyRow.appendChild(summaryText);
        summaryWithKeyRow.appendChild(createLink(ticketKey, href));
        summaryWithKeyRow.appendChild(closingBracket);
        summaryWithKeyRow.appendChild(createCopyButton('summaryWithKey', ticketKey, summary));

        const keyWithSummaryRow = createRow();
        const keyWithSummaryText = document.createElement('span');
        keyWithSummaryText.textContent = shortenText(summary, 21, 21);
        keyWithSummaryText.title = summary;
        keyWithSummaryText.style.cssText = `
            color: white;
            max-width: 300px;
            display: inline-block;
        `;
        keyWithSummaryRow.appendChild(createLink(ticketKey, href));
        keyWithSummaryRow.appendChild(keyWithSummaryText);
        keyWithSummaryRow.appendChild(createCopyButton('keyWithSummary', ticketKey, summary));

        panel.appendChild(keyRow);
        panel.appendChild(summaryRow);
        panel.appendChild(summaryWithKeyRow);
        panel.appendChild(keyWithSummaryRow);

        return panel;
    }

    function createLogoButton() {
        const logo = document.createElement('div');
        logo.id = 'ticket-info-logo';
        logo.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 32px;
            height: 32px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            z-index: 9999;
        `;

        logo.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="128" height="128" rx="28" fill="#0052CC"/>
                <path d="M 32 24 H 96 C 100.418 24 104 27.582 104 32 V 96 C 104 100.418 100.418 104 96 104 H 32 C 27.582 104 24 100.418 24 96 V 32 C 24 27.582 27.582 24 32 24 Z"
                      fill="#FFFFFF" stroke="#0052CC" stroke-width="2"/>
                <path d="M 80 44 V 74 C 80 78.418 76.418 82 72 82 H 56 C 51.582 82 48 78.418 48 74"
                      stroke="#0052CC" stroke-width="12" stroke-linecap="round"/>
                <path d="M 72 34 L 82 48 H 78 L 72 38 L 66 48 H 62 L 72 34 Z" fill="#FF4B6E"/>
                <path d="M 46 80 L 56 94 H 52 L 46 84 L 40 94 H 36 L 46 80 Z"
                      fill="#FF4B6E" transform="rotate(180 46 87)"/>
            </svg>
        `;

        logo.addEventListener('mouseover', () => {
            logo.style.transform = 'translateY(-1px) scale(1.1)';
            logo.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))';
        });

        logo.addEventListener('mouseout', () => {
            logo.style.transform = 'translateY(0) scale(1)';
            logo.style.filter = 'none';
        });

        logo.addEventListener('click', () => {
            const panel = document.querySelector(selectors.floatingTicketKey);
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            } else {
                renderTicketPanel();
            }
        });

        return logo;
    }

    function clearPanelUi() {
        const panel = document.querySelector(selectors.floatingTicketKey);
        const logo = document.querySelector(selectors.ticketInfoLogo);

        if (panel) {
            panel.remove();
        }

        if (logo) {
            logo.remove();
        }
    }

    function renderTicketPanel() {
        if (!isIssuePage()) {
            clearPanelUi();
            return;
        }

        const ticketKey = getTicketKey();
        if (!ticketKey) {
            return;
        }

        let logo = document.querySelector(selectors.ticketInfoLogo);
        if (!logo) {
            logo = createLogoButton();
            document.body.appendChild(logo);
        }

        const previousPanel = document.querySelector(selectors.floatingTicketKey);
        const nextPanel = createPanel(ticketKey);
        const shouldHidePanel = !previousPanel || previousPanel.style.display === 'none';
        nextPanel.style.display = shouldHidePanel ? 'none' : 'flex';

        if (previousPanel) {
            previousPanel.replaceWith(nextPanel);
            return;
        }

        document.body.appendChild(nextPanel);
    }

    JiraAce.ticketPanel = {
        renderTicketPanel,
        clearPanelUi
    };
})();
