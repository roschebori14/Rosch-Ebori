const state = {
    messages: [],
    chatHistory: [],
    currentChatId: null,
    isStreaming: false,
    editingMessageId: null,
    settings: {
        apiKey: 'rr1AlC5J2MKJe5rgAwOE5h7Rtx6rRO7qjPZ7E8pH',
        temperature: 0.3,
        maxTokens: 2048,
        model: 'command-a-03-2025'
    }
};

const elements = {
    chatContainer: document.getElementById('chatContainer'),
    messagesContainer: document.getElementById('messagesContainer'),
    welcomeScreen: document.getElementById('welcomeScreen'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    newChatBtn: document.getElementById('newChatBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    chatHistory: document.getElementById('chatHistory'),
    chatHeader: document.getElementById('chatHeader'),
    chatTitle: document.getElementById('chatTitle'),
    renameChatBtn: document.getElementById('renameChatBtn'),
    deleteChatBtn: document.getElementById('deleteChatBtn'),
    renameModal: document.getElementById('renameModal'),
    closeRenameModal: document.getElementById('closeRenameModal'),
    chatName: document.getElementById('chatName'),
    saveRename: document.getElementById('saveRename'),
    cancelRename: document.getElementById('cancelRename'),
    confirmModal: document.getElementById('confirmModal'),
    closeConfirmModal: document.getElementById('closeConfirmModal'),
    confirmTitle: document.getElementById('confirmTitle'),
    confirmMessage: document.getElementById('confirmMessage'),
    cancelConfirm: document.getElementById('cancelConfirm'),
    confirmAction: document.getElementById('confirmAction')
};

let confirmCallback = null;

function init() {
    loadChatHistory();
    setupEventListeners();
}

function loadChatHistory() {
    const savedHistory = localStorage.getItem('rgAssistantChatHistory');
    if (savedHistory) {
        state.chatHistory = JSON.parse(savedHistory);
        renderChatHistory();
    }
}

function saveChatHistory() {
    localStorage.setItem('rgAssistantChatHistory', JSON.stringify(state.chatHistory));
}

function renderChatHistory() {
    elements.chatHistory.innerHTML = '';
    
    state.chatHistory.forEach(chat => {
        const item = document.createElement('div');
        item.className = `chat-history-item ${chat.id === state.currentChatId ? 'active' : ''}`;
        item.textContent = chat.title || 'New Chat';
        item.addEventListener('click', () => loadChat(chat.id));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-chat-item';
        deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirm('Delete Chat', 'Are you sure you want to delete this chat?', () => deleteChat(chat.id));
        });
        item.appendChild(deleteBtn);
        
        elements.chatHistory.appendChild(item);
    });
}

function setupEventListeners() {
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    elements.newChatBtn.addEventListener('click', startNewChat);

    document.querySelectorAll('.suggestion-card').forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.dataset.prompt;
            elements.messageInput.value = prompt;
            sendMessage();
        });
    });

    elements.renameChatBtn.addEventListener('click', () => {
        const chat = state.chatHistory.find(c => c.id === state.currentChatId);
        elements.chatName.value = chat ? chat.title : 'New Chat';
        elements.renameModal.classList.add('active');
    });

    elements.closeRenameModal.addEventListener('click', () => {
        elements.renameModal.classList.remove('active');
    });

    elements.cancelRename.addEventListener('click', () => {
        elements.renameModal.classList.remove('active');
    });

    elements.saveRename.addEventListener('click', () => {
        renameChat(elements.chatName.value.trim());
        elements.renameModal.classList.remove('active');
    });

    elements.renameModal.addEventListener('click', (e) => {
        if (e.target === elements.renameModal) {
            elements.renameModal.classList.remove('active');
        }
    });

    elements.deleteChatBtn.addEventListener('click', () => {
        if (state.currentChatId) {
            showConfirm('Delete Chat', 'Are you sure you want to delete this chat?', () => deleteChat(state.currentChatId));
        }
    });

    elements.clearAllBtn.addEventListener('click', () => {
        showConfirm('Clear All Chats', 'Are you sure you want to delete all chats? This cannot be undone.', clearAllChats);
    });

    elements.closeConfirmModal.addEventListener('click', () => {
        elements.confirmModal.classList.remove('active');
        confirmCallback = null;
    });

    elements.cancelConfirm.addEventListener('click', () => {
        elements.confirmModal.classList.remove('active');
        confirmCallback = null;
    });

    elements.confirmAction.addEventListener('click', () => {
        if (confirmCallback) {
            confirmCallback();
        }
        elements.confirmModal.classList.remove('active');
        confirmCallback = null;
    });

    elements.confirmModal.addEventListener('click', (e) => {
        if (e.target === elements.confirmModal) {
            elements.confirmModal.classList.remove('active');
            confirmCallback = null;
        }
    });

    elements.messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });
}

function showConfirm(title, message, callback) {
    elements.confirmTitle.textContent = title;
    elements.confirmMessage.textContent = message;
    elements.confirmModal.classList.add('active');
    confirmCallback = callback;
}

function startNewChat() {
    if (state.messages.length > 0) {
        saveCurrentChat();
    }
    
    state.currentChatId = null;
    state.messages = [];
    state.editingMessageId = null;
    
    elements.messagesContainer.innerHTML = '';
    elements.welcomeScreen.classList.remove('hidden');
    elements.chatHeader.classList.remove('active');
    elements.messageInput.value = '';
    elements.messageInput.style.height = 'auto';
    
    renderChatHistory();
}

function saveCurrentChat() {
    if (state.messages.length === 0) return;
    
    const existingChat = state.chatHistory.find(chat => chat.id === state.currentChatId);
    const title = state.messages[0]?.content.slice(0, 50) || 'New Chat';
    
    if (existingChat) {
        existingChat.messages = [...state.messages];
        existingChat.title = title;
    } else {
        state.currentChatId = Date.now().toString();
        state.chatHistory.unshift({
            id: state.currentChatId,
            title: title,
            messages: [...state.messages],
            createdAt: new Date().toISOString()
        });
    }
    
    state.chatHistory = state.chatHistory.slice(0, 50);
    saveChatHistory();
    renderChatHistory();
}

function loadChat(chatId) {
    saveCurrentChat();
    
    const chat = state.chatHistory.find(c => c.id === chatId);
    if (!chat) return;
    
    state.currentChatId = chatId;
    state.messages = [...chat.messages];
    state.editingMessageId = null;
    
    elements.chatTitle.textContent = chat.title || 'New Chat';
    elements.chatHeader.classList.add('active');
    
    renderMessages();
    renderChatHistory();
}

function deleteChat(chatId) {
    state.chatHistory = state.chatHistory.filter(c => c.id !== chatId);
    
    if (state.currentChatId === chatId) {
        state.currentChatId = null;
        state.messages = [];
        elements.messagesContainer.innerHTML = '';
        elements.welcomeScreen.classList.remove('hidden');
        elements.chatHeader.classList.remove('active');
    }
    
    saveChatHistory();
    renderChatHistory();
}

function clearAllChats() {
    state.chatHistory = [];
    state.currentChatId = null;
    state.messages = [];
    elements.messagesContainer.innerHTML = '';
    elements.welcomeScreen.classList.remove('hidden');
    elements.chatHeader.classList.remove('active');
    saveChatHistory();
    renderChatHistory();
}

function renameChat(newName) {
    if (!newName.trim()) return;
    
    const chat = state.chatHistory.find(c => c.id === state.currentChatId);
    if (chat) {
        chat.title = newName.trim();
        elements.chatTitle.textContent = newName.trim();
        saveChatHistory();
        renderChatHistory();
    }
}

function renderMessages() {
    elements.messagesContainer.innerHTML = '';
    
    if (state.messages.length === 0) {
        elements.welcomeScreen.classList.remove('hidden');
        return;
    }
    
    elements.welcomeScreen.classList.add('hidden');
    elements.chatHeader.classList.add('active');
    
    state.messages.forEach((message, index) => {
        appendMessage(message.role, message.content, index);
    });
    
    scrollToBottom();
}

function appendMessage(role, content, messageIndex = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.dataset.index = messageIndex !== null ? messageIndex : state.messages.length - 1;
    
    const avatarSVG = role === 'user' 
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>';
    
    const roleLabel = role === 'user' ? 'You' : 'RG Assistant';
    
    let actionsHTML = '';
    if (role === 'user') {
        actionsHTML = `
            <div class="message-actions">
                <button class="message-action-btn" onclick="editMessage(${messageIndex})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Edit
                </button>
                <button class="message-action-btn" onclick="copyMessage(${messageIndex})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy
                </button>
            </div>
        `;
    } else {
        actionsHTML = `
            <div class="message-actions">
                <button class="message-action-btn" onclick="copyMessage(${messageIndex})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy
                </button>
                <button class="message-action-btn" onclick="regenerateResponse(${messageIndex})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                    Regenerate
                </button>
            </div>
        `;
    }
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-avatar">${avatarSVG}</div>
            <div class="message-body">
                <div class="message-role">${roleLabel}</div>
                <div class="message-text">${formatMessage(content)}</div>
                ${actionsHTML}
            </div>
        </div>
    `;
    
    elements.messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function appendTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        <div class="message-content">
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
            </div>
            <div class="message-body">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;
    
    elements.messagesContainer.appendChild(typingDiv);
    scrollToBottom();
}

function removeTypingIndicator() {
    const typing = document.getElementById('typingIndicator');
    if (typing) {
        typing.remove();
    }
}

function formatMessage(content) {
    let formatted = content
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>');
    
    formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });
    
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

function copyMessage(index) {
    const message = state.messages[index];
    if (!message) return;
    
    navigator.clipboard.writeText(message.content).then(() => {
        const btn = document.querySelector(`.message[data-index="${index}"] .message-action-btn`);
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.remove('copied');
            }, 2000);
        }
    });
}

function editMessage(index) {
    const message = state.messages[index];
    if (!message || message.role !== 'user') return;
    
    state.editingMessageId = index;
    elements.messageInput.value = message.content;
    elements.messageInput.focus();
    elements.messageInput.style.height = 'auto';
    elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 200) + 'px';
    
    state.messages = state.messages.slice(0, index);
    renderMessages();
}

function regenerateResponse(index) {
    if (state.isStreaming) return;
    
    const userMessage = state.messages.find((m, i) => i < index && m.role === 'user');
    
    if (!userMessage) return;
    
    const userIndex = state.messages.findIndex(m => m === userMessage);
    state.messages = state.messages.slice(0, userIndex + 1);
    
    const messageDiv = document.querySelector(`.message[data-index="${index}"]`);
    if (messageDiv) {
        messageDiv.remove();
    }
    
    sendMessage();
}

function scrollToBottom() {
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

async function sendMessage() {
    const content = elements.messageInput.value.trim();
    if (!content || state.isStreaming) return;
    
    if (state.editingMessageId !== null) {
        state.editingMessageId = null;
    }
    
    elements.welcomeScreen.classList.add('hidden');
    elements.chatHeader.classList.add('active');
    
    state.messages.push({ role: 'user', content });
    appendMessage('user', content, state.messages.length - 1);
    
    elements.messageInput.value = '';
    elements.messageInput.style.height = 'auto';
    
    appendTypingIndicator();
    state.isStreaming = true;
    updateSendButton();
    
    try {
        const response = await sendToCohere(state.messages);
        
        removeTypingIndicator();
        
        state.messages.push({ role: 'assistant', content: response });
        appendMessage('assistant', response, state.messages.length - 1);
        
        if (state.currentChatId) {
            const chat = state.chatHistory.find(c => c.id === state.currentChatId);
            if (chat) {
                chat.messages = [...state.messages];
                chat.title = state.messages[0]?.content.slice(0, 50) || 'New Chat';
                elements.chatTitle.textContent = chat.title;
            }
        } else {
            state.currentChatId = Date.now().toString();
            const title = state.messages[0]?.content.slice(0, 50) || 'New Chat';
            elements.chatTitle.textContent = title;
            state.chatHistory.unshift({
                id: state.currentChatId,
                title: title,
                messages: [...state.messages],
                createdAt: new Date().toISOString()
            });
        }
        
        state.chatHistory = state.chatHistory.slice(0, 50);
        saveChatHistory();
        renderChatHistory();
    } catch (error) {
        console.error('Full error:', error);
        removeTypingIndicator();
        
        let errorMessage = 'An error occurred. Please try again.';
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorMessage = 'Invalid API key. Please check your settings.';
        } else if (error.message.includes('429')) {
            errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your connection.';
        }
        
        appendMessage('assistant', `Sorry, ${errorMessage}. Error details: ${error.message}`);
    } finally {
        state.isStreaming = false;
        updateSendButton();
    }
}

async function sendToCohere(messages) {
    const validMessages = messages.filter(msg => msg.content && msg.content.trim());
    
    const chatHistory = validMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
    }));
    
    const response = await fetch('https://api.cohere.com/v2/chat', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${state.settings.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            model: state.settings.model,
            messages: chatHistory,
            temperature: state.settings.temperature,
            max_tokens: state.settings.maxTokens
        })
    });
    
    const responseText = await response.text();
    console.log('Cohere API Response:', responseText);
    
    if (!response.ok) {
        throw new Error(responseText || `${response.status} ${response.statusText}`);
    }
    
    const data = JSON.parse(responseText);
    
    if (data.message && data.message.content) {
        if (Array.isArray(data.message.content)) {
            return data.message.content.map(c => c.text).join('');
        } else if (data.message.content.text) {
            return data.message.content.text;
        } else if (typeof data.message.content === 'string') {
            return data.message.content;
        }
    }
    
    if (data.text) {
        return data.text;
    }
    
    if (data.generations && data.generations.length > 0) {
        return data.generations[0].text || '';
    }
    
    console.log('Unexpected response format:', data);
    return 'I received your message but could not parse the response.';
}

function updateSendButton() {
    elements.sendBtn.disabled = state.isStreaming;
    if (state.isStreaming) {
        elements.sendBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="6" width="12" height="12"></rect>
            </svg>
        `;
    } else {
        elements.sendBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
        `;
    }
}

init();
