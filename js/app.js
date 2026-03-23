/* ========================================
   Life Coach - 前端逻辑
   ======================================== */

// 获取 DOM 元素
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// 存储对话历史
let conversationHistory = [];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 自动聚焦输入框
    userInput.focus();
    
    // 设置输入框自动高度
    autoResizeTextarea();
});

/* ========================================
   事件监听
   ======================================== */

// 发送按钮点击事件
sendBtn.addEventListener('click', () => {
    sendMessage();
});

// 输入框键盘事件
userInput.addEventListener('keydown', (e) => {
    // Enter 发送，Shift + Enter 换行
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// 输入框内容变化时自动调整高度
userInput.addEventListener('input', autoResizeTextarea);

/* ========================================
   核心功能函数
   ======================================== */

// 自动调整输入框高度
function autoResizeTextarea() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
}

// 发送消息
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // 禁用发送按钮
    sendBtn.disabled = true;
    userInput.value = '';
    autoResizeTextarea();

    // 添加用户消息到界面
    appendMessage('user', message);
    
    // 添加到对话历史
    conversationHistory.push({
        role: 'user',
        content: message
    });

    // 显示加载动画
    const loadingId = showLoading();

    try {
        // 发送请求到后端
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: conversationHistory
            })
        });

        // 移除加载动画
        removeLoading(loadingId);

        if (!response.ok) {
            throw new Error('请求失败');
        }

        // 处理流式响应
        await handleStreamResponse(response);

    } catch (error) {
        console.error('Error:', error);
        removeLoading(loadingId);
        appendMessage('assistant', '抱歉，发生了错误。请稍后重试。');
    }

    // 启用发送按钮
    sendBtn.disabled = false;
    userInput.focus();
}

// 处理流式响应
async function handleStreamResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let assistantContent = '';
    let thinkingContent = '';
    let isThinking = false;
    let messageElement = null;
    let thinkingElement = null;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                    const json = JSON.parse(data);
                    const delta = json.choices?.[0]?.delta;
                    
                    if (delta) {
                        // 处理推理内容（思考过程）
                        if (delta.reasoning_content) {
                            if (!isThinking) {
                                isThinking = true;
                                // 创建消息元素
                                messageElement = createMessageElement('assistant');
                                // 创建思考区域
                                thinkingElement = document.createElement('div');
                                thinkingElement.className = 'thinking-content';
                                thinkingElement.innerHTML = '<div class="thinking-label">💭 思考过程</div><div class="thinking-text"></div>';
                                messageElement.querySelector('.message-content').appendChild(thinkingElement);
                                chatMessages.appendChild(messageElement);
                                scrollToBottom();
                            }
                            thinkingContent += delta.reasoning_content;
                            thinkingElement.querySelector('.thinking-text').textContent = thinkingContent;
                        }
                        
                        // 处理正常内容
                        if (delta.content) {
                            if (!messageElement) {
                                isThinking = false;
                                messageElement = createMessageElement('assistant');
                                chatMessages.appendChild(messageElement);
                            }
                            assistantContent += delta.content;
                            updateMessageContent(messageElement, assistantContent);
                            scrollToBottom();
                        }
                    }
                } catch (e) {
                    // 忽略解析错误
                }
            }
        }
    }

    // 添加到对话历史
    if (assistantContent) {
        conversationHistory.push({
            role: 'assistant',
            content: assistantContent
        });
    }
}

/* ========================================
   UI 辅助函数
   ======================================== */

// 创建消息元素
function createMessageElement(role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? '👤' : '🧭';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    return messageDiv;
}

// 更新消息内容
function updateMessageContent(element, content) {
    const contentDiv = element.querySelector('.message-content');
    // 保留思考区域
    const thinkingDiv = contentDiv.querySelector('.thinking-content');
    contentDiv.innerHTML = '';
    if (thinkingDiv) {
        contentDiv.appendChild(thinkingDiv);
    }
    // 添加回复内容
    const textDiv = document.createElement('div');
    textDiv.className = 'response-text';
    textDiv.textContent = content;
    contentDiv.appendChild(textDiv);
}

// 添加消息到聊天区域
function appendMessage(role, content) {
    const messageDiv = createMessageElement(role);
    const contentDiv = messageDiv.querySelector('.message-content');
    
    // 将内容转换为段落
    const paragraphs = content.split('\n').filter(p => p.trim());
    paragraphs.forEach(p => {
        const pElement = document.createElement('p');
        pElement.textContent = p;
        contentDiv.appendChild(pElement);
    });
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// 显示加载动画
function showLoading() {
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.className = 'message assistant-message';
    loadingDiv.innerHTML = `
        <div class="message-avatar">🧭</div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(loadingDiv);
    scrollToBottom();
    return loadingId;
}

// 移除加载动画
function removeLoading(loadingId) {
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
        loadingElement.remove();
    }
}

// 滚动到底部
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
