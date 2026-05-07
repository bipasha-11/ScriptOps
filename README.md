# ScriptOps: AI-Powered Film Production Assistant 🎬

**ScriptOps** is an advanced, full-stack application designed to revolutionize film pre-production. It analyzes screenplay text, automatically splits it into scenes, extracts logistical features (VFX, stunts, locations), calculates budget and risk estimates, and provides actionable insights powered by **Groq** and the **LLaMA 3.3** model.

![Stack](https://img.shields.io/badge/Stack-React_|_FastAPI_|_PostgreSQL-blue)
![AI](https://img.shields.io/badge/AI-Groq_LLaMA_3.3-orange)
![DB](https://img.shields.io/badge/Database-Neon_PostgreSQL-00E699)
![Deployment](https://img.shields.io/badge/Deployment-Render_|_Vercel-purple)
![Live](https://img.shields.io/badge/Live_Demo-ScriptOps-brightgreen?logo=vercel&link=https://scriptops.vercel.app/)

---

### 🔗 [Visit Live Application](https://scriptops.vercel.app/)
### ⚙️ [API Documentation (Backend)](https://scriptops-1.onrender.com/docs)

---

### ✨ Landing Page Experience
The ScriptOps landing page guides users through the core value propositions of AI-driven production.

| Hero Section | High-Level Vision |
| :---: | :---: |
| ![Landing Page](https://raw.githubusercontent.com/bipasha-11/ScriptOps/main/screenshots/landing%20page.png) | ![Landing Page 2](https://raw.githubusercontent.com/bipasha-11/ScriptOps/main/screenshots/landingpage2.png) |

| "Shatter the Narrative" (UI1) | "Detect Danger Early" (UI2) | "Precision Forecasting" (UI3) |
| :---: | :---: | :---: |
| ![UI1](https://raw.githubusercontent.com/bipasha-11/ScriptOps/main/screenshots/ui1.png) | ![UI2](https://raw.githubusercontent.com/bipasha-11/ScriptOps/main/screenshots/ui2.png) | ![UI3](https://raw.githubusercontent.com/bipasha-11/ScriptOps/main/screenshots/ui3.png) |

---

### 🔐 User Onboarding (Authentication)
A secure, streamlined entry point featuring real-time email verification and **persistent PostgreSQL storage**.

| Sign In | Create Account | OTP Verification |
| :---: | :---: | :---: |
| ![Sign In](https://raw.githubusercontent.com/bipasha-11/ScriptOps/main/screenshots/signin.png) | ![Sign Up](https://raw.githubusercontent.com/bipasha-11/ScriptOps/main/screenshots/signup.png) | ![OTP](https://raw.githubusercontent.com/bipasha-11/ScriptOps/main/screenshots/otp.png) |

---

### 🖥️ Core Dashboard & Analysis
The heart of the application, where data meets production strategy.

| Risk Analysis Heatmap | AI Script Intelligence (Chat) |
| :---: | :---: |
| ![Heatmap](https://raw.githubusercontent.com/bipasha-11/ScriptOps/main/screenshots/heatmap.png) | ![Chatbot](https://raw.githubusercontent.com/bipasha-11/ScriptOps/main/screenshots/chatbot.png) |

| Script Inventory Archive | Script Ingestion/Upload | User Configuration |
| :---: | :---: | :---: |
| ![Scripts](https://raw.githubusercontent.com/bipasha-11/ScriptOps/main/screenshots/scripts.png) | ![Upload](https://raw.githubusercontent.com/bipasha-11/ScriptOps/main/screenshots/upload.png) | ![Settings](https://raw.githubusercontent.com/bipasha-11/ScriptOps/main/screenshots/settings.png) |

---

### 🚀 Key Features
- **Automated Script Parsing**: Upload screenplays (`.txt`/`.pdf`) for instant scene tokenization and location extraction.
- **Persistent Data Storage**: All users, projects, and analyses are saved in a **Neon PostgreSQL** database for long-term accessibility.
- **Real-Time Simulation**: Tweak risk tolerance and crew matching weights via the new **System Config** dropdown to watch budgets recalculate instantly.
- **One-Click Exports**: Professional **PDF Reports** and **Final Draft (.FDX)** exports generated on-demand.
- **AI Production Assistant**: A context-aware chatbot (Powered by Groq) for deep script analysis and cost optimization.

---

## 💾 Data Architecture
ScriptOps utilizes a robust relational database schema managed by **SQLAlchemy** to ensure data integrity and persistence.

```mermaid
erDiagram
    USER ||--o{ PROJECT : "owns"
    PROJECT ||--o{ SCENE : "contains"
    USER {
        int id PK
        string email UK
        string password_hash
        timestamp created_at
    }
    PROJECT {
        int id PK
        string title
        text raw_text
        int owner_id FK
    }
    SCENE {
        int id PK
        int project_id FK
        int scene_number
        string slugline
        string scene_type
        float risk_score
        float budget
        json metadata_json
    }
```

---

## 🏗️ Architecture: The Intelligence Flow
1. **Parsing**: Screenplays are tokenized into discrete scenes.
2. **Extraction**: A feature-extraction layer identifies production requirements using NLP.
3. **Scoring**: The Risk Engine applies weighted multipliers (customizable by user) to calculate difficulty.
4. **Persistence**: Results are committed to the PostgreSQL cloud instance.
5. **Insight Generation**: Analysis data is passed to **Groq (LLaMA 3.3)** for strategic planning.

---

### Environment Variables
Configure the following in your cloud provider:
- `DATABASE_URL`: Connection string for your **Neon/PostgreSQL** instance.
- `GROQ_API_KEY`: Groq Inference Engine API key.
- `SENDGRID_API_KEY`: SendGrid API key for emails.
- `SENDGRID_FROM_EMAIL`: Verified SendGrid sender address.
- `JWT_SECRET`: Secret key for token generation.
- `FRONTEND_URL`: Your Vercel deployment URL (for CORS).

---

Distributed under the MIT License. See `LICENSE` for more information.

---
**Developed to demonstrate AI-driven automation in film production and production-ready cloud deployment.**
