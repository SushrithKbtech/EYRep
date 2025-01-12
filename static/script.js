const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const voiceBtn = document.getElementById("voice-btn");
const pauseBtn = document.getElementById("pause-btn");
const resumeBtn = document.getElementById("resume-btn");
const endChatBtn = document.getElementById("end-chat-btn");

let chatHistory = [];

// Add messages to the chatbox
function addMessage(sender, message) {
    const div = document.createElement("div");
    div.className = `message ${sender}`;
    div.textContent = message;

    // Append the message to the chatbox
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Send message to the server
sendBtn.addEventListener("click", () => {
    const prompt = chatInput.value.trim();
    if (!prompt) return;

    // Add user's message
    addMessage("user", prompt);
    chatInput.value = "";

    // Fetch response from server
    fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt, patient_id: 1, chat_history: chatHistory }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.response) {
                // Add AI's message
                addMessage("ai", data.response);
                chatHistory.push({ role: "user", content: prompt });
                chatHistory.push({ role: "assistant", content: data.response });

                // Handle report generation
                if (data.report_path) {
                    const link = document.createElement("a");
                    link.href = data.report_path;
                    link.download = "Patient_Report.pdf";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        })
        .catch(() => {
            addMessage("ai", "An error occurred while communicating with the server.");
        });
});

// Voice-to-text functionality
voiceBtn.addEventListener("click", () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";

    recognition.start();

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatInput.value = transcript;
    };

    recognition.onerror = () => {
        alert("Voice recognition failed. Please try again.");
    };
});

// Pause button functionality
pauseBtn.addEventListener("click", () => {
    const synth = window.speechSynthesis;
    synth.pause();
});

// Resume button functionality
resumeBtn.addEventListener("click", () => {
    const synth = window.speechSynthesis;
    synth.resume();
});

// End Chat Button
endChatBtn.addEventListener("click", () => {
    fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "end chat", patient_id: 1, chat_history: chatHistory }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.response) {
                addMessage("ai", data.response);
            }
        })
        .catch(() => {
            addMessage("ai", "An error occurred while ending the chat.");
        });
});
