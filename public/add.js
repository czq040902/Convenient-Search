document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-form');
    const submitBtn = document.getElementById('submit-btn');
    const statusMessage = document.getElementById('status-message');
    const themeToggle = document.getElementById('theme-toggle'); // 主题切换依然需要

    // 复用主题切换逻辑
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'light') {
        document.body.classList.remove('dark-mode');
    }
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        let theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        submitBtn.disabled = true;
        submitBtn.textContent = 'SAVING...';
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';

        const formData = new FormData(form);
        const name = formData.get('name').trim();
        const url = formData.get('url').trim();
        const code = formData.get('code'); // Textarea 不需要 trim 开头的空白
        const tagsInput = formData.get('tags').trim();

        // 将逗号分隔的标签字符串转换为数组
        const tags = tagsInput.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        const dataToSend = { name, tags };
        if (url) dataToSend.url = url;
        if (code) dataToSend.code = code;

        try {
            const response = await fetch('/api/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server error');
            }

            // 成功
            statusMessage.textContent = 'SUCCESS: Entry saved!';
            statusMessage.classList.add('success');
            form.reset(); // 清空表单
            document.getElementById('name').focus(); // 焦点回到 name 输入框

        } catch (error) {
            statusMessage.textContent = `ERROR: ${error.message}`;
            statusMessage.classList.add('error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'SAVE_ENTRY';
        }
    });
});