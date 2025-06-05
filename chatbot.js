$(document).ready(function() {
    let isDarkMode = false;
    let isShowingHistory = false;
    let chatHistory = [];
    loadChatHistory();
    // Voice recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.interimResults = false;

$("#voice-button").click(() => {
    recognition.start();
});

recognition.onresult = function(event) {
    const voiceText = event.results[0][0].transcript;
    $("#user-input").val(voiceText);
    sendUserMessage();  // Optionally auto-send after voice
};

recognition.onerror = function(event) {
    alert("Voice recognition error: " + event.error);
};

    async function loadChatHistory() {
        try {
            const response = await fetch('/chatHistory');
            const data = await response.json();
    
            chatHistory = []; // reset
    
            let lastUserMessage = null;
    
            data.forEach(entry => {
                if (entry.role === 'user') {
                    lastUserMessage = entry.message;
                    addMessage(entry.message, 'right');
                } else if (entry.role === 'assistant') {
                    addMessage(entry.message, 'left');
                    if (lastUserMessage !== null) {
                        chatHistory.push({
                            user: lastUserMessage,
                            bot: entry.message
                        });
                        lastUserMessage = null;
                    }
                }
            });
    
        } catch (error) {
            console.error("Error loading chat history:", error);
        }
    }
    
/*const moodSpan = mood ? `<span class="mood-emoji">${mood}</span>` : "";*/
//${moodSpan}

    function addMessage(message, side,mood) {
        const timestamp = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
    
        const bubble = `
            <div class="chat-bubble ${side} animate-fade-in"> 
                ${message} 
                <div class="timestamp text-xs mt-1 ${side === 'left' ? 'text-left' : 'text-left'} text-gray-500 dark:text-gray-300">
                    ${timestamp}
                </div>
            </div>`;
        
        $("#chat-box").append(bubble);
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
    }
    

    function sendUserMessage() {
        let userMessage = $("#user-input").val().trim();
        if (userMessage !== "") {
            addMessage(userMessage, 'right'); // Show message instantly

            $("#user-input").val('');
            sendMessageToBot(userMessage);
        }
    }

    $("#send-button").click(sendUserMessage);

    $("#user-input").keypress(function(e) {
        if (e.which == 13) {
            sendUserMessage();
        }
    });

    function showTypingIndicator() {
        $("#chat-box").append(`<div id="typing" class="typing-indicator">Bot is typing...</div>`);
        $('#chat-box').scrollTop($('#chat-box')[0].scrollHeight);
    }

    function removeTypingIndicator() {
        $("#typing").remove();
    }

    function sendMessageToBot(message) {
        showTypingIndicator();
        
            $.ajax({
                type: "POST",
                url: "/chat",
                contentType: "application/json",
                data: JSON.stringify({ message: message }),
                success: function(data) {
                    removeTypingIndicator();
                    //addMessage(message, 'right');add data.mood
                    addMessage(data.response, 'left');
                    storeMessage(message, data.response);
                },
                error: function() {
                    removeTypingIndicator();
                    const fallback = "Sorry, I couldn't connect to the server. Please try again later.";
                    addMessage(fallback, 'left');
                    storeMessage(message, fallback);
                }
            });
        }

    function storeMessage(userMessage, botResponse) {
        chatHistory.push({ user: userMessage, bot: botResponse });
    }

    // Theme load
    if (localStorage.getItem("theme") === "dark") {
        isDarkMode = true;
        $("body").removeClass("light-mode").addClass("dark-mode");
        $("#theme-toggle").text("☀️");
    }

    $("#theme-toggle").click(function () {
        isDarkMode = !isDarkMode;
        $("body").toggleClass("dark-mode light-mode");
        $(this).text(isDarkMode ? "☀️" : "🌙");
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    });

    // Toggle History View
    $("#history-toggle").click(function () {
        if (!isShowingHistory) {
            if (chatHistory.length > 0) {
                let historyHTML = "<h3 class='text-lg mb-2'>Chat History</h3><ul class='space-y-2'>";
                chatHistory.forEach(function(entry) {
                    historyHTML += `<li><strong>You:</strong> ${entry.user}<br><strong>Bot:</strong> ${entry.bot}</li>`;
                });
                historyHTML += "</ul>";
                $("#chat-box").html(historyHTML);
            } else {
                $("#chat-box").html("<p>No chat history yet.</p>");
            }
            $(this).text("💬 Back to Chat");
            isShowingHistory = true;

            // 🔼 Scroll to top
            setTimeout(() => {
                $('#chat-box').scrollTop(0);
            }, 100); // slight delay to ensure rendering
        } else {
            $("#chat-box").html('');
            chatHistory.forEach(function(entry) {
                addMessage(entry.user, 'right');
                addMessage(entry.bot, 'left');
            });
            $(this).text("🕑 History");
            isShowingHistory = false;
        }
    });
});
