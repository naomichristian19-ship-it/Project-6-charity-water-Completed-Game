# Water Goal Challenge Starter

A guided coding scaffold for a browser game built with plain HTML, CSS, and JavaScript. Complete the `TODO` sections in `index.html`, `style.css`, and `script.js` to build the faucet and bottle visuals and implement the pour interaction.

## Run the game

Open `index.html` in a modern web browser, or use the VS Code Live Server extension for automatic browser refresh while editing. The game is intentionally incomplete until you fill in the TODO sections.

## Goal and score

In `script.js`, `startRound()` generates a random goal from 300 to 900 mL in 50 mL increments:

```js
goalMl = 300 + Math.floor(Math.random() * 13) * 50;
```

In `finishRound()`, under-pours score proportionally to the goal (half the goal earns 50 points). Over-pours start from 100 points and lose points proportional to the amount over the goal; the score cannot fall below zero. The round score is added to `totalScore`, which carries between rounds.

## Tools

- A code editor such as Visual Studio Code
- A modern web browser
- Optional: the Live Server VS Code extension

No package installation or build tools are required.
