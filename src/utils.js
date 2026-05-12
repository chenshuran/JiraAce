(() => {
    const JiraAce = globalThis.JiraAce || (globalThis.JiraAce = {});
    const { delays, route } = JiraAce.config;

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function debounce(func, wait) {
        let timeoutId;

        return function debounced(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), wait);
        };
    }

    async function waitForElement(selector, maxAttempts = delays.maxElementAttempts) {
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }

            await sleep(delays.elementRetryMs);
        }

        throw new Error(`Element ${selector} not found after ${maxAttempts} attempts`);
    }

    function isIssuePage() {
        return window.location.href.includes(route.issuePathSegment);
    }

    function getTicketKey() {
        const match = window.location.pathname.match(route.ticketKeyPattern);
        return match ? match[1] : null;
    }

    JiraAce.utils = {
        sleep,
        debounce,
        waitForElement,
        isIssuePage,
        getTicketKey
    };
})();
