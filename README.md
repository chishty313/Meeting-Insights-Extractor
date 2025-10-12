# 🎯 Meeting Insights Extractor

An AI-powered tool that extracts structured insights from meeting audio files or transcripts using Azure OpenAI and Google Gemini.

## ✨ Features

- **🎵 Audio Processing**: Upload audio files and get AI-generated transcripts with timestamps
- **📝 Transcript Mode**: Paste or upload existing transcripts with speaker labels and timestamps
- **📹 Zoom Mode**: Directly fetch transcripts from Zoom meeting recordings
- **🎯 Smart Trimming**: Remove unwanted sections from transcripts using natural language instructions
- **👥 Speaker Labeling**: Automatically identify and label speakers
- **📊 Structured Summaries**: Get organized insights with:
  - Executive Overview
  - To-Do List (Actions & Takeaways) organized by person
- **🤖 AI-Powered**: Azure GPT-5 for optimal results
- **⚙️ Custom System Prompts**: Tailor the AI's analysis to your needs
- **📁 Multiple File Formats**: Support for .txt, .vtt, and audio files

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Azure OpenAI API key (required)
- Google Gemini API key (optional)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/chishty313/Meeting-Insights-Extractor.git
   cd Meeting-Insights-Extractor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   # Required for all modes
   AZURE_OPENAI_API_KEY=your_azure_key_here
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2025-01-01-preview
   
   # Optional - for Gemini fallback
   GEMINI_API_KEY=your_gemini_key_here
   
   # Optional - for Zoom mode
   ZOOM_CLIENT_ID=your_zoom_client_id_here
   ZOOM_CLIENT_SECRET=your_zoom_client_secret_here
   ZOOM_ACCOUNT_ID=your_zoom_account_id_here
   ```

4. **Run the application:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🎵 Usage

### 🎵 Audio Mode
1. Upload an audio file (MP3, WAV, etc.)
2. Select your preferred transcription and summarization models
3. Click "Process Audio"
4. View the generated transcript with timestamps and structured insights

### 📝 Transcript Mode
1. Switch to "Transcript Mode"
2. Paste your transcript or upload a .txt/.vtt file
3. Optionally add trim instructions (e.g., "Remove sections from 5:30 to 8:45")
4. Click "Process Transcript"
5. View the structured insights

### 📹 Zoom Mode
1. Switch to "Zoom Mode"
2. Enter your Zoom Meeting ID
3. Click "Process Zoom Meeting"
4. View the fetched transcript and structured insights

### ✂️ Smart Trimming (Transcript Mode)
- Add natural language instructions like:
  - "Remove sections from 5:30 to 8:45"
  - "Skip the introduction and conclusion"
  - "Remove the technical discussion from 15:20 to 18:10"

## 🔧 Configuration

### Azure OpenAI Setup
1. Create an Azure OpenAI resource
2. Deploy models (GPT-4, Whisper)
3. Get your API key and endpoint
4. Add to `.env` file

### Google Gemini Setup
1. Get API key from [Google AI Studio](https://aistudio.google.com/)
2. Add to `.env` file

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 📁 Project Structure

```
├── components/          # React components
├── services/           # AI service integrations
├── pages/api/          # Next.js API routes
├── types.ts           # TypeScript definitions
├── constants.ts       # App constants
└── README.md          # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:
1. Check the [Issues](https://github.com/chishty313/Meeting-Insights-Extractor/issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce
