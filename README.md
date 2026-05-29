# Resume AI Backend — AI-Powered Career Agent API

A scalable backend service for an Agentic AI Resume Analyzer and Career Assistant. This API handles resume parsing, AI-powered resume analysis, ATS scoring, skill gap detection, job recommendations, learning roadmap generation, and personalized cover letter creation using LLM workflows.

## Features

* Resume Upload API — upload and process PDF resumes
* PDF Text Extraction — extracts readable text from uploaded resumes
* ATS Analysis — scores resumes based on ATS compatibility
* Skill Detection — identifies technical and professional skills
* Missing Skills Detection — finds missing skills relevant to target roles
* Job Recommendations — suggests matching career roles using AI
* Real Job Listings Integration — integrates with Arbeitnow and JSearch APIs
* Cover Letter Generator — generates personalized AI-powered cover letters
* Learning Roadmap Generator — creates personalized learning plans
* Agentic Workflow Orchestration — connects multiple AI tasks into one intelligent workflow
* MongoDB Storage — saves resume analysis history and generated outputs
* Modular Service Architecture — scalable structure using controllers, services, tools, and agents

## Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB + Mongoose

### AI & APIs

* Groq AI (llama-3.3-70b-versatile)
* Arbeitnow Jobs API
* JSearch API (RapidAPI)

### Other Tools

* Multer (file uploads)
* PDF Parser
* dotenv
* CORS

## Architecture

Routes
↓
Controllers
↓
Services / Tools
↓
Career Agent Workflow
↓
External APIs & AI Models
↓
MongoDB

## Future Improvements

* Browser automation agents using Playwright
* Multi-agent workflows
* Authentication system
* Resume rewriting AI
* Auto-apply job agents
* AI interview preparation system
