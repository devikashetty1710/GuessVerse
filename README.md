# 🎮 GuessVerse

**GuessVerse** is a premium, infinite pop-culture trivia game designed with a modern glassmorphic aesthetic. Test your knowledge across Movies, Songs, and Celebrities in a high-stakes, timed challenge!

![GuessVerse Preview](https://img.shields.io/badge/UI-Glassmorphism-purple?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

---

## ✨ Features

- **💎 Premium Glassmorphism UI**: A stunning visual experience with animated mesh-gradient backgrounds, backdrop blurs, and glowing accents.
- **♾️ Infinite Gameplay**: No limits! Play through an ever-expanding library of questions.
- **🧠 Intelligent Answer Matching**: Sophisticated fuzzy-match logic accepts partial answers (e.g., typing "Messi" correctly guesses "Lionel Messi").
- **🔍 Live Autocomplete**: Real-time suggestions powered by a hybrid of local data and the **Wikipedia OpenSearch API**.
- **🏆 Global Leaderboard**: Track your high scores in the "Hall of Fame" with local storage persistence.
- **💡 Strategic Hint System**: Use up to 3 clues per question. The faster you guess with fewer hints, the higher you score!
- **📱 Fully Responsive**: Optimized for a seamless experience on desktops, tablets, and smartphones.

---

## 🛠️ Tech Stack

- **Frontend**: React.js (Hooks, Functional Components)
- **Styling**: Vanilla CSS3 (Custom Variables, Keyframe Animations, Glassmorphism)
- **Build Tool**: Vite
- **Data**: Centralized `questions.js` database
- **APIs**: Wikipedia OpenSearch API for live suggestions
- **Deployment**: GitHub Pages

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/devikashetty1710/GuessVerse.git
   cd GuessVerse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 📦 Deployment

This project is configured for one-click deployment to **GitHub Pages**.

To deploy your own version:
1. Update the `base` property in `vite.config.js` to match your repository name.
2. Run:
   ```bash
   npm run deploy
   ```

---

## 📖 How to Play

1. **Enter your name** on the home screen.
2. **Choose a category**: 🎬 Movies, 🎵 Songs, or ⭐ Celebrities.
3. **Analyze the clues**: Clue #1 is free. Use the "HINT" button to reveal more clues (at a point cost).
4. **Type your guess**: Use the autocomplete suggestions for speed!
5. **Climb the leaderboard** and become a GuessVerse Legend!

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Built with ❤️ by [Devika Shetty](https://github.com/devikashetty1710)*
