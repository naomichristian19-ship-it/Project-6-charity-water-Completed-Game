const difficultyScreen = document.querySelector("#difficulty-screen");
const gameScreen = document.querySelector("#game-screen");
const restartGameButton = document.querySelector("#restart-game-button");
const changeDifficultyButton = document.querySelector("#change-difficulty-button");
const roundDisplay = document.querySelector("#round");
const goalDisplay = document.querySelector("#goal");
const amountDisplay = document.querySelector("#amount");
const scoreDisplay = document.querySelector("#score");
const bottleWater = document.querySelector("#bottle-water");
const waterStream = document.querySelector("#water-stream");
const faucetButton = document.querySelector("#faucet-button");
const finishButton = document.querySelector("#finish-button");
const gameResult = document.querySelector("#game-result");
const feedback = document.querySelector("#feedback");
const timerDisplay = document.querySelector("#timer");

const BOTTLE_CAPACITY_ML = 1000;
const TOTAL_ROUNDS = 3;
const MAX_ROUND_SCORE = 100;
const WINNING_SCORE = TOTAL_ROUNDS * MAX_ROUND_SCORE * 0.8;
const RESULT_DISPLAY_MS = 5000;
const RESULT_FADE_MS = 1000;
const FLOW_RATES = {
  easy: 40,
  medium: 70,
  hard: 120
};

let flowRateMlPerSecond = FLOW_RATES.medium;
const ROUND_TIME_SECONDS = 30;

let goalMl = 0;
let roundNumber = 1;
let roundGoals = [];
let pouredMl = 0;
let totalScore = 0;
let isPouring = false;
let roundComplete = false;
let pourStartedAt = 0;
let pourStartAmount = 0;
let animationFrame = null;
let timerValue = ROUND_TIME_SECONDS;
let countdown = null;
let resultFadeTimeout = null;
let resultHideTimeout = null;

function startRound() {
  goalMl = roundGoals[roundNumber - 1];

  pouredMl = 0;
  roundComplete = false;
  finishButton.hidden = true;
  clearGameResult();
  clearInterval(countdown);
  countdown = null;
  timerValue = ROUND_TIME_SECONDS;
  timerDisplay.textContent = `Time left: ${timerValue} seconds`;

  roundDisplay.textContent = roundNumber;
  goalDisplay.textContent = goalMl;
  faucetButton.textContent = "Start pouring";
  feedback.textContent = "Pour as close to the goal as you can by clicking the button."
  updateBottle();
}

function updateBottle() {
  amountDisplay.textContent = Math.floor(pouredMl);

  bottleWater.style.height = (pouredMl / BOTTLE_CAPACITY_ML * 100 + "%");
}

function pourFrame(timestamp) {
  if (!isPouring) return;

  pouredMl = Math.min(
    BOTTLE_CAPACITY_ML,
    pourStartAmount + ((timestamp - pourStartedAt) / 1000) * flowRateMlPerSecond
  );
  updateBottle();
  if (pouredMl >= BOTTLE_CAPACITY_ML) {
    finishRound(true);
    return;
  }
  animationFrame = requestAnimationFrame(pourFrame);
}

function startPouring() {
  isPouring = true;
  pourStartedAt = performance.now();
  pourStartAmount = pouredMl;
  startTimer();
  faucetButton.textContent = "Stop pouring";
  finishButton.hidden = false;
  waterStream.classList.add("is-flowing");
  feedback.textContent = "Click \"Stop pouring\" to pause, or \"Finalize attempt\" to submit your result.";
  animationFrame = requestAnimationFrame(pourFrame);
}

function stopPouring() {
  if (!isPouring) return;

  pouredMl = Math.min(
    BOTTLE_CAPACITY_ML,
    pourStartAmount + ((performance.now() - pourStartedAt) / 1000) * flowRateMlPerSecond
  );
  isPouring = false;
  cancelAnimationFrame(animationFrame);
  updateBottle();
  faucetButton.textContent = "Resume pouring";
  waterStream.classList.remove("is-flowing");
  feedback.textContent = "Pouring paused. Resume pouring or finalize your attempt.";
}

function finishRound(bottleIsFull = false) {
  if (isPouring) {
    pouredMl = Math.min(
      BOTTLE_CAPACITY_ML,
      pourStartAmount + ((performance.now() - pourStartedAt) / 1000) * flowRateMlPerSecond
    );
  }
  isPouring = false;
  roundComplete = true;

  cancelAnimationFrame(animationFrame);
  clearInterval(countdown);
  countdown = null;
  waterStream.classList.remove("is-flowing");
  finishButton.hidden = true;
  updateBottle();
  const difference = Math.abs(goalMl - Math.round(pouredMl));
  const overMl = Math.max(0, Math.round(pouredMl) - goalMl);

  const baseScore = Math.min((pouredMl / goalMl) * 100, 100);
  const overPenalty = (overMl / goalMl) * 100;
  const roundScore = Math.max(0, Math.round(baseScore - overPenalty));
  totalScore += roundScore;

  scoreDisplay.textContent = totalScore;
  const resultMessage = overMl > 0
    ? `You went over the goal by ${overMl} mL.`
    : `${difference} mL away from the goal.`;
  const roundResult = `You poured ${Math.round(pouredMl)} mL. ${resultMessage} You scored ${roundScore} points.${bottleIsFull ? " The bottle is full!" : ""}`;
  if (roundNumber === TOTAL_ROUNDS) {
    const playerWon = totalScore >= WINNING_SCORE;
    showGameResult(playerWon ? "YOU WON!" : "YOU LOST!");
    const finalMessage = `You scored ${totalScore} out of ${TOTAL_ROUNDS * MAX_ROUND_SCORE} possible points.`;
    feedback.textContent = `${roundResult} You completed all ${TOTAL_ROUNDS} rounds. ${finalMessage}`;
    if (playerWon) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });
    }
    faucetButton.textContent = "Play again";
  } else {
    feedback.textContent = `${roundResult} Ready for round ${roundNumber + 1}?`;
    faucetButton.textContent = "Next round";
  }
}

faucetButton.addEventListener("click", function () {
  if (roundComplete) {
    if (roundNumber === TOTAL_ROUNDS) {
      startGame();
    } else {
      roundNumber++;
      startRound();
    }
  }
  else if (isPouring) {
    stopPouring();
  }
  else {
    startPouring();
  }
});

restartGameButton.addEventListener("click", startGame);

finishButton.addEventListener("click", function () {
  if (!roundComplete) {
    finishRound();
  }
});

changeDifficultyButton.addEventListener("click", function () {
  stopRoundActivity();
  clearGameResult();
  gameScreen.hidden = true;
  difficultyScreen.hidden = false;
});

function stopRoundActivity() {
  isPouring = false;
  cancelAnimationFrame(animationFrame);
  clearInterval(countdown);
  countdown = null;
  waterStream.classList.remove("is-flowing");
}

function showGameResult(message) {
  clearGameResult();
  gameResult.textContent = message;
  gameResult.hidden = false;
  resultFadeTimeout = setTimeout(() => {
    gameResult.classList.add("is-fading");
    resultHideTimeout = setTimeout(clearGameResult, RESULT_FADE_MS);
  }, RESULT_DISPLAY_MS);
}

function clearGameResult() {
  clearTimeout(resultFadeTimeout);
  clearTimeout(resultHideTimeout);
  resultFadeTimeout = null;
  resultHideTimeout = null;
  gameResult.hidden = true;
  gameResult.classList.remove("is-fading");
}

function startGame() {
  stopRoundActivity();
  roundNumber = 1;
  totalScore = 0;
  scoreDisplay.textContent = totalScore;
  roundGoals = generateRoundGoals(roundGoals);
  startRound();
}

function generateRoundGoals(previousGoals) {
  const allGoals = Array.from({ length: 13 }, (_, index) => 300 + index * 50);
  const unusedGoals = allGoals.filter((goal) => !previousGoals.includes(goal));
  const goalPool = unusedGoals.length >= TOTAL_ROUNDS ? unusedGoals : allGoals;
  const goals = [];

  while (goals.length < TOTAL_ROUNDS) {
    const candidates = goalPool.filter((goal) =>
      !goals.includes(goal) && goal !== previousGoals[goals.length]
    );
    const randomIndex = Math.floor(Math.random() * candidates.length);
    goals.push(candidates[randomIndex]);
  }

  return goals;
}

function startTimer() {
  if (countdown !== null) return;

  countdown = setInterval(function () {
    timerValue--;
    timerDisplay.textContent = `Time left: ${timerValue} seconds`;

    if (timerValue <= 0) {
      clearInterval(countdown);
      countdown = null;
      timerDisplay.textContent = "Time's up!";
      finishRound();
    }
  }, 1000);
}

document.querySelectorAll("[data-difficulty]").forEach((button) => {
  button.addEventListener("click", () => {
    flowRateMlPerSecond = FLOW_RATES[button.dataset.difficulty];
    difficultyScreen.hidden = true;
    gameScreen.hidden = false;
    startGame();
  });
});