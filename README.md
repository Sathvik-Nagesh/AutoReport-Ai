# AutoReport AI - Dynamic Edition 🚀

AutoReport AI is a production-grade, full-stack project analyzer designed to synthesize deep architectural intelligence from raw codebases. Upload any ZIP file, and let the AI instantly generate university-standard academic reports, Mermaid diagrams, and deployment strategies.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)
![Framer Motion](https://img.shields.io/badge/Framer--Motion-6366F1?style=for-the-badge&logo=framer)

## ✨ Core Features

- **📂 Deep Project Analysis**: Analyzes file structures, `package.json`, and core code snippets to deduce frameworks, logic flow, and system architecture.
- **⚡ Live Streaming Reports**: Experience real-time report generation using heavy streaming protocols (Vercel AI SDK style).
- **📊 Interactive Architecture Diagrams**: Native rendering of Mermaid.js diagrams to visualize your project structure instantly.
- **📚 Local Report Library**: Persistent storage for your past reports with full load, delete, and clear-all functionality.
- **🎓 University Formats**: Specialized templates for **Bangalore University (BCA)**, **VTU**, and Generic Software Architecture reports.
- **📄 Pro Export Options**: Export your synthesized intelligence directly to **PDF** (University Layout) or **DOCX** (.docx) with one click.
- **🤖 Multi-LLM Support**: Built-in support for **Google Gemini 2.0 Pro** and **OpenRouter** (GPT-4o, Claude 3, etc.).

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- Gemini API Key and/or OpenRouter API Key

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Sathvik-Nagesh/AutoReport-Ai.git
   cd AutoReport-Ai/autoreport-app
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:

   ```env
   GEMINI_API_KEY=your_gemini_key
   OPENROUTER_API_KEY=your_openrouter_key
   VERCEL_URL=localhost:3000
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router + Turbopack)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown**: [React Markdown](https://github.com/remarkjs/react-markdown)
- **Diagrams**: [Mermaid.js](https://mermaid.js.org/)
- **PDF Export**: [html2pdf.js](https://github.com/eKoopmans/html2pdf.js)
- **Word Export**: [docx](https://docx.js.org/)

## 📜 Academic Formats

- **Bangalore University BCA**: Strictly follows the standard synopsis format (Existing System, Proposed System, Objective, etc.).
- **VTU**: Follows the technical report layout (Literature Survey, Methodology, Implementation).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ by [Sathvik Nagesh](https://github.com/Sathvik-Nagesh)
