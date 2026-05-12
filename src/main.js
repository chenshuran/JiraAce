(() => {
    const JiraAce = globalThis.JiraAce || (globalThis.JiraAce = {});
    const { debounce } = JiraAce.utils;
    const { delays } = JiraAce.config;

    const runFieldChecks = debounce(() => JiraAce.warnings.checkIssueFields(), delays.debounceMs);
    const runPanelRender = debounce(() => JiraAce.ticketPanel.renderTicketPanel(), delays.debounceMs);

    function runAll() {
        runFieldChecks();
        runPanelRender();
    }

    let lastUrl = location.href;

    new MutationObserver(() => {
        if (location.href === lastUrl) {
            return;
        }

        lastUrl = location.href;
        setTimeout(runAll, delays.pageReadyMs);
    }).observe(document, { subtree: true, childList: true });

    window.addEventListener('load', () => {
        setTimeout(runAll, delays.pageReadyMs);
    });

    setTimeout(runAll, delays.pageReadyMs);
})();
