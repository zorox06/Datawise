<p align="center">
  <img src="public/icon.svg" alt="Datawise Logo" width="64" height="64" />
</p>

<h1 align="center">DATAWISE</h1>

<p align="center">
  <strong>AI-Powered Data Science Analyst — Entirely in Your Browser</strong>
</p>

<p align="center">
  Upload CSV files. Get instant statistics, beautiful visualizations, and professional AI-generated reports.<br/>
  <em>Zero data leaves your machine.</em>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#license">License</a>
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **📊 Instant Statistics** | Automatic column type detection (numeric, categorical, date), descriptive stats (mean, median, std dev, IQR), skewness, and outlier detection |
| **📈 6 Chart Types** | Bar, Line, Area, Pie, Scatter, and Radar — all interactive with premium glassmorphic tooltips |
| **🤖 AI-Powered Reports** | One-click generation of comprehensive Markdown reports with executive summary, correlation analysis, data quality assessment, and actionable recommendations |
| **🔒 100% Client-Side** | All computation runs locally in the browser — no data is ever transmitted to any server |
| **🔐 Authentication** | Full auth flow (sign-up, login, email verification) powered by Supabase |
| **🎨 Premium UI** | Dark-mode-first design with glassmorphism, micro-animations, ambient 3D scenes, and custom typography |
| **📥 Import & Export** | Upload CSV/TSV files; export processed data or download AI reports as Markdown |
| **📱 Responsive** | Fully responsive from mobile to ultra-wide desktop |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | TypeScript |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + custom design tokens |
| **UI Components** | [Radix UI](https://www.radix-ui.com/) primitives + [shadcn/ui](https://ui.shadcn.com/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **3D Ambient** | [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [Three.js](https://threejs.org/) |
| **Auth & Backend** | [Supabase](https://supabase.com/) (Auth, SSR middleware) |
| **CSV Parsing** | [PapaParse](https://www.papaparse.com/) |
| **Markdown** | [React Markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm) |
| **Analytics** | [Vercel Analytics](https://vercel.com/analytics) |
| **Fonts** | Instrument Sans, Instrument Serif, JetBrains Mono (Google Fonts) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm**, **yarn**, or **pnpm**
- A [Supabase](https://supabase.com/) project (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/zorox06/Datawise.git
cd Datawise
```

### 2. Install dependencies

```bash
npm install
# or
pnpm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Tip:** You can find these values in your Supabase dashboard under **Settings → API**.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Landing Page                         │
│  Navigation • Hero • Features • Pricing • Footer         │
└────────────────────────┬─────────────────────────────────┘
                         │ Auth (Supabase)
┌────────────────────────▼─────────────────────────────────┐
│                   Dashboard (/dashboard)                  │
│                                                          │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌───────┐ │
│  │   Data   │  │ Statistics │  │ Visualize │  │  AI   │ │
│  │ Preview  │  │   Panel    │  │  (Charts) │  │Report │ │
│  └──────────┘  └────────────┘  └───────────┘  └───────┘ │
│        ▲              ▲              ▲            ▲      │
│        └──────────────┴──────────────┴────────────┘      │
│                    data-analyzer.ts                       │
│         (local stats engine — runs in browser)           │
└──────────────────────────────────────────────────────────┘
```

### How It Works

1. **Upload** — User drops a CSV/TSV file or loads demo data
2. **Parse** — PapaParse streams the file and auto-detects types
3. **Analyze** — The local stats engine computes descriptive statistics, Pearson correlations, outlier detection (IQR method), and skewness for every column
4. **Visualize** — Recharts renders interactive charts with configurable axes
5. **Report** — A comprehensive Markdown report is generated locally and streamed to the UI with a typewriter effect

---

## 📁 Project Structure

```
Datawise/
├── app/
│   ├── auth/               # Auth pages (login, sign-up, callback, error)
│   ├── dashboard/          # Protected dashboard page
│   ├── home/               # Home route
│   ├── layout.tsx          # Root layout (fonts, metadata, analytics)
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles & Tailwind config
├── components/
│   ├── dashboard/
│   │   ├── data-analyst-dashboard.tsx   # Core dashboard (data, stats, charts, report)
│   │   └── ambient-scene.tsx           # 3D ambient background
│   ├── landing/
│   │   ├── hero-section.tsx            # Hero with blur-word animation
│   │   ├── features-section.tsx        # Feature cards
│   │   ├── how-it-works-section.tsx    # Step-by-step guide
│   │   ├── pricing-section.tsx         # Pricing tiers
│   │   ├── security-section.tsx        # Privacy & security info
│   │   ├── integrations-section.tsx    # Supported integrations
│   │   ├── metrics-section.tsx         # Platform metrics
│   │   ├── infrastructure-section.tsx  # Infrastructure details
│   │   ├── developers-section.tsx      # Developer-focused section
│   │   ├── cta-section.tsx             # Call to action
│   │   ├── footer-section.tsx          # Footer
│   │   ├── navigation.tsx              # Top navigation bar
│   │   └── ascii-scene.tsx             # ASCII art decoration
│   └── ui/                 # shadcn/ui primitives
├── lib/
│   ├── data-analyzer.ts    # Statistical analysis engine
│   ├── supabase/           # Supabase client, server & middleware helpers
│   └── utils.ts            # Utility functions
├── hooks/                  # Custom React hooks (use-mobile, use-toast)
├── styles/                 # Additional global styles
├── public/                 # Static assets (icons, images)
├── middleware.ts           # Next.js middleware (Supabase session refresh)
└── package.json
```

---

## 📊 Statistical Engine

The local analysis engine (`lib/data-analyzer.ts`) provides:

- **Column type detection** — Automatically classifies columns as numeric, categorical, or date
- **Descriptive statistics** — Min, Max, Mean, Median, Std Dev, Q1, Q3
- **Outlier detection** — IQR-based method (1.5× IQR from Q1/Q3)
- **Skewness** — Fisher-Pearson standardized moment coefficient
- **Pearson correlation matrix** — Pairwise linear correlation between all numeric columns
- **Data quality scoring** — Completeness percentage, null distribution, cardinality analysis
- **Report generation** — Full Markdown report with executive summary, key findings, and recommendations

---

## 🔒 Privacy

Datawise is designed with privacy as a core principle:

- **No server-side data processing** — All CSV parsing, statistical computation, and report generation happen exclusively in the browser
- **No external API calls for data** — Your data never leaves your machine
- **Authentication only** — Supabase is used solely for user authentication, not for storing or processing uploaded data

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ using Next.js, Supabase & Recharts
</p>
