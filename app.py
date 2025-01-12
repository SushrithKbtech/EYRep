from flask import Flask, request, jsonify, render_template, send_file
import openai
import sqlite3
from fpdf import FPDF
import os

app = Flask(__name__)

# GPT API Configuration
openai.api_key = "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"

# Database Initialization
DATABASE = "healthcare.db"
if not os.path.exists(DATABASE):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT
        )
    ''')
    c.execute('''
        CREATE TABLE chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            message TEXT,
            sender TEXT,
            FOREIGN KEY(patient_id) REFERENCES patients(id)
        )
    ''')
    conn.commit()
    conn.close()

# Function to classify health-related queries
def is_health_prompt(prompt):
    # Remove strict classification for follow-up queries
    return True

# Route: Serve Frontend
@app.route("/")
def index():
    return render_template("index.html")

# Route: Start Chat
@app.route("/start_chat", methods=["POST"])
def start_chat():
    patient_id = request.json.get("patient_id")
    chat_history = [{"role": "assistant", "content": "Hello! How can I assist you today?"}]

    # Store the initial message in the database
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("INSERT INTO chats (patient_id, message, sender) VALUES (?, ?, ?)", (patient_id, "Hello! How can I assist you today?", "ai"))
    conn.commit()
    conn.close()

    return jsonify({"response": "Hello! How can I assist you today?", "chat_history": chat_history})

# Route: Handle Chat
@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    patient_id = data.get("patient_id")
    prompt = data.get("prompt")
    chat_history = data.get("chat_history", [])

    if prompt.lower() == "end chat":
        report_path = generate_report(patient_id, chat_history)
        return jsonify({"response": "Thank you for providing all the information. Your report is ready. It will now be downloaded.", "report_path": report_path})

    chat_prompt = [
        {
            "role": "system",
            "content": "You are a healthcare assistant helping a patient. Ask one follow-up question at a time to gather complete information for a structured medical report. Ensure all responses are clear and formatted."
        }
    ]
    chat_prompt.extend(chat_history)
    chat_prompt.append({"role": "user", "content": prompt})

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=chat_prompt,
        max_tokens=150,
        temperature=0.7
    )
    answer = response["choices"][0]["message"]["content"].strip()

    # Store patient query and AI response in the database
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("INSERT INTO chats (patient_id, message, sender) VALUES (?, ?, ?)", (patient_id, prompt, "patient"))
    c.execute("INSERT INTO chats (patient_id, message, sender) VALUES (?, ?, ?)", (patient_id, answer, "ai"))
    conn.commit()
    conn.close()

    # Update chat history
    chat_history.append({"role": "user", "content": prompt})
    chat_history.append({"role": "assistant", "content": answer})

    return jsonify({"response": answer, "chat_history": chat_history})

# Function: Generate Report
def generate_report(patient_id, chat_history):
    # Generate a structured summary of the chat
    summary_prompt = [
        {
            "role": "system",
            "content": "You are a helpful assistant that creates a structured and detailed report from a healthcare chat. Include only relevant information, and organize the report with proper headings and bullet points."
        },
        {
            "role": "user",
            "content": "Summarize the following chat into a professional medical report: " + "\n".join([f"{entry['role']}: {entry['content']}" for entry in chat_history])
        }
    ]

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=summary_prompt,
        max_tokens=500,
        temperature=0.7
    )
    summary = response["choices"][0]["message"]["content"].strip()

    # Generate possible diagnoses with probabilities
    diagnosis_prompt = [
        {
            "role": "system",
            "content": "You are a medical assistant. Based on the symptoms described in the chat, generate a list of possible diagnoses with their likelihood percentages. Provide the diagnoses in a structured format."
        },
        {
            "role": "user",
            "content": "Analyze the following symptoms and provide possible diagnoses with percentages: " + "\n".join([f"{entry['role']}: {entry['content']}" for entry in chat_history if entry['role'] == 'user'])
        }
    ]

    diagnosis_response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=diagnosis_prompt,
        max_tokens=300,
        temperature=0.7
    )
    diagnosis = diagnosis_response["choices"][0]["message"]["content"].strip()

    # Generate PDF report
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    # Add report title
    pdf.cell(200, 10, txt="Patient Report", ln=True, align="C")
    pdf.ln(10)

    # Add chat summary
    pdf.set_font("Arial", style="B", size=12)
    pdf.cell(0, 10, txt="Summary:", ln=True)
    pdf.set_font("Arial", size=10)
    pdf.multi_cell(0, 10, summary)
    pdf.ln(10)

    # Add possible diagnoses
    pdf.set_font("Arial", style="B", size=12)
    pdf.cell(0, 10, txt="Possible Diagnoses:", ln=True)
    pdf.set_font("Arial", size=10)
    pdf.multi_cell(0, 10, diagnosis)

    report_dir = f"reports/patient_{patient_id}"
    os.makedirs(report_dir, exist_ok=True)
    report_path = os.path.join(report_dir, f"report_patient_{patient_id}.pdf")
    pdf.output(report_path)

    return report_path

# Route: Download Report
@app.route("/download_report/<int:patient_id>", methods=["GET"])
def download_report(patient_id):
    report_dir = f"reports/patient_{patient_id}"
    report_path = os.path.join(report_dir, f"report_patient_{patient_id}.pdf")

    if os.path.exists(report_path):
        return send_file(report_path, as_attachment=True)
    return jsonify({"error": "Report not found"}), 404

if __name__ == "__main__":
    app.run(debug=True)
