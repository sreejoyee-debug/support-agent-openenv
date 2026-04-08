import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Mock Data
  const kb = {
    "password_reset": "To reset your password, go to https://example.com/reset and enter your email.",
    "refund_policy": "Refunds are allowed within 30 days of purchase if the product is unused.",
    "shipping_delay": "Current shipping delays are 3-5 business days due to high volume.",
    "technical_support": "For technical issues, please provide your OS version and error logs."
  };
  const users = {
    "user_123": { name: "Alice", email: "alice@example.com", tier: "Gold" },
    "user_456": { name: "Bob", email: "bob@example.com", tier: "Free" }
  };
  const orders = {
    "order_999": { id: "order_999", user_id: "user_123", status: "Delivered", date: "2026-03-15" },
    "order_888": { id: "order_888", user_id: "user_456", status: "Processing", date: "2026-04-01" }
  };

  const TASKS = [
    {
      id: "task_easy",
      name: "Password Reset Request",
      difficulty: "easy",
      config: {
        ticket_id: "TKT-001",
        description: "Hi, I can't log in. I forgot my password. Can you help?",
        user_id: "user_123",
        goal: "Provide the password reset link from the KB."
      }
    },
    {
      id: "task_medium",
      name: "Refund Eligibility Check",
      difficulty: "medium",
      config: {
        ticket_id: "TKT-002",
        description: "I want a refund for my order order_999. Is it possible?",
        user_id: "user_123",
        order_id: "order_999",
        goal: "Check order date and refund policy, then inform the user."
      }
    },
    {
      id: "task_hard",
      name: "Complex Technical Support",
      difficulty: "hard",
      config: {
        ticket_id: "TKT-003",
        description: "Your app keeps crashing when I try to upload a file. Fix it!",
        user_id: "user_456",
        goal: "Search KB for technical support protocol, ask for logs/OS, and resolve."
      }
    }
  ];

  let currentState: any = {
    currentTaskId: null,
    steps: 0,
    done: false,
    messagesSent: [],
    lastResult: "Environment not initialized.",
    kbResults: null,
    userData: null,
    orderData: null,
    rewardAccumulated: 0.0,
    history: []
  };

  // API Routes
  app.get("/tasks", (req, res) => {
    res.json(TASKS.map(t => ({ id: t.id, name: t.name, difficulty: t.difficulty })));
  });

  app.post("/reset", (req, res) => {
    const { task_id } = req.body;
    const task = TASKS.find(t => t.id === task_id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    currentState = {
      currentTaskId: task_id,
      steps: 0,
      done: false,
      messagesSent: [],
      lastResult: "Environment reset.",
      kbResults: null,
      userData: null,
      orderData: null,
      rewardAccumulated: 0.0,
      history: [],
      config: task.config
    };

    res.json({
      ticket_id: task.config.ticket_id,
      description: task.config.description,
      status: "Open",
      last_action_result: currentState.lastResult,
      messages_sent: []
    });
  });

  app.post("/step", (req, res) => {
    if (!currentState.currentTaskId) return res.status(400).json({ error: "No active task" });

    const { action_type, parameters } = req.body;
    currentState.steps++;
    let reward = 0.0;
    let explanation = "Action processed.";

    switch (action_type) {
      case "search_kb":
        const query = (parameters.query || "").toLowerCase();
        const results = Object.entries(kb)
          .filter(([k, v]) => k.includes(query) || v.toLowerCase().includes(query))
          .map(([k, v]) => v);
        currentState.kbResults = results;
        currentState.lastResult = `Found ${results.length} KB articles.`;
        reward = 0.1;
        break;
      case "get_user":
        const uid = parameters.user_id;
        if (users[uid]) {
          currentState.userData = users[uid];
          currentState.lastResult = `Retrieved data for user ${uid}.`;
          reward = 0.05;
        } else {
          currentState.lastResult = `User ${uid} not found.`;
          reward = -0.05;
        }
        break;
      case "get_order":
        const oid = parameters.order_id;
        if (orders[oid]) {
          currentState.orderData = orders[oid];
          currentState.lastResult = `Retrieved data for order ${oid}.`;
          reward = 0.05;
        } else {
          currentState.lastResult = `Order ${oid} not found.`;
          reward = -0.05;
        }
        break;
      case "reply":
        const msg = parameters.message || "";
        currentState.messagesSent.push(msg);
        currentState.lastResult = "Reply sent to customer.";
        reward = 0.1;
        break;
      case "resolve":
        currentState.done = true;
        currentState.lastResult = "Ticket marked as resolved.";
        reward = 0.1;
        break;
      default:
        currentState.lastResult = `Unknown action: ${action_type}`;
        reward = -0.1;
    }

    currentState.rewardAccumulated += reward;
    currentState.history.push({ action_type, parameters, reward });

    res.json({
      observation: {
        ticket_id: currentState.config.ticket_id,
        description: currentState.config.description,
        status: currentState.done ? "Resolved" : "Open",
        last_action_result: currentState.lastResult,
        kb_results: currentState.kbResults,
        user_data: currentState.userData,
        order_data: currentState.orderData,
        messages_sent: currentState.messagesSent
      },
      reward: { value: reward, explanation },
      done: currentState.done,
      info: {
        progress: Math.min(1.0, currentState.rewardAccumulated),
        task_completed: currentState.done,
        steps_taken: currentState.steps
      }
    });
  });

  app.get("/state", (req, res) => {
    res.json(currentState);
  });

  app.post("/grade", (req, res) => {
    // Simplified grading for preview
    let score = 0.0;
    if (currentState.done) score += 0.3;
    if (currentState.messagesSent.length > 0) score += 0.4;
    if (currentState.rewardAccumulated > 0.5) score += 0.3;
    res.json({ score });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
