document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const searchStats = document.getElementById('search-stats');
    const themeToggle = document.getElementById('theme-toggle');

    // --- 主题切换逻辑 ---
    // 页面加载时，检查本地存储的主题设置
    const currentTheme = localStorage.getItem('theme');
    // 如果没有设置，则不改变默认的 dark-mode；如果设置为 light，则移除 dark-mode
    if (currentTheme === 'light') {
        document.body.classList.remove('dark-mode');
        // 你可以根据需要更新按钮文本，例如：
        // themeToggle.textContent = 'SYS_LIGHT'; 
    }

    // 监听切换按钮点击事件
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        let theme = 'dark';
        if (!document.body.classList.contains('dark-mode')) {
            theme = 'light';
        }
        // 将用户的选择存到本地
        localStorage.setItem('theme', theme);
    });


    // --- 搜索逻辑 ---
    let debounceTimer;
    searchInput.addEventListener('input', (event) => {
        // 使用防抖优化，避免过于频繁的请求
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            performSearch(event.target.value.trim());
        }, 200); // 延迟 200ms 后执行搜索
    });

    async function performSearch(query) {
        if (query.length < 1) {
            resultsContainer.innerHTML = '';
            searchStats.textContent = '';
            return;
        }

        const startTime = performance.now(); // 记录开始时间

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('网络请求失败');
            }
            const results = await response.json();

            const endTime = performance.now(); // 记录结束时间
            const duration = Math.round(endTime - startTime); // 计算耗时

            // 更新统计信息
            searchStats.textContent = `FOUND ${results.length} RESULTS IN ${duration}MS`;

            displayResults(results);
        } catch (error) {
            console.error('搜索失败:', error);
            resultsContainer.innerHTML = '<p class="no-results">ERROR: SEARCH FAILED</p>';
            searchStats.textContent = 'SEARCH FAILED';
        }
    }

    // 负责将搜索结果渲染到页面上
    function displayResults(results) {
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">// NO MATCHING DATA FOUND</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        results.forEach(site => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'result-item';
            const tagsHtml = site.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

            itemDiv.innerHTML = `
                <a href="${site.url}" target="_blank" rel="noopener noreferrer">${site.name}</a>
                <p class="url">${site.url}</p>
                <p class="description">${site.description}</p>
                <div class="tags">${tagsHtml}</div>
            `;
            fragment.appendChild(itemDiv);
        });

        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(fragment);
    }

    // ===================================================
    // ===========    新增：键盘快捷键逻辑    ===========
    // ===================================================
    window.addEventListener('keydown', (event) => {
        // 检查是否同时按下了 Alt 键和 'q' 键
        if (event.altKey && event.key.toLowerCase() === 'q') {
            // 阻止浏览器的默认行为，例如 Firefox 的菜单快捷键
            event.preventDefault();

            // 清空输入框内容
            searchInput.value = '';

            // 手动触发 input 事件，以便执行清空结果的逻辑
            searchInput.dispatchEvent(new Event('input'));

            // 将焦点设置回输入框，方便继续输入
            searchInput.focus();
        }
    });

});