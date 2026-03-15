# 🧊 IceStack

**IceStack** is a strategic web-based block puzzle game built using **React + TypeScript + HTML5 Canvas**.
Inspired by modern block placement games, IceStack introduces a unique **Freeze / Unfreeze mechanic** that allows players to delay line clears and trigger powerful combo bursts.

The project focuses on **clean frontend architecture, modular game logic, and interactive UI design**.

---

# 🎮 Gameplay

IceStack is played on a **10×10 grid**. Instead of falling blocks like traditional Tetris-style games, players receive **three random blocks at a time** and can place them anywhere on the board.

### Core Rules

* The board is a **10×10 grid**
* Players receive **3 blocks simultaneously**
* Blocks can be **dragged and placed anywhere on the grid**
* A **row or column clears** when it becomes completely filled
* After using all 3 blocks, **three new blocks are generated**

### Game Over

The game ends when **none of the available blocks can be placed anywhere on the board**.

---

# ❄️ Freeze Mechanic (Unique Feature)

IceStack introduces a special **Freeze Mode**.

When **Freeze Mode is enabled**:

* Completed rows and columns **do not clear immediately**
* They become **frozen lines**
* Frozen lines remain on the board

When the player presses **Unfreeze**:

* All frozen rows and columns clear **simultaneously**
* A **combo bonus** is applied depending on how many lines clear together
* Visual effects (confetti) celebrate the combo

This mechanic adds a layer of **strategy and planning** not found in traditional puzzle games.

---

# ✨ Features

* 🧩 Drag-and-drop block placement
* ❄️ Freeze / Unfreeze combo mechanic
* 🎆 Confetti effects on big clears
* 🏆 Leaderboard scoring system
* 🎨 Theme selector
* 📖 In-game rules panel
* 📱 Responsive UI layout
* ⚡ Fast development with Vite

---

# 🏗️ Tech Stack

* **React**
* **TypeScript**
* **HTML5 Canvas**
* **Vite**
* **CSS**

The project strictly uses **React functional components and hooks** with a clean separation between UI and game logic.

---

# 📂 Project Structure

```
src
├── components
│   ├── BlockTray.tsx
│   ├── Controls.tsx
│   ├── GameBoard.tsx
│   ├── Leaderboard.tsx
│   ├── Rules.tsx
│   ├── Sidebar.tsx
│   └── ThemeSelector.tsx
│
├── game
│   ├── engine.ts
│   ├── shapes.ts
│   ├── types.ts
│   ├── confetti.ts
│   └── useGameState.ts
│
├── assets
│
├── App.tsx
├── main.tsx
└── index.css
```

### Architecture Overview

**Game Engine Layer (`/game`)**

* Handles grid state
* Block placement validation
* Line detection
* Freeze / Unfreeze mechanics
* Scoring logic

**UI Layer (`/components`)**

* Game board rendering
* Block tray interface
* Controls and UI panels
* Theme switching
* Leaderboard display

This separation keeps the codebase **modular and maintainable**.

---

# 🚀 Running the Project

### 1. Clone the repository

```
git clone https://github.com/yourusername/icestack.git
```

### 2. Install dependencies

```
npm install
```

### 3. Run development server

```
npm run dev
```

Then open:

```
http://localhost:5173
```

---

# 🎯 Project Goals

This project was built to demonstrate:

* Clean **React architecture**
* Modular **game engine design**
* Interactive **canvas-based UI**
* Custom **game mechanics implementation**

IceStack serves as a portfolio project showcasing **frontend engineering and game logic development**.

---

# 📜 License

This project is open source and available under the **MIT License**.
