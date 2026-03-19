<div align="center">

# 🚀 Production DevOps Pipeline

### Node.js · Jenkins CI/CD · AWS EC2 · ALB · Auto Scaling · Lambda · CloudWatch

[![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-D24939?style=for-the-badge&logo=jenkins&logoColor=white)](http://54.145.224.135:8080)
[![AWS EC2](https://img.shields.io/badge/AWS_EC2-Deployed-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](#)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse_Proxy-009639?style=for-the-badge&logo=nginx&logoColor=white)](#)
[![Lambda](https://img.shields.io/badge/AWS_Lambda-Monitoring-FF9900?style=for-the-badge&logo=awslambda&logoColor=white)](#)

> **A full production-grade DevOps system** — from a single `git push` to auto-scaled, load-balanced, monitored deployment on AWS. No deployment link — this project is about the infrastructure.

### 📐 Live Architecture Diagram
[View Here](https://samm11000.github.io/jenkins-ec2-alb-pipeline/)

</div>

---

## 📌 What This Project Is

Most web projects show a deployed link. **This project shows the infrastructure behind it.**

Every real production app — whether it's a startup or a Fortune 500 — runs on a system like this. This repository is a complete implementation of that system, built from scratch:

- Code lives on **GitHub**
- Every push triggers **Jenkins** to build, test, and deploy automatically
- App runs on **EC2** behind **Nginx** as a reverse proxy
- **Application Load Balancer** distributes traffic across multiple instances
- **Auto Scaling Group** adds/removes instances based on CPU load
- **Lambda** pings the app every 5 minutes and sends **email alerts** on failure
- Everything is logged in **CloudWatch**

---

## 🏗️ Architecture

```
Developer (git push)
        │
        ▼
   ┌─────────┐     webhook     ┌──────────────────────────────────────────┐
   │  GitHub │ ─────────────► │              Jenkins Pipeline              │
   │  (SCM)  │                │  Checkout → Build → Test → Deploy → Verify│
   └─────────┘                └──────────────────┬───────────────────────┘
                                                  │ SSH (ec2-ssh-key)
                                                  ▼
                                         ┌─────────────────┐
                                         │   EC2 Instance   │
                                         │  Nginx :80       │
                                         │  └→ Node.js :3000│
                                         │     └→ PM2       │
                                         └─────────────────┘
                                                  ▲
                              ┌───────────────────┴──────────────────────┐
                              │           AWS Production Layer            │
                              │                                           │
                              │   Internet → ALB → Target Group           │
                              │                    ├── EC2 #1 (AZ-1a)    │
                              │                    └── EC2 #2 (AZ-1b)    │
                              │                    Auto Scaling Group     │
                              │                    (Min:1, Max:3)         │
                              └───────────────────────────────────────────┘
                                                  │
                              ┌───────────────────┴──────────────────────┐
                              │           Monitoring Layer                │
                              │                                           │
                              │   EventBridge (cron) → Lambda             │
                              │        └→ /check endpoint                 │
                              │        └→ CloudWatch Logs                 │
                              │        └→ CloudWatch Alarm                │
                              │              └→ SNS → Email Alert         │
                              └───────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Source Control** | GitHub | Code versioning, webhook trigger |
| **CI/CD** | Jenkins (Freestyle → Pipeline) | Automated build, test, deploy |
| **Runtime** | Node.js 20.x + Express | Application server |
| **Process Manager** | PM2 | App lifecycle, auto-restart, logs |
| **Reverse Proxy** | Nginx | Port 80→3000, production hardening |
| **Cloud** | AWS EC2 (Ubuntu 22.04) | Virtual server |
| **Machine Image** | AWS AMI | Golden image for scaling |
| **Scaling** | AWS Auto Scaling Group | Min 1, Max 3, CPU-based policy |
| **Load Balancer** | AWS ALB | Traffic distribution, health checks |
| **Serverless** | AWS Lambda (Node.js 20.x) | Health monitoring function |
| **Scheduler** | AWS EventBridge | Cron trigger every 5 minutes |
| **Monitoring** | AWS CloudWatch | Logs, metrics, alarms, dashboard |
| **Alerting** | AWS SNS | Email notification on failure |
| **SSH Auth** | RSA Key Pair | Jenkins → EC2 secure deployment |

---

## 📂 Repository Structure

```
my-app/
├── app.js              # Express server — Apple clone landing page
├── package.json        # Node.js dependencies
├── Jenkinsfile         # Pipeline as Code — all 5 stages defined here
├── .gitignore          # node_modules, *.pem excluded
└── README.md           # This file
```

---

## ⚙️ Jenkinsfile — Pipeline as Code

```groovy
pipeline {
    agent any
    environment {
        EC2_IP   = '54.145.224.135'
        EC2_USER = 'ubuntu'
        APP_DIR  = '/home/ubuntu/project'
        ALB_DNS  = '<alb-dns>.elb.amazonaws.com'
    }
    stages {
        stage('Checkout')  { ... }   // Pull from GitHub
        stage('Build')     { ... }   // npm install
        stage('Test')      { ... }   // Smoke test on localhost:3000
        stage('Deploy')    { ... }   // SSH → git pull → pm2 restart → nginx reload
        stage('Verify')    { ... }   // curl ALB /check — real user path confirmed
    }
    post {
        success { echo "Live at http://${ALB_DNS}" }
        failure { echo 'Check console output' }
    }
}
```

**Why Jenkinsfile over Freestyle jobs?**
- Pipeline config lives in Git — full history, code review, rollback
- Team members can modify pipeline via PR — no Jenkins UI access needed
- `Pipeline as Code` is the industry standard in every real DevOps team

---

## 🔄 CI/CD Flow — What Happens on Every Push

```
1.  git push origin main
        │
2.  GitHub receives push event
        │
3.  GitHub fires webhook → POST http://54.145.224.135:8080/github-webhook/
        │
4.  Jenkins wakes up — "Started by GitHub push by Samm11000"
        │
5.  Stage: Checkout
    └── Jenkins pulls latest code from GitHub
        │
6.  Stage: Build
    └── npm install (installs/updates Express)
        │
7.  Stage: Test
    └── node app.js & → sleep 2 → curl localhost:3000/check → kill
    └── Confirms app actually boots before deploying
        │
8.  Stage: Deploy
    └── sshagent['ec2-ssh-key'] → SSH into EC2
    └── cd /home/ubuntu/project
    └── git pull origin main
    └── npm install
    └── pm2 restart my-app
    └── sudo systemctl reload nginx
        │
9.  Stage: Verify
    └── curl http://ALB_DNS/check
    └── Confirms real user traffic path works post-deploy
        │
10. post { success } — Pipeline complete ✅
```

**Total time: ~2 minutes from push to live**

---

## 🌐 Application Endpoints

| Endpoint | Description |
|---|---|
| `GET /` | Apple clone landing page — full HTML/CSS/JS |
| `GET /check` | Health check — returns JSON status + timestamp |

```json
// GET /check response
{
  "status": "OK",
  "message": "App is running fine!",
  "timestamp": "2025-03-18T10:00:00.000Z"
}
```

---

## ☁️ AWS Infrastructure Details

### EC2 Configuration
- **Instance type:** t2.micro (free tier)
- **OS:** Ubuntu Server 22.04 LTS
- **Region:** us-east-1
- **Security Group:** Port 22 (SSH), Port 80 (HTTP from ALB only)
- **Port 3000:** Not exposed to internet — accessible only via Nginx internally

### AMI Strategy
- Named: `my-app-ami-v1`
- Created after full setup — Node.js, Nginx, PM2, app code all baked in
- ASG uses this AMI to launch identical instances
- User data script runs `git pull + pm2 restart` on boot for latest code

### Auto Scaling Group
| Setting | Value |
|---|---|
| Desired capacity | 2 |
| Minimum | 1 |
| Maximum | 3 |
| Scaling metric | Average CPU utilization |
| Scale out threshold | CPU > 50% |
| Health check | ELB health checks enabled |
| Multi-AZ | Yes (us-east-1a, us-east-1b) |

### Application Load Balancer
- **Scheme:** Internet-facing
- **Listener:** HTTP:80
- **Target Group:** `my-app-tg` — port 80 — `/check` health check
- **Health check interval:** 30 seconds
- **Unhealthy threshold:** 2 consecutive failures

### Security Group Architecture
```
Internet → ALB Security Group (port 80/443)
                │
                ▼
         EC2 Security Group
         (port 80 from ALB-SG only — NOT from 0.0.0.0/0)
         (port 22 from your IP — SSH access)
```
This means EC2 instances are **not directly accessible** from the internet.

---

## ⚡ Lambda Health Monitor

```javascript
// Runs every 5 minutes via EventBridge cron
exports.handler = async (event) => {
  const result = await checkHealth(); // hits ALB /check endpoint
  
  if (result.healthy) {
    console.log('STATUS: HEALTHY ✅', result.responseTime + 'ms');
  } else {
    console.error('STATUS: UNHEALTHY ❌', result.error);
    // CloudWatch alarm triggers → SNS → email alert
  }
  
  return { statusCode: 200, body: JSON.stringify(result) };
};
```

**Monitoring chain:**
```
EventBridge (rate 5min) → Lambda → /check endpoint
                                        │
                          healthy ──────┤
                                        │
                          unhealthy ────► CloudWatch Alarm
                                              │
                                              ▼
                                         SNS Topic
                                              │
                                              ▼
                                        Email Alert 📧
```

---

## 🔐 Security Practices Implemented

| Practice | Implementation |
|---|---|
| **No secrets in code** | Jenkins credentials store for SSH key |
| **Principle of least privilege** | Lambda IAM role — only CloudWatch write |
| **Port hardening** | EC2 port 80 accepts only from ALB security group |
| **SSH key rotation ready** | Deploy key separate from access key |
| **`.pem` never in git** | `.gitignore` blocks `*.pem` |
| **`node_modules` not in git** | `.gitignore` — `npm install` on each deploy |
| **Sudo scoped** | `ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx` only |

---

## 📊 What You'd See in Production

**CloudWatch Dashboard:**
- Lambda invocations per hour
- Average response time (ms)
- Error count
- ALB healthy host count

**Jenkins Console (on every push):**
```
Started by GitHub push by Samm11000
Obtained Jenkinsfile from git https://github.com/Samm11000/my-app
[Pipeline] Checkout  ✅
[Pipeline] Build     ✅  (npm install — 65 packages)
[Pipeline] Test      ✅  (smoke test passed)
[Pipeline] Deploy    ✅  (SSH → pm2 restart → nginx reload)
[Pipeline] Verify    ✅  (ALB health check confirmed)
Finished: SUCCESS
```

---

## 🚀 Local Setup

```bash
# Clone
git clone https://github.com/Samm11000/my-app.git
cd my-app

# Install
npm install

# Run
node app.js

# Test
curl http://localhost:3000/check
```

---

## 📈 What I Learned Building This

This project covers the **core DevOps lifecycle** end to end:

- **Version Control** — Git branching, commit conventions, `.gitignore` best practices
- **CI/CD** — Jenkins Pipeline as Code, webhook triggers, multi-stage pipelines
- **Linux Administration** — Ubuntu, systemd services, file permissions, sudoers
- **Networking** — Ports, reverse proxying, security groups, HTTP headers
- **AWS Core** — EC2, AMI, ASG, ALB, Target Groups, IAM, VPC, AZs
- **Serverless** — Lambda execution model, EventBridge scheduling, cold starts
- **Observability** — CloudWatch logs, metrics, alarms, SNS notifications
- **Security** — Least privilege, no secrets in code, network isolation

---

## 👤 Author

**Samm11000** — [@Samm11000](https://github.com/Samm11000)

---

<div align="center">
<sub>Built with ☕ and a lot of SSH sessions</sub>
</div>
