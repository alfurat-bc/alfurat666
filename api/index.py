import os
import json
import io
import base64
import qrcode
import jwt
import bcrypt
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__, static_folder=None)
CORS(app)

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Config from environment
JWT_SECRET = os.getenv('JWT_SECRET', 'murdoch-survey-secret-key-2024')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@murdoch.edu.au')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'Admin@2024!')
BASE_URL = os.getenv('BASE_URL', '')

# Turso database connection
TURSO_DATABASE_URL = os.getenv('TURSO_DATABASE_URL', '')
TURSO_AUTH_TOKEN = os.getenv('TURSO_AUTH_TOKEN', '')

db_client = None

def get_db():
    """Get database connection"""
    global db_client
    if db_client is None:
        try:
            import libsql
            if TURSO_DATABASE_URL and TURSO_AUTH_TOKEN:
                db_client = libsql.connect(
                    database=TURSO_DATABASE_URL,
                    auth_token=TURSO_AUTH_TOKEN
                )
            elif TURSO_DATABASE_URL:
                db_client = libsql.connect(database=TURSO_DATABASE_URL)
        except Exception as e:
            print(f"Database connection error: {e}")
            db_client = None
    return db_client

def execute_query(sql, params=None):
    """Execute a query and return result"""
    client = get_db()
    if not client:
        return None
    try:
        if params:
            result = client.execute(sql, params)
        else:
            result = client.execute(sql)
        client.commit()
        return result
    except Exception as e:
        print(f"Query error: {e}")
        return None

def init_database():
    """Initialize database tables"""
    client = get_db()
    if not client:
        print("Warning: Database not connected, using in-memory mode")
        return False

    try:
        # Create users table
        execute_query("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT,
                role TEXT DEFAULT 'user',
                is_active INTEGER DEFAULT 1,
                created_at TEXT,
                updated_at TEXT
            )
        """)

        # Create surveys table
        execute_query("""
            CREATE TABLE IF NOT EXISTS surveys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                questions TEXT,
                is_published INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        # Create responses table
        execute_query("""
            CREATE TABLE IF NOT EXISTS responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                survey_id INTEGER NOT NULL,
                answers TEXT,
                ip_address TEXT,
                user_agent TEXT,
                submitted_at TEXT,
                FOREIGN KEY (survey_id) REFERENCES surveys(id)
            )
        """)

        # Create index for faster queries
        execute_query("CREATE INDEX IF NOT EXISTS idx_surveys_user ON surveys(user_id)")
        execute_query("CREATE INDEX IF NOT EXISTS idx_responses_survey ON responses(survey_id)")

        # Create default super admin if not exists
        result = execute_query("SELECT id FROM users WHERE email = ?", [ADMIN_EMAIL])
        rows = result.fetchall() if result else []
        if not rows:
            hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            now = datetime.now().isoformat()
            execute_query(
                "INSERT INTO users (email, password_hash, name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [ADMIN_EMAIL, hashed, "System Administrator", "super_admin", 1, now, now]
            )
            print(f"Created default admin: {ADMIN_EMAIL}")

        # Create default survey if not exists
        result = execute_query("SELECT id FROM surveys LIMIT 1")
        rows = result.fetchall() if result else []
        if not rows:
            admin_result = execute_query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1")
            admin_rows = admin_result.fetchall() if admin_result else []
            if admin_rows:
                admin_id = admin_rows[0][0]
                default_questions = [
                    {"id": "q1", "type": "radio", "text": "How often do you travel during your studies?", "options": ["Every week", "2-3 times per month", "Once a month", "A few times per semester", "Rarely or never"], "required": True},
                    {"id": "q2", "type": "radio", "text": "What is your primary mode of transportation?", "options": ["Personal car", "Public bus", "Train", "Bicycle", "Walking", "Rideshare (Uber, etc.)"], "required": True},
                    {"id": "q3", "type": "checkbox", "text": "Which countries or regions have you visited while studying in Australia?", "options": ["New Zealand", "Singapore", "Indonesia (Bali)", "Malaysia", "Thailand", "Japan", "South Korea", "Other"], "required": True},
                    {"id": "q4", "type": "radio", "text": "What is your average travel budget per trip (AUD)?", "options": ["Under $500", "$500 - $1,000", "$1,000 - $2,000", "$2,000 - $5,000", "Over $5,000"], "required": True},
                    {"id": "q5", "type": "checkbox", "text": "Who do you usually travel with?", "options": ["Alone", "Friends from university", "Friends from home country", "Family members", "Organized tour group"], "required": True},
                    {"id": "q6", "type": "checkbox", "text": "What factors influence your travel decisions?", "options": ["Cost/Budget", "Time availability", "Weather/Season", "Destination popularity", "Cultural attractions", "Adventure opportunities", "Academic schedule"], "required": True},
                    {"id": "q7", "type": "radio", "text": "How do you usually book your travel arrangements?", "options": ["Online travel platforms (Booking.com, Expedia, etc.)", "Travel agency", "Airline/Transport company websites", "Social media recommendations", "Direct contact with hotels/providers"], "required": True},
                    {"id": "q8", "type": "radio", "text": "What type of accommodation do you prefer when traveling?", "options": ["Hotel", "Hostel", "Airbnb/Vacation rental", "Student dormitory/Hostel", "Camping", "Staying with friends/family"], "required": True},
                    {"id": "q9", "type": "checkbox", "text": "What activities do you enjoy most while traveling?", "options": ["Sightseeing/Visiting landmarks", "Beach activities", "Hiking/Outdoor adventures", "Food and cuisine exploration", "Shopping", "Cultural experiences/Museums", "Nightlife/Entertainment"], "required": True},
                    {"id": "q10", "type": "textarea", "text": "Please share any memorable travel experiences at or near Murdoch University.", "placeholder": "Share your stories, favorite destinations, or travel tips for fellow international students...", "required": False}
                ]
                now = datetime.now().isoformat()
                execute_query(
                    "INSERT INTO surveys (user_id, title, description, questions, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [admin_id, "Travel Habits of International Students at Murdoch University",
                     "This survey investigates the travel habits and preferences of international students studying at Murdoch University.",
                     json.dumps(default_questions), 1, now, now]
                )
                print("Created default survey")

        return True
    except Exception as e:
        print(f"Database initialization error: {e}")
        return False

# Initialize database on module load
init_database()

# ==================== Helper Functions ====================

def row_to_user(row):
    if not row:
        return None
    return {
        "id": row[0],
        "email": row[1],
        "password_hash": row[2],
        "name": row[3],
        "role": row[4],
        "is_active": bool(row[5]),
        "created_at": row[6],
        "updated_at": row[7]
    }

def row_to_survey(row):
    if not row:
        return None
    return {
        "id": row[0],
        "user_id": row[1],
        "title": row[2],
        "description": row[3],
        "questions": json.loads(row[4]) if row[4] else [],
        "is_published": bool(row[5]),
        "created_at": row[6],
        "updated_at": row[7]
    }

def row_to_response(row):
    if not row:
        return None
    return {
        "id": row[0],
        "survey_id": row[1],
        "answers": json.loads(row[2]) if row[2] else {},
        "ip_address": row[3],
        "user_agent": row[4],
        "submitted_at": row[5]
    }

def generate_token(user):
    payload = {
        "id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "name": user.get("name", ""),
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except:
        return None

def get_current_user():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None

    token = auth_header.split(' ')[1]
    payload = verify_token(token)
    if not payload:
        return None

    result = execute_query("SELECT * FROM users WHERE id = ? AND is_active = 1", [payload["id"]])
    if result:
        rows = result.fetchall()
        if rows:
            return row_to_user(rows[0])
    return None

def require_auth():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    return user

def require_admin():
    user = require_auth()
    if isinstance(user, tuple):
        return user
    if user["role"] not in ["admin", "super_admin"]:
        return jsonify({"error": "Admin access required"}), 403
    return user

def require_super_admin():
    user = require_auth()
    if isinstance(user, tuple):
        return user
    if user["role"] != "super_admin":
        return jsonify({"error": "Super admin access required"}), 403
    return user

# ==================== Health Check ====================

@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})

# ==================== Auth Routes ====================

@app.route('/api/auth/register', methods=['POST'])
@limiter.limit("10 per hour")
def register():
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password required"}), 400

    email = data['email'].lower().strip()
    password = data['password']
    name = data.get('name', email.split('@')[0])

    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    result = execute_query("SELECT id FROM users WHERE email = ?", [email])
    if result and result.fetchone():
        return jsonify({"error": "Email already registered"}), 400

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    now = datetime.now().isoformat()

    result = execute_query(
        "INSERT INTO users (email, password_hash, name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [email, hashed, name, "user", 1, now, now]
    )

    user = {
        "id": result.last_insert_rowid if result else 0,
        "email": email,
        "name": name,
        "role": "user"
    }
    token = generate_token(user)

    return jsonify({
        "message": "Registration successful",
        "token": token,
        "user": user
    }), 201

@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("20 per hour")
def login():
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password required"}), 400

    email = data['email'].lower().strip()
    password = data['password']

    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    result = execute_query("SELECT * FROM users WHERE email = ?", [email])
    if not result:
        return jsonify({"error": "Invalid email or password"}), 401

    rows = result.fetchall()
    if not rows:
        return jsonify({"error": "Invalid email or password"}), 401

    user = row_to_user(rows[0])

    if not user.get("is_active", True):
        return jsonify({"error": "Account has been deactivated"}), 401

    if not bcrypt.checkpw(password.encode('utf-8'), user["password_hash"].encode('utf-8')):
        return jsonify({"error": "Invalid email or password"}), 401

    token = generate_token(user)
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name"),
            "role": user["role"]
        }
    })

@app.route('/api/auth/me')
def get_me():
    user = require_auth()
    if isinstance(user, tuple):
        return user

    return jsonify({
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name"),
            "role": user["role"],
            "created_at": user["created_at"]
        }
    })

@app.route('/api/auth/password', methods=['PUT'])
def change_password():
    user = require_auth()
    if isinstance(user, tuple):
        return user

    data = request.get_json()
    current = data.get('currentPassword')
    new_pwd = data.get('newPassword')

    if not bcrypt.checkpw(current.encode('utf-8'), user["password_hash"].encode('utf-8')):
        return jsonify({"error": "Current password is incorrect"}), 400

    hashed = bcrypt.hashpw(new_pwd.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    now = datetime.now().isoformat()

    execute_query("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", [hashed, now, user["id"]])

    return jsonify({"message": "Password updated successfully"})

# ==================== Survey Routes ====================

@app.route('/api/surveys')
def get_surveys():
    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    result = execute_query("SELECT * FROM surveys WHERE is_published = 1")
    surveys = []
    if result:
        for row in result.fetchall():
            s = row_to_survey(row)
            surveys.append({
                "id": s["id"],
                "title": s["title"],
                "description": s.get("description"),
                "created_at": s["created_at"]
            })

    return jsonify({"surveys": surveys})

@app.route('/api/surveys/<int:id>')
def get_survey(id):
    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    result = execute_query("SELECT * FROM surveys WHERE id = ? AND is_published = 1", [id])
    if not result:
        return jsonify({"error": "Survey not found"}), 404

    rows = result.fetchall()
    if not rows:
        return jsonify({"error": "Survey not found"}), 404

    return jsonify({"survey": row_to_survey(rows[0])})

@app.route('/api/surveys/user/my-surveys')
def get_my_surveys():
    user = require_auth()
    if isinstance(user, tuple):
        return user

    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    result = execute_query("SELECT * FROM surveys WHERE user_id = ?", [user["id"]])
    surveys = []
    if result:
        for row in result.fetchall():
            s = row_to_survey(row)
            resp_result = execute_query("SELECT COUNT(*) FROM responses WHERE survey_id = ?", [s["id"]])
            if resp_result:
                resp_rows = resp_result.fetchall()
                s["response_count"] = resp_rows[0][0] if resp_rows else 0
            surveys.append(s)

    return jsonify({"surveys": surveys})

@app.route('/api/surveys', methods=['POST'])
def create_survey():
    user = require_auth()
    if isinstance(user, tuple):
        return user

    data = request.get_json()

    if not data.get('title') or not data.get('questions'):
        return jsonify({"error": "Title and questions required"}), 400

    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    now = datetime.now().isoformat()
    result = execute_query(
        "INSERT INTO surveys (user_id, title, description, questions, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [user["id"], data["title"], data.get("description", ""), json.dumps(data["questions"]), 0, now, now]
    )

    survey = {
        "id": result.last_insert_rowid if result else 0,
        "user_id": user["id"],
        "title": data["title"],
        "description": data.get("description", ""),
        "questions": data["questions"],
        "is_published": False,
        "created_at": now,
        "updated_at": now
    }

    return jsonify({
        "message": "Survey created successfully",
        "survey": survey
    }), 201

@app.route('/api/surveys/<int:id>', methods=['PUT'])
def update_survey(id):
    user = require_auth()
    if isinstance(user, tuple):
        return user

    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    result = execute_query("SELECT * FROM surveys WHERE id = ?", [id])
    if not result:
        return jsonify({"error": "Survey not found"}), 404

    rows = result.fetchall()
    if not rows:
        return jsonify({"error": "Survey not found"}), 404

    survey = row_to_survey(rows[0])

    if survey["user_id"] != user["id"] and user["role"] != "super_admin":
        return jsonify({"error": "Not authorized to edit this survey"}), 403

    data = request.get_json()
    now = datetime.now().isoformat()

    execute_query(
        "UPDATE surveys SET title = ?, description = ?, questions = ?, updated_at = ? WHERE id = ?",
        [data.get("title", survey["title"]), data.get("description", survey["description"]),
         json.dumps(data.get("questions", survey["questions"])), now, id]
    )

    survey["title"] = data.get("title", survey["title"])
    survey["description"] = data.get("description", survey["description"])
    survey["questions"] = data.get("questions", survey["questions"])
    survey["updated_at"] = now

    return jsonify({
        "message": "Survey updated successfully",
        "survey": survey
    })

@app.route('/api/surveys/<int:id>', methods=['DELETE'])
def delete_survey(id):
    user = require_auth()
    if isinstance(user, tuple):
        return user

    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    result = execute_query("SELECT * FROM surveys WHERE id = ?", [id])
    if not result:
        return jsonify({"error": "Survey not found"}), 404

    rows = result.fetchall()
    if not rows:
        return jsonify({"error": "Survey not found"}), 404

    survey = row_to_survey(rows[0])

    if survey["user_id"] != user["id"] and user["role"] != "super_admin":
        return jsonify({"error": "Not authorized to delete this survey"}), 403

    execute_query("DELETE FROM responses WHERE survey_id = ?", [id])
    execute_query("DELETE FROM surveys WHERE id = ?", [id])

    return jsonify({"message": "Survey deleted successfully"})

@app.route('/api/surveys/<int:id>/publish', methods=['POST'])
def toggle_publish(id):
    user = require_auth()
    if isinstance(user, tuple):
        return user

    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    result = execute_query("SELECT * FROM surveys WHERE id = ?", [id])
    if not result:
        return jsonify({"error": "Survey not found"}), 404

    rows = result.fetchall()
    if not rows:
        return jsonify({"error": "Survey not found"}), 404

    survey = row_to_survey(rows[0])

    if survey["user_id"] != user["id"] and user["role"] != "super_admin":
        return jsonify({"error": "Not authorized"}), 403

    data = request.get_json()
    is_published = data.get("is_published", True)
    now = datetime.now().isoformat()

    execute_query("UPDATE surveys SET is_published = ?, updated_at = ? WHERE id = ?", [1 if is_published else 0, now, id])

    return jsonify({
        "message": "Survey published" if is_published else "Survey unpublished",
        "is_published": is_published
    })

@app.route('/api/surveys/<int:id>/qrcode')
def get_qrcode(id):
    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    result = execute_query("SELECT id FROM surveys WHERE id = ?", [id])
    if not result or not result.fetchone():
        return jsonify({"error": "Survey not found"}), 404

    survey_url = f"{BASE_URL}/survey/{id}"

    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(survey_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    return jsonify({
        "qrCode": f"data:image/png;base64,{img_base64}",
        "surveyUrl": survey_url
    })

# ==================== Response Routes ====================

@app.route('/api/surveys/<int:id>/responses', methods=['POST'])
@limiter.limit("100 per hour")
def submit_response(id):
    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    result = execute_query("SELECT * FROM surveys WHERE id = ? AND is_published = 1", [id])
    if not result or not result.fetchone():
        return jsonify({"error": "Survey not found or not available"}), 404

    data = request.get_json()

    if not data or not data.get('answers'):
        return jsonify({"error": "Answers required"}), 400

    now = datetime.now().isoformat()
    result = execute_query(
        "INSERT INTO responses (survey_id, answers, ip_address, user_agent, submitted_at) VALUES (?, ?, ?, ?, ?)",
        [id, json.dumps(data["answers"]), request.remote_addr, request.headers.get('User-Agent', ''), now]
    )

    return jsonify({
        "message": "Response submitted successfully",
        "responseId": result.last_insert_rowid if result else 0
    }), 201

@app.route('/api/surveys/<int:id>/responses')
def get_responses(id):
    user = require_auth()
    if isinstance(user, tuple):
        return user

    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    result = execute_query("SELECT * FROM surveys WHERE id = ?", [id])
    if not result:
        return jsonify({"error": "Survey not found"}), 404

    rows = result.fetchall()
    if not rows:
        return jsonify({"error": "Survey not found"}), 404

    survey = row_to_survey(rows[0])

    if survey["user_id"] != user["id"] and user["role"] != "super_admin":
        return jsonify({"error": "Not authorized to view responses"}), 403

    result = execute_query("SELECT * FROM responses WHERE survey_id = ?", [id])
    responses = []
    if result:
        responses = [row_to_response(row) for row in result.fetchall()]

    return jsonify({"responses": responses})

@app.route('/api/surveys/<int:id>/analytics')
def get_analytics(id):
    user = require_auth()
    if isinstance(user, tuple):
        return user

    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    result = execute_query("SELECT * FROM surveys WHERE id = ?", [id])
    if not result:
        return jsonify({"error": "Survey not found"}), 404

    rows = result.fetchall()
    if not rows:
        return jsonify({"error": "Survey not found"}), 404

    survey = row_to_survey(rows[0])

    if survey["user_id"] != user["id"] and user["role"] != "super_admin":
        return jsonify({"error": "Not authorized to view analytics"}), 403

    result = execute_query("SELECT * FROM responses WHERE survey_id = ?", [id])
    responses = []
    if result:
        responses = [row_to_response(row) for row in result.fetchall()]

    analytics = []
    for q_idx, question in enumerate(survey["questions"]):
        counts = {}

        for response in responses:
            answer = response["answers"].get(f"q{q_idx + 1}")
            if answer is not None and answer != "":
                if question["type"] == "checkbox" and isinstance(answer, list):
                    for item in answer:
                        counts[item] = counts.get(item, 0) + 1
                else:
                    key = str(answer)
                    counts[key] = counts.get(key, 0) + 1

        analytics.append({
            "questionId": f"q{q_idx + 1}",
            "question": question["text"],
            "type": question["type"],
            "options": question.get("options", []),
            "counts": counts,
            "total": len(responses)
        })

    return jsonify({
        "surveyId": id,
        "totalResponses": len(responses),
        "analytics": analytics
    })

@app.route('/api/surveys/<int:id>/export')
def export_responses(id):
    user = require_auth()
    if isinstance(user, tuple):
        return user

    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    result = execute_query("SELECT * FROM surveys WHERE id = ?", [id])
    if not result:
        return jsonify({"error": "Survey not found"}), 404

    rows = result.fetchall()
    if not rows:
        return jsonify({"error": "Survey not found"}), 404

    survey = row_to_survey(rows[0])

    if survey["user_id"] != user["id"] and user["role"] != "super_admin":
        return jsonify({"error": "Not authorized"}), 403

    result = execute_query("SELECT * FROM responses WHERE survey_id = ?", [id])
    responses = []
    if result:
        responses = [row_to_response(row) for row in result.fetchall()]

    csv_lines = []

    headers = ["Response ID", "Submitted At"]
    for q in survey["questions"]:
        headers.append(f"Q: {q['text']}")
    csv_lines.append(",".join([f'"{h}"' for h in headers]))

    for r in responses:
        row = [str(r["id"]), r["submitted_at"]]
        for q_idx, q in enumerate(survey["questions"]):
            answer = r["answers"].get(f"q{q_idx + 1}", "")
            if isinstance(answer, list):
                answer = "; ".join(answer)
            row.append(str(answer) if answer else "")
        csv_lines.append(",".join([f'"{cell}"' for cell in row]))

    csv_content = "\n".join(csv_lines)

    return Response(
        csv_content,
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename="{survey["title"]}-responses.csv"'}
    )

# ==================== Admin Routes ====================

@app.route('/api/admin/users')
def admin_get_users():
    user = require_admin()
    if isinstance(user, tuple):
        return user

    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    result = execute_query("SELECT * FROM users")
    users_data = []
    if result:
        for row in result.fetchall():
            u = row_to_user(row)
            survey_result = execute_query("SELECT COUNT(*) FROM surveys WHERE user_id = ?", [u["id"]])
            count = 0
            if survey_result:
                rows = survey_result.fetchall()
                count = rows[0][0] if rows else 0
            users_data.append({
                "id": u["id"],
                "email": u["email"],
                "name": u.get("name"),
                "role": u["role"],
                "is_active": u.get("is_active", True),
                "created_at": u["created_at"],
                "survey_count": count
            })

    return jsonify({"users": users_data})

@app.route('/api/admin/users/<int:user_id>/toggle-active', methods=['PUT'])
def admin_toggle_user(user_id):
    user = require_super_admin()
    if isinstance(user, tuple):
        return user

    if user_id == user["id"]:
        return jsonify({"error": "Cannot deactivate your own account"}), 400

    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    result = execute_query("SELECT * FROM users WHERE id = ?", [user_id])
    if not result:
        return jsonify({"error": "User not found"}), 404

    rows = result.fetchall()
    if not rows:
        return jsonify({"error": "User not found"}), 404

    target = row_to_user(rows[0])
    new_status = 0 if target.get("is_active", True) else 1
    now = datetime.now().isoformat()

    execute_query("UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?", [new_status, now, user_id])

    return jsonify({
        "message": "User deactivated" if new_status == 0 else "User activated",
        "is_active": bool(new_status)
    })

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
def admin_delete_user(user_id):
    user = require_super_admin()
    if isinstance(user, tuple):
        return user

    if user_id == user["id"]:
        return jsonify({"error": "Cannot delete your own account"}), 400

    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    execute_query("DELETE FROM users WHERE id = ?", [user_id])

    return jsonify({"message": "User deleted successfully"})

@app.route('/api/admin/surveys')
def admin_get_surveys():
    user = require_admin()
    if isinstance(user, tuple):
        return user

    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    result = execute_query("""
        SELECT s.id, s.user_id, s.title, s.description, s.questions, s.is_published, s.created_at, s.updated_at, u.email as user_email, u.name as user_name
        FROM surveys s
        LEFT JOIN users u ON s.user_id = u.id
    """)
    surveys_data = []
    if result:
        for row in result.fetchall():
            s = row_to_survey(row)
            resp_result = execute_query("SELECT COUNT(*) FROM responses WHERE survey_id = ?", [s["id"]])
            count = 0
            if resp_result:
                rows = resp_result.fetchall()
                count = rows[0][0] if rows else 0
            surveys_data.append({
                **s,
                "user_email": row[8] if len(row) > 8 else None,
                "user_name": row[9] if len(row) > 9 else None,
                "response_count": count
            })

    return jsonify({"surveys": surveys_data})

@app.route('/api/admin/surveys/<int:id>', methods=['DELETE'])
def admin_delete_survey(id):
    user = require_super_admin()
    if isinstance(user, tuple):
        return user

    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    execute_query("DELETE FROM responses WHERE survey_id = ?", [id])
    execute_query("DELETE FROM surveys WHERE id = ?", [id])

    return jsonify({"message": "Survey deleted successfully"})

@app.route('/api/admin/stats')
def admin_stats():
    user = require_admin()
    if isinstance(user, tuple):
        return user

    if not get_db():
        return jsonify({"error": "Database not available"}), 500

    users_result = execute_query("SELECT role FROM users")
    role_counts = {}
    if users_result:
        for row in users_result.fetchall():
            role = row[0]
            role_counts[role] = role_counts.get(role, 0) + 1

    surveys_result = execute_query("SELECT id, title FROM surveys")
    top_surveys = []
    if surveys_result:
        for row in surveys_result.fetchall():
            resp_result = execute_query("SELECT COUNT(*) FROM responses WHERE survey_id = ?", [row[0]])
            count = 0
            if resp_result:
                rows = resp_result.fetchall()
                count = rows[0][0] if rows else 0
            top_surveys.append({
                "id": row[0],
                "title": row[1],
                "response_count": count
            })
    top_surveys.sort(key=lambda x: x["response_count"], reverse=True)

    total_result = execute_query("SELECT COUNT(*) FROM surveys")
    published_result = execute_query("SELECT COUNT(*) FROM surveys WHERE is_published = 1")
    responses_result = execute_query("SELECT COUNT(*) FROM responses")

    total = total_result.fetchall()[0][0] if total_result and total_result.fetchall() else 0
    published = published_result.fetchall()[0][0] if published_result and published_result.fetchall() else 0
    responses = responses_result.fetchall()[0][0] if responses_result and responses_result.fetchall() else 0
    users_count = len(role_counts.values()) if role_counts else 0

    return jsonify({
        "stats": {
            "totalUsers": users_count,
            "totalSurveys": total,
            "publishedSurveys": published,
            "totalResponses": responses
        },
        "topSurveys": top_surveys[:10],
        "userRoles": [{"role": r, "count": c} for r, c in role_counts.items()]
    })
