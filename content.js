// 创建一个函数来等待元素出现，
function waitForElement(selector, maxAttempts = 10) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        const checkElement = () => {
            attempts++;
            const element = document.querySelector(selector);
            
            if (element) {
                resolve(element);
                return;
            }
            
            if (attempts >= maxAttempts) {
                reject(`Element ${selector} not found after ${maxAttempts} attempts`);
                return;
            }
            
            setTimeout(checkElement, 1000);
        };
        
        checkElement();
    });
}

// 检查是否是Jira issue页面
function isJiraIssuePage() {
    const isJiraUrl = window.location.href.includes('/browse/');
    const hasTitle = !!document.querySelector('h1[data-test-id="issue.views.issue-base.foundation.summary.heading"]');
    console.log('URL的检查:', isJiraUrl, '标题检查:', hasTitle, 'URL:', window.location.href);
    return isJiraUrl;  // 暂时只检查URL
}

// 创建警告元素的通用
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

    // 创建图标元素
    const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    iconSvg.setAttribute("width", "14");
    iconSvg.setAttribute("height", "14");
    iconSvg.setAttribute("viewBox", "0 0 24 24");
    iconSvg.setAttribute("fill", "none");
    iconSvg.style.cssText = `
        min-width: 14px;
        min-height: 14px;
    `;

    // 设置感叹号图标路径
    iconSvg.innerHTML = `
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" 
              stroke="#DE350B" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"/>
        <path d="M12 8V12" 
              stroke="#DE350B" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"/>
        <path d="M12 16H12.01" 
              stroke="#DE350B" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"/>
    `;

    // 创建文本元素
    const textSpan = document.createElement('span');
    textSpan.textContent = text;

    // 将图标和文本添加到警告元素中
    warningElement.appendChild(iconSvg);
    warningElement.appendChild(textSpan);

    // 添加悬停效果
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

    // 添加点击事件处理
    warningElement.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        console.log(`${text} clicked`);
        
        // 查找Edit按钮
        const editButton = 
            document.querySelector('#edit-issue') || 
            document.querySelector('button[id="edit-issue"]') || 
            document.querySelector('button[aria-label="Edit issue"]');
        
        console.log('Found edit button:', editButton);
        
        if (editButton) {
            console.log('Clicking edit button');
            editButton.click();
            
            // 等待编辑界面加载完成并滚动到相应字段
            try {
                const field = await waitForElement(`#${fieldId}`, 20);
                console.log(`${text} field found:`, field);
                field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                field.focus();
                
                // 如果是Epic Link字段，尝试打开下拉菜单
                if (fieldId === 'customfield_11450-field') {
                    const dropdownButton = field.querySelector('button[aria-haspopup="listbox"]');
                    if (dropdownButton) {
                        dropdownButton.click();
                    }
                }
            } catch (error) {
                console.error(`Error finding ${text} field:`, error);
            }
        }
    });

    return warningElement;
}

// 创建一个容器来放置所有警告
function createWarningsContainer() {
    const container = document.createElement('div');
    container.id = 'warnings-container';
    container.style.cssText = `
        display: flex;
        gap: 8px;
        margin-top: 4px;
    `;
    return container;
}

// 修改检查函数
async function checkEpicLink() {
    try {
        console.log('开始检查...');
        
        // 先检查URL
        if (!window.location.href.includes('/browse/')) {
            console.log('不是Jira ticket页面，跳过检查');
            return;
        }

        console.log('开始检查Epic Link和Story Points...');
        
        // 等待页面加载完成
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 获取ticket类型
        const typeElement = document.getElementById('type-val');
        const ticketType = typeElement ? typeElement.textContent.trim() : '';
        console.log('Ticket类型:', ticketType);
        
        // 定义需要检查的ticket类型
        const typesNeedingCheck = ['Technical task', 'Improvement', 'User Story', 'QA Task'];
        const needsCheck = typesNeedingCheck.includes(ticketType);
        
        // 如果不是需要检查的类型，直接返回
        if (!needsCheck) {
            console.log('当前ticket类型不需要检查Epic Link和Story Points');
            // 移除已存在的警告
            const warningsContainer = document.getElementById('warnings-container');
            if (warningsContainer) {
                warningsContainer.remove();
            }
            return;
        }
        
        // 定义需要Story Points的ticket类型（不包括QA Task）
        const typesNeedingStoryPoints = ['Technical task', 'Improvement', 'User Story'];
        const needsStoryPoints = typesNeedingStoryPoints.includes(ticketType);
        
        // 获取所有字段列表项
        const fields = document.querySelectorAll('li.item');
        console.log('找到字段数量:', fields.length);
        
        // 查找Epic Link字段
        let epicLinkField = null;
        fields.forEach(field => {
            const label = field.querySelector('strong.name');
            if (label && label.textContent.trim() === 'Epic Link') {
                epicLinkField = field;
            }
        });
        
        // 只在特定类型的ticket下才检查Story Points字段
        const storyPointsField = needsStoryPoints ? document.getElementById('rowForcustomfield_10422') : null;
        console.log('Story Points字段:', storyPointsField);
        
        // 获取标题元素
        const titleElement = document.querySelector('#summary-val');
        
        if (titleElement) {
            // 获取或创建警告容器
            let warningsContainer = document.getElementById('warnings-container');
            if (!warningsContainer) {
                warningsContainer = createWarningsContainer();
                titleElement.parentNode.insertBefore(warningsContainer, titleElement.nextSibling);
            }

            // 检查并显示Epic Link警告
            const epicLinkElement = document.querySelector('#customfield_11450-val');
            console.log('Epic Link元素:', epicLinkElement);

            let hasEpicLink = false;
            if (epicLinkElement) {
                const epicLinkValue = epicLinkElement.querySelector('a.aui-label');
                if (epicLinkValue) {
                    const linkText = epicLinkValue.textContent.trim();
                    hasEpicLink = linkText && linkText !== '';
                    console.log('Epic Link值:', linkText, '是否有效:', hasEpicLink);
                }
            }

            // 修改判断条件
            if (!hasEpicLink) {
                console.log('Epic Link为空或无效，准备添加警告...');
                if (!document.getElementById('no-epic-link')) {
                    const epicWarning = createWarningElement('NO EPIC LINK', 'customfield_11450-field');
                    warningsContainer.appendChild(epicWarning);
                }
            } else {
                console.log('找到有效的Epic Link');
                const existingEpicWarning = document.getElementById('no-epic-link');
                if (existingEpicWarning) {
                    existingEpicWarning.remove();
                }
            }

            // 只在需要Story Points的ticket类型下显示Story Points警告
            if (needsStoryPoints) {
                if (!storyPointsField || !storyPointsField.textContent.trim()) {
                    if (!document.getElementById('no-story-point')) {
                        const storyPointWarning = createWarningElement('NO STORY POINT', 'customfield_10422');
                        warningsContainer.appendChild(storyPointWarning);
                    }
                } else {
                    const existingStoryPointWarning = document.getElementById('no-story-point');
                    if (existingStoryPointWarning) {
                        existingStoryPointWarning.remove();
                    }
                }
            } else {
                // 如果不需要Story Points，移除已存在的警告
                const existingStoryPointWarning = document.getElementById('no-story-point');
                if (existingStoryPointWarning) {
                    existingStoryPointWarning.remove();
                }
            }

            // 如果没有警告，移除容器
            if (!warningsContainer.hasChildNodes()) {
                warningsContainer.remove();
            }
        }
    } catch (error) {
        console.log('检查过程中出错:', error);
    }
}

// 创建防抖动函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 使用防抖动的检查函数
const debouncedCheck = debounce(checkEpicLink, 1000);

// 修改createTicketKeyDisplay函数
function createTicketKeyDisplay(ticketKey) {
    const container = document.createElement('div');
    container.id = 'floating-ticket-key';
    container.style.cssText = `
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

    // 创建第一行（ticket key）
    const keyRow = document.createElement('div');
    keyRow.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    // 创建第二行（summary）
    const summaryRow = document.createElement('div');
    summaryRow.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 8px;
    `;

    // 获取summary
    const titleElement = document.querySelector('#summary-val');
    const summary = titleElement ? titleElement.textContent.trim() : '';

    // 创建链接元素（第一行）
    const keyLink = document.createElement('a');
    keyLink.href = `/browse/${ticketKey}`;
    keyLink.textContent = ticketKey;
    keyLink.target = '_blank';
    keyLink.style.cssText = `
        color: white;
        text-decoration: none;
        cursor: pointer;
    `;

    // 创建链接元素（第二行）
    const summaryLink = document.createElement('a');
    summaryLink.href = `/browse/${ticketKey}`;
    summaryLink.target = '_blank';
    summaryLink.style.cssText = `
        color: white;
        text-decoration: none;
        cursor: pointer;
        max-width: 300px;
        display: inline-block;
    `;

    // 处理summary文本
    if (summary.length > 43) {  // 20 + 3 + 20 = 43
        summaryLink.textContent = summary.substring(0, 20) + '...' + summary.substring(summary.length - 20);
        // 添加完整summary作为tooltip
        summaryLink.title = summary;
    } else {
        summaryLink.textContent = summary;
    }

    // 创建复制按钮的通用函数
    function createCopyButton(contentType) {
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

        button.addEventListener('mouseover', () => button.style.opacity = '1');
        button.addEventListener('mouseout', () => button.style.opacity = '0.8');

        const fullUrl = `${window.location.origin}/browse/${ticketKey}`;
        button.addEventListener('click', async () => {
            try {
                let text, htmlText;
                const fullUrl = `${window.location.origin}/browse/${ticketKey}`;
                
                switch(contentType) {
                    case 'key':
                        text = ticketKey;
                        htmlText = `<a href="${fullUrl}" target="_blank">${ticketKey}</a>`;
                        break;
                    case 'summary':
                        text = summary;
                        htmlText = `<a href="${fullUrl}" target="_blank">${summary}</a>`;
                        break;
                    case 'titleKey':
                        text = `${summary} (${ticketKey})`;
                        htmlText = `${summary} (<a href="${fullUrl}" target="_blank">${ticketKey}</a>)`;
                        break;
                    case 'keySummary':
                        text = `${ticketKey} ${summary}`;
                        htmlText = `<a href="${fullUrl}" target="_blank">${ticketKey}</a> ${summary}`;
                        break;
                }

                const clipboardData = new ClipboardItem({
                    'text/plain': new Blob([text], { type: 'text/plain' }),
                    'text/html': new Blob([htmlText], { type: 'text/html' })
                });
                
                await navigator.clipboard.write([clipboardData]);

                const originalHTML = button.innerHTML;
                button.innerHTML = '✓';
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                }, 1000);
            } catch (error) {
                console.error('复制失败:', error);
            }
        });

        return button;
    }

    // 创建两个复制按钮
    const keyCopyButton = createCopyButton('key');
    const summaryCopyButton = createCopyButton('summary');

    // 组装第一行
    keyRow.appendChild(keyLink);
    keyRow.appendChild(keyCopyButton);

    // 组装第二行
    summaryRow.appendChild(summaryLink);
    summaryRow.appendChild(summaryCopyButton);

    // 修改第三行的创建部分
    const titleKeyRow = document.createElement('div');
    titleKeyRow.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 8px;
    `;

    // 创建标题文本元素（非链接）
    const titleSpan = document.createElement('span');
    titleSpan.style.cssText = `
        color: white;
        max-width: 300px;
        display: inline-block;
    `;

    // 处理标题文本
    const titleText = summary.length > 43 ? 
        summary.substring(0, 20) + '...' + summary.substring(summary.length - 20) :
        summary;
    titleSpan.textContent = titleText + ' (';
    titleSpan.title = summary; // 完整文本作为tooltip

    // 创建ticket key链接 - 改名为titleKeyLink
    const titleKeyLink = document.createElement('a');
    titleKeyLink.href = `/browse/${ticketKey}`;
    titleKeyLink.textContent = ticketKey;
    titleKeyLink.target = '_blank';
    titleKeyLink.style.cssText = `
        color: white;
        text-decoration: none;
        cursor: pointer;
    `;

    // 创建结束括号文本
    const closingSpan = document.createElement('span');
    closingSpan.textContent = ')';
    closingSpan.style.color = 'white';

    // 在第三行组装之前添加复制按钮的创建
    const titleKeyCopyButton = createCopyButton('titleKey');

    // 组装第三行
    titleKeyRow.appendChild(titleSpan);
    titleKeyRow.appendChild(titleKeyLink);
    titleKeyRow.appendChild(closingSpan);
    titleKeyRow.appendChild(titleKeyCopyButton);
    
    
    // 组装第四行，格式 RCV-XXX Some_Summary_Description
    
    // 修改第四行的创建部分
    const keySummaryRow = document.createElement('div');
    keySummaryRow.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 8px;
    `;


    // 创建标题文本元素（非链接）
    const keySummaryTitleSpan = document.createElement('span');
    keySummaryTitleSpan.style.cssText = `
        color: white;
        max-width: 300px;
        display: inline-block;
    `;

    // 处理标题文本
    const keySummaryTitleText = summary.length > 45 ? 
        summary.substring(0, 21) + '...' + summary.substring(summary.length - 21) :
        summary;
    keySummaryTitleSpan.textContent = keySummaryTitleText;
    keySummaryTitleSpan.title = summary; // 完整文本作为tooltip

    // 创建ticket key链接 - 改名为keySummaryTitleKeyLink
    const keySummaryTitleKeyLink = document.createElement('a');
    keySummaryTitleKeyLink.href = `/browse/${ticketKey}`;
    keySummaryTitleKeyLink.textContent = ticketKey;
    keySummaryTitleKeyLink.target = '_blank';
    keySummaryTitleKeyLink.style.cssText = `
        color: white;
        text-decoration: none;
        cursor: pointer;
    `;



    // 在第四行组装之前添加复制按钮的创建
    const keySummaryTitleKeyCopyButton = createCopyButton('keySummary');

    // 组装第四行
    keySummaryRow.appendChild(keySummaryTitleKeyLink);
    keySummaryRow.appendChild(keySummaryTitleSpan);
    keySummaryRow.appendChild(keySummaryTitleKeyCopyButton);
    
    
    //第四行组装结束

    // 添加悬停效果
    container.addEventListener('mouseover', () => {
        container.style.backgroundColor = '#0065FF';
        container.style.transform = 'translateY(-1px)';
        container.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
    });

    container.addEventListener('mouseout', () => {
        container.style.backgroundColor = '#0052CC';
        container.style.transform = 'translateY(0)';
        container.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    });

    // 组装容器
    container.appendChild(keyRow);
    container.appendChild(summaryRow);
    container.appendChild(titleKeyRow);
    container.appendChild(keySummaryRow);

    return container;
}

// 修改createLogoButton函数
function createLogoButton() {
    const logoButton = document.createElement('div');
    logoButton.id = 'ticket-info-logo';
    logoButton.style.cssText = `
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

    // SVG内容保持不变
    logoButton.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- 背景 -->
            <rect width="128" height="128" rx="28" fill="#0052CC"/>
            
            <!-- 主体：扑克牌形状 -->
            <path d="
                M 32 24
                H 96
                C 100.418 24 104 27.582 104 32
                V 96
                C 104 100.418 100.418 104 96 104
                H 32
                C 27.582 104 24 100.418 24 96
                V 32
                C 24 27.582 27.582 24 32 24
                Z
            "
            fill="#FFFFFF"
            stroke="#0052CC"
            stroke-width="2"
            />

            <!-- J字母 -->
            <path d="
                M 80 44
                V 74
                C 80 78.418 76.418 82 72 82
                H 56
                C 51.582 82 48 78.418 48 74
            "
            stroke="#0052CC"
            stroke-width="12"
            stroke-linecap="round"
            />

            <!-- 右上角的A -->
            <path d="
                M 72 34
                L 82 48
                H 78
                L 72 38
                L 66 48
                H 62
                L 72 34
                Z
            "
            fill="#FF4B6E"
            />

            <!-- 左下角的A -->
            <path d="
                M 46 80
                L 56 94
                H 52
                L 46 84
                L 40 94
                H 36
                L 46 80
                Z
            "
            fill="#FF4B6E"
            transform="rotate(180 46 87)"
            />
        </svg>
    `;

    // 修改悬停效果，只改变缩放和阴影
    logoButton.addEventListener('mouseover', () => {
        logoButton.style.transform = 'translateY(-1px) scale(1.1)';
        logoButton.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))';
    });

    logoButton.addEventListener('mouseout', () => {
        logoButton.style.transform = 'translateY(0) scale(1)';
        logoButton.style.filter = 'none';
    });

    // 点击事件保持不变
    logoButton.addEventListener('click', () => {
        const infoPanel = document.getElementById('floating-ticket-key');
        if (infoPanel) {
            infoPanel.style.display = infoPanel.style.display === 'none' ? 'flex' : 'none';
        } else {
            checkAndDisplayTicketKey();
        }
    });

    return logoButton;
}

// 修改checkAndDisplayTicketKey函数
function checkAndDisplayTicketKey() {
    try {
        // 检查是否是ticket页面
        if (!window.location.href.includes('/browse/')) {
            const existingDisplay = document.getElementById('floating-ticket-key');
            const existingLogo = document.getElementById('ticket-info-logo');
            if (existingDisplay) existingDisplay.remove();
            if (existingLogo) existingLogo.remove();
            return;
        }

        // 从URL中提取ticket key
        const match = window.location.pathname.match(/\/browse\/([^/]+)/);
        if (!match) return;

        const ticketKey = match[1];
        console.log('Found ticket key:', ticketKey);

        // 确保logo按钮存在
        let logoButton = document.getElementById('ticket-info-logo');
        if (!logoButton) {
            logoButton = createLogoButton();
            document.body.appendChild(logoButton);
        }

        // 检查是否已存在信息面板
        let keyDisplay = document.getElementById('floating-ticket-key');
        if (keyDisplay) {
            // 更新内容但保持显示状态
            const linkElement = keyDisplay.querySelector('a');
            if (linkElement) {
                linkElement.textContent = ticketKey;
                linkElement.href = `/browse/${ticketKey}`;
            }
        } else {
            // 创建新的信息面板，默认隐藏
            keyDisplay = createTicketKeyDisplay(ticketKey);
            keyDisplay.style.display = 'none';
            document.body.appendChild(keyDisplay);
        }
    } catch (error) {
        console.log('显示ticket key时出错:', error);
    }
}

// 将checkAndDisplayTicketKey添加到现有的URL监听中
const debouncedDisplayKey = debounce(checkAndDisplayTicketKey, 1000);

// 修改现有的URL监听器
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        console.log('URL changed to', url);
        setTimeout(() => {
            debouncedCheck();
            debouncedDisplayKey();
        }, 3000);
    }
}).observe(document, {subtree: true, childList: true});

// 在页面加载完成后执行
window.addEventListener('load', () => {
    console.log('页面加载完成，准备检查...');
    setTimeout(() => {
        debouncedCheck();
        debouncedDisplayKey();
    }, 3000);
});
function testabc(){
    
}
// 初始检查
console.log('初始化检查...');
setTimeout(() => {
    debouncedCheck();
    debouncedDisplayKey();
}, 3000);
  
