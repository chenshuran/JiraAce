(() => {
    const JiraAce = globalThis.JiraAce || (globalThis.JiraAce = {});
    const { selectors, fieldIds, issueTypes, delays } = JiraAce.config;
    const { sleep, waitForElement, isIssuePage } = JiraAce.utils;

    function createWarningElement(text, fieldId) {
        const warningElement = document.createElement('div');
        warningElement.id = text.toLowerCase().replace(/\s+/g, '-');
        warningElement.style.cssText = `
            color: #DE350B;
            font-weight: 500;
            font-size: 13px;
            margin: 8px 0;
            padding: 6px 12px;
            background-color: #FFEBE6;
            border-radius: 3px;
            border: 1px solid #FFBDAD;
            display: inline-flex;
            align-items: center;
            visibility: visible !important;
            position: relative;
            z-index: 1000;
            width: fit-content;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            user-select: none;
            gap: 6px;
        `;

        const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        iconSvg.setAttribute('width', '14');
        iconSvg.setAttribute('height', '14');
        iconSvg.setAttribute('viewBox', '0 0 24 24');
        iconSvg.setAttribute('fill', 'none');
        iconSvg.style.cssText = `
            min-width: 14px;
            min-height: 14px;
        `;
        iconSvg.innerHTML = `
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="#DE350B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 8V12"
                  stroke="#DE350B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 16H12.01"
                  stroke="#DE350B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        `;

        const textSpan = document.createElement('span');
        textSpan.textContent = text;

        warningElement.appendChild(iconSvg);
        warningElement.appendChild(textSpan);

        warningElement.addEventListener('mouseover', () => {
            warningElement.style.backgroundColor = '#FFD2CC';
            warningElement.style.borderColor = '#FF8F73';
            warningElement.style.transform = 'translateY(-1px)';
            warningElement.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        });

        warningElement.addEventListener('mouseout', () => {
            warningElement.style.backgroundColor = '#FFEBE6';
            warningElement.style.borderColor = '#FFBDAD';
            warningElement.style.transform = 'translateY(0)';
            warningElement.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
        });

        warningElement.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const editButton = selectors.editIssueButtons
                .map((selector) => document.querySelector(selector))
                .find(Boolean);

            if (!editButton) {
                return;
            }

            editButton.click();

            try {
                const field = await waitForElement(`#${fieldId}`, delays.maxFieldAttempts);
                field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (typeof field.focus === 'function') {
                    field.focus();
                }

                if (fieldId === fieldIds.epicLink) {
                    const dropdownButton = field.querySelector(selectors.epicLinkDropdownButton);
                    if (dropdownButton) {
                        dropdownButton.click();
                    }
                }
            } catch (error) {
                console.error(`Unable to focus field for ${text}:`, error);
            }
        });

        return warningElement;
    }

    function getOrCreateWarningsContainer() {
        let container = document.querySelector(selectors.warningsContainer);
        if (container) {
            return container;
        }

        const summary = document.querySelector(selectors.issueSummary);
        if (!summary || !summary.parentNode) {
            return null;
        }

        container = document.createElement('div');
        container.id = 'warnings-container';
        container.style.cssText = `
            display: flex;
            gap: 8px;
            margin-top: 4px;
        `;

        summary.parentNode.insertBefore(container, summary.nextSibling);
        return container;
    }

    function removeWarning(id) {
        const warning = document.getElementById(id);
        if (!warning) {
            return;
        }

        const parent = warning.parentElement;
        warning.remove();

        if (parent && !parent.hasChildNodes()) {
            parent.remove();
        }
    }

    function showWarning(id, factory) {
        if (document.getElementById(id)) {
            return;
        }

        const container = getOrCreateWarningsContainer();
        if (!container) {
            return;
        }

        container.appendChild(factory());
    }

    async function checkIssueFields() {
        try {
            if (!isIssuePage()) {
                return;
            }

            await sleep(delays.pageReadyMs);

            const issueTypeElement = document.querySelector(selectors.issueType);
            const issueType = issueTypeElement ? issueTypeElement.textContent.trim() : '';

            if (!issueTypes.requireChecks.includes(issueType)) {
                const container = document.querySelector(selectors.warningsContainer);
                if (container) {
                    container.remove();
                }
                return;
            }

            const epicLinkElement = document.querySelector(selectors.epicLinkValue);
            const epicLinkValue = epicLinkElement
                ? epicLinkElement.querySelector(selectors.epicLinkAnchor)
                : null;
            const hasEpicLink = !!(epicLinkValue && epicLinkValue.textContent.trim());

            const needsStoryPoints = issueTypes.requireStoryPoints.includes(issueType);
            const storyPointsRow = needsStoryPoints
                ? document.querySelector(selectors.storyPointsRow)
                : null;
            const hasStoryPoints = !!(storyPointsRow && storyPointsRow.textContent.trim());

            if (!hasEpicLink) {
                showWarning('no-epic-link', () => createWarningElement('NO EPIC LINK', fieldIds.epicLink));
            } else {
                removeWarning('no-epic-link');
            }

            if (needsStoryPoints && !hasStoryPoints) {
                showWarning(
                    'no-story-point',
                    () => createWarningElement('NO STORY POINT', fieldIds.storyPoints)
                );
            } else {
                removeWarning('no-story-point');
            }
        } catch (error) {
            console.error('Error while checking Jira fields:', error);
        }
    }

    JiraAce.warnings = {
        checkIssueFields
    };
})();
