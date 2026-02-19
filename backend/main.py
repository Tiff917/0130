from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
import sqlite3

app = FastAPI()

# 1. 解決跨域問題（讓前端網頁能抓到後端資料）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 專題期間設為 * 最方便測試
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 定義資料格式（對應你的 HTML 欄位）
class UserRegister(BaseModel):
    name: str
    dob: str
    email: EmailStr
    phone: str
    password: str

# 3. 初始化資料庫
def init_db():
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            dob TEXT,
            email TEXT UNIQUE,
            phone TEXT,
            password TEXT,
            is_premium INTEGER DEFAULT 0  -- 0 代表普通人，1 代表 VIP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# 4. 註冊 API 接口
@app.post("/register")
async def register(user: UserRegister):
    try:
        conn = sqlite3.connect("users.db")
        cursor = conn.cursor()
        # 將資料存入資料庫
        cursor.execute(
            "INSERT INTO users (name, dob, email, phone, password) VALUES (?, ?, ?, ?, ?)",
            (user.name, user.dob, user.email, user.phone, user.password)
        )
        conn.commit()
        conn.close()
        return {"status": "success", "message": "註冊成功！"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="這個 Email 已經被註冊過了喔！")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"伺服器出錯：{str(e)}")

# 5. 測試用：查看所有帳號 (正式上線要刪除)
@app.get("/users")
async def get_users():
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute("SELECT name, email FROM users")
    data = cursor.fetchall()
    conn.close()
    return data

class PremiumRequest(BaseModel):
    email: str

@app.post("/upgrade_member")
async def upgrade_member(req: PremiumRequest):
    try:
        conn = sqlite3.connect("users.db")
        cursor = conn.cursor()
        # 根據 Email 找到該用戶並把 is_premium 改成 1
        cursor.execute("UPDATE users SET is_premium = 1 WHERE email = ?", (req.email,))
        conn.commit()
        conn.close()
        return {"status": "success", "message": "會員已升級為 Premium"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/check_vip/{email}")
async def check_vip(email: str):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    # 查詢該 Email 的 is_premium 狀態
    cursor.execute("SELECT is_premium FROM users WHERE email = ?", (email,))
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return {"is_vip": bool(result[0])}
    return {"is_vip": False}