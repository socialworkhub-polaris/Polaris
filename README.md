# Polaris — Sozialarbeiter-Kompass Berlin

> **Socio-Legal Triage & Resource-Matching Engine for Frontline Social Workers**  
> Schnittstelle zwischen Behörden (Ämtern) und freien Trägern.

Polaris assists social workers and frontline practitioners in navigating Berlin's complex social welfare landscape. It provides instant socio-legal routing, statutory safeguards, interactive facility mapping, multi-language client handoff slips, and step-by-step crisis intervention plans.

---

## 🌟 Key Features

* **Socio-Legal Triage Wizard (`/api/triage`):**
  * **0-Token Deterministic Safeguards:** Hard-coded statutory filters preventing routing errors (e.g., minors $<18$ locked to SGB VIII and blocked from adult homeless shelters; strict municipal jurisdiction matching).
  * **AI Stufenplan Generation (Mistral AI EU):** Generates structured 2–3 phase emergency roadmaps (`sofort`, `behoerde`, `beratung`) citing German statutory laws (§ 8a SGB VIII, § 36 SGB XII, ASOG Berlin) with required documents checklists. 100% EU-hosted & DSGVO / § 35 SGB I compliant.
* **1-Click Multi-Language Translation (`/api/translate`):**
  * Translates the client action plan and required document checklist into **Ukrainian (🇺🇦), English (🇬🇧), Polish (🇵🇱), Arabic (🇸🇾), and Russian (🇷🇺)** for non-German speaking clients.
* **High-Performance Database (Supabase PostgreSQL):**
  * Sub-50ms query latency across 119 verified Berlin social work agencies and emergency facilities.
  * Resilient fallback chain: Supabase → Notion API → Static datasets.
* **Frontline Client Handoff (`ClientPrintModal` & Triage Print):**
  * Clean, print-ready referral slips featuring directions, open walk-in hours, and checklists for casework documentation.
* **Neural Web Search Fallback (Exa AI):**
  * Live web search to surface unlisted emergency facilities or specialized community programs.
* **API Abuse Protection:**
  * In-memory sliding-window token-bucket rate limiting across all AI and search endpoints.

---

## 🛠️ Tech Stack

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Database:** [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security)
* **Mapping:** [Leaflet](https://leafletjs.com/), [React-Leaflet](https://react-leaflet.js.org/) & [Protomaps PMTiles](https://protomaps.com/) (100% DSGVO / § 35 SGB I konform, Self-Hosted Vector Tiles & LOR-Zuständigkeitsgrenzen)
* **AI & Search:** Mistral AI (EU-hosted `mistral-small-latest` via Paris data centers) & Exa Neural Search
* **Icons:** [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js 18+ (tested on Node v20/v24)
* A [Supabase](https://supabase.com/) project

### 2. Installation
```bash
git clone <your-repo-url>
cd socialworkhub
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# AI & Search (100% EU Data Residency)
MISTRAL_API_KEY=<your-mistral-api-key>
AI_BASE_URL=https://api.mistral.ai/v1
AI_MODEL=mistral-small-latest
EXA_API_KEY=<your-exa-api-key>
```

### 4. Database Setup
1. Open your Supabase Project Dashboard → **SQL Editor**.
2. Run the script located in `supabase/setup.sql`.
   * Creates the `facilities` table, indexes, and RLS policies.
   * Seeds 119 core Berlin social work institutions.

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## ⚖️ Socio-Legal Compliance & Safeguards

Polaris is designed specifically for professional caseworkers. Client data entered into the triage wizard is processed ephemerally in memory and is **never** permanently stored with personal identifying information (PII).

---

## 📄 License

Proprietary / All rights reserved — SocialWorkHub Polaris Project.
