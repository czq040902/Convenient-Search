document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const searchStats = document.getElementById('search-stats');
    const themeToggle = document.getElementById('theme-toggle');

    // --- 主题切换逻辑 (不变) ---
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'light') {
        document.body.classList.remove('dark-mode');
    }
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        let theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    });

    // --- 搜索逻辑 (不变) ---
    let debounceTimer;
    searchInput.addEventListener('input', (event) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            performSearch(event.target.value.trim());
        }, 200);
    });

    async function performSearch(query) {
        if (query.length < 1) {
            resultsContainer.innerHTML = '';
            searchStats.textContent = '';
            return;
        }
        const startTime = performance.now();
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Network request failed');
            const results = await response.json();
            const duration = Math.round(performance.now() - startTime);
            searchStats.textContent = `FOUND ${results.length} RESULTS IN ${duration}MS`;
            displayResults(results);
        } catch (error) {
            console.error('Search failed:', error);
            resultsContainer.innerHTML = '<p class="no-results">ERROR: SEARCH FAILED</p>';
            searchStats.textContent = 'SEARCH FAILED';
        }
    }

    // --- 渲染逻辑 (核心改动) ---
    function displayResults(results) {
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">// NO MATCHING DATA FOUND</p>';
            return;
        }

        let html = '';
        results.forEach(entry => {
            const tagsHtml = entry.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

            // 条件渲染 URL
            const urlHtml = entry.url
                ? `<p class="url"><a href="${entry.url}" target="_blank" rel="noopener noreferrer">${entry.url}</a></p>`
                : '';

            // 条件渲染代码块
            const codeHtml = entry.code
                ? `<div class="code-block-wrapper">
                       <button class="copy-btn" title="Copy to clipboard">COPY</button>
                       <pre><code>${escapeHtml(entry.code)}</code></pre>
                   </div>`
                : '';

            html += `
                <div class="result-item">
                    <h3>${entry.name}</h3>
                    ${urlHtml}
                    ${codeHtml}
                    <div class="tags">${tagsHtml}</div>
                </div>
            `;
        });
        resultsContainer.innerHTML = html;
    }

    // --- 新增：复制功能事件委托 ---
    resultsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('copy-btn')) {
            const button = event.target;
            const pre = button.nextElementSibling;
            const code = pre.textContent;

            navigator.clipboard.writeText(code).then(() => {
                button.textContent = 'COPIED!';
                button.classList.add('copied');
                setTimeout(() => {
                    button.textContent = 'COPY';
                    button.classList.remove('copied');
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                button.textContent = 'ERROR';
            });
        }
    });

    // --- 新增：HTML 转义函数，防止代码中的特殊字符破坏页面结构 ---
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- 快捷键逻辑 (不变) ---
    window.addEventListener('keydown', (event) => {
        if (event.altKey && event.key.toLowerCase() === 'q') {
            event.preventDefault();
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            searchInput.focus();
        }
    });
});