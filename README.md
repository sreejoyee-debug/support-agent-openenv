---
title: SupportAgent OpenEnv
emoji: 🎧
colorFrom: purple
colorTo: indigo
sdk: docker
pinned: false
app_port: 3000
tags:
  - openenv
---

# 🎧 SupportAgent OpenEnv

[![OpenEnv Spec](https://img.shields.io/badge/OpenEnv-v1.0.0-blueviolet?style=for-the-badge)](https://github.com/openenv/spec)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

> **A high-fidelity simulation of a customer support agent's workflow. Train and evaluate agents on real-world reasoning, tool use, and information synthesis.**

---

## 🚀 Overview

**SupportAgent OpenEnv** moves beyond toy problems and games. It provides a robust, tool-rich environment where AI agents must act as professional support representatives. Agents navigate a simulated ecosystem of knowledge bases, user profiles, and order databases to resolve complex customer issues.

### 🎯 Why this environment?
- **Real-World Utility**: Models actual business processes (Refunds, Tech Support, Account Recovery).
- **Tool-Centric**: Forces agents to use `search_kb`, `get_user`, and `get_order` effectively.
- **Partial Progress**: Reward functions provide signals throughout the trajectory, not just at the end.
- **Interactive Dashboard**: Includes a built-in React UI for manual testing and visualization.

---

## 🛠️ Action & Observation Space

### 🕹️ Actions
| Action | Parameters | Description |
| :--- | :--- | :--- |
| `search_kb` | `query: str` | Search the Knowledge Base for articles. |
| `get_user` | `user_id: str` | Fetch user tier, contact info, and history. |
| `get_order` | `order_id: str` | Retrieve order status, date, and tracking. |
| `reply` | `message: str` | Communicate with the customer. |
| `resolve` | `None` | Close the ticket (triggers grading). |

### 👁️ Observations
The agent receives a structured state containing the **Ticket Description**, **KB Results**, **User/Order Data**, and a **History of Sent Messages**.

---

## 📋 Tasks & Graders

| Task | Difficulty | Objective |
| :--- | :--- | :--- |
| **Password Reset** | 🟢 Easy | Find the reset link in KB and provide it. |
| **Refund Check** | 🟡 Medium | Cross-reference order date with refund policy. |
| **Tech Protocol** | 🔴 Hard | Follow multi-step troubleshooting (Logs -> OS -> Fix). |

*Every task includes a deterministic **Grader** that evaluates performance on a scale of `0.0` to `1.0`.*

---

## ⚡ Quick Start

### 🐳 Using Docker (Recommended)
```bash
docker build -t support-agent-env .
docker run -p 3000:3000 support-agent-env
```
*Access the interactive dashboard at `http://localhost:3000`*

### 🐍 Local Setup
1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Launch Environment**:
   ```bash
   python app.py
   ```
3. **Run Baseline Agent**:
   ```bash
   export OPENAI_API_KEY="your_key"
   export API_BASE_URL="your_url"
   export MODEL_NAME="gpt-4o"
   python inference.py
   ```

---

## 📊 Baseline Performance

| Task | Score |
| :--- | :--- |
| Password Reset | `1.00` |
| Refund Check | `0.80` |
| Tech Protocol | `0.70` |
| **Overall** | **`0.83`** |

---

## 📂 Project Structure

```text
├── app.py              # FastAPI Server Entry
├── environment.py      # Core Logic & State Machine
├── models.py           # Pydantic Spec Models
├── tasks.py            # Task Definitions & Graders
├── inference.py        # Baseline Agent Script
├── openenv.yaml        # Environment Metadata
├── Dockerfile          # Containerization Spec
└── src/                # Interactive Dashboard (React)
```

---

## 🤝 Contributing
Contributions are welcome! Please ensure any new tasks include a corresponding grader in `tasks.py` and follow the OpenEnv specification.

---
*Built for the OpenEnv Challenge.*
