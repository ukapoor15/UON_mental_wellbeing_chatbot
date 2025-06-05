from flask import Flask, render_template, request, jsonify,session
from openai import OpenAI
from datetime import datetime
import uuid
import json
import os




CHAT_LOG_DIR = "chat_logs"
os.makedirs(CHAT_LOG_DIR, exist_ok=True)

"""def log_chat(user_id, role, message):
    with open('chat_logs.csv', mode='a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow([datetime.now(), user_id, role, message])"""

app = Flask(__name__)
app.secret_key="mental_health_uni_mindbot"



@app.before_request
def assign_user_id():
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())


# Replace this with your actual OpenAI API key
client = OpenAI(api_key="my-api-key")

def log_chat_json(user_id, role, message):
    filepath = os.path.join(CHAT_LOG_DIR, f"{user_id}.json")
    entry = {
        "timestamp": datetime.now().isoformat(),
        "role": role,
        "message": message
    }

    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = []

    data.append(entry)

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/support')
def support():
    return render_template('support.html')

@app.route('/chatbot')
def chatbot():
    return render_template('chatbot.html')

"""@app.route('/chatHistory', methods=['GET'])
def chat_history():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify([])  # No session yet

    history = []

    with open('chat_logs.csv', newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            if row['user_id'] == user_id:
                history.append({
                    'role': row['role'],
                    'message': row['message'],
                    'timestamp': row['timestamp']
                })

    return jsonify(history)"""
@app.route('/chatHistory', methods=['GET'])
def chat_history():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify([])

    file_path = os.path.join("chat_logs", f"{user_id}.json")
    if not os.path.exists(file_path):
        return jsonify([])

    with open(file_path, "r", encoding="utf-8") as f:
        messages = json.load(f)

    return jsonify(messages)

@app.route('/chat', methods=['POST'])

def chat():
    
    user_message = request.json.get('message', '')

    # BEFORE sending to GPT
    if "attack" in user_message.lower() or"counsellor" in user_message.lower() or "mental health" in user_message.lower():
        uon_info = "You can contact UON Counselling Services here: https://www.northampton.ac.uk/student-life/support/"
    elif "assignment" in user_message.lower() or"tca" in user_message.lower() or"exams" in user_message.lower() or"academic" in user_message.lower() or "grades" in user_message.lower():
        uon_info = "For academic help, you can access UON's Academic Support services or visit the library helpdesk."
    else:
        uon_info = ""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a supportive mental health chatbot. Be empathetic and helpful. Always respond in one or 2 concise sentence.Provide tips if necessary."
                },
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=30
        )
        bot_reply = response.choices[0].message.content
        if uon_info:
            bot_reply += f"\n\n📌 UON Tip: {uon_info}"
    except Exception as e:
        print("OpenAI API error:", e)  
        bot_reply = "Sorry, something went wrong while processing your message."
    
    user_id = session.get('user_id')  
    log_chat_json(user_id, 'user', user_message)
    log_chat_json(user_id, 'assistant', bot_reply)
   
    return jsonify({'response': bot_reply})
if __name__ == '__main__':
    app.run(debug=True)







