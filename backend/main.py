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
    # 這行會在 backend 資料夾生出一個 users.db 檔案
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            dob TEXT,
            email TEXT UNIQUE,
            phone TEXT,
            password TEXT
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