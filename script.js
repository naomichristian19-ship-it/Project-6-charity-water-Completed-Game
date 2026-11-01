const goalDisplay = document.querySelector("#goal");
const amountDisplay = document.querySelector("#amount");
const scoreDisplay = document.querySelector("#score");
const bottleWater = document.querySelector("#bottle-water");
const waterStream = document.querySelector("#water-stream");
const faucetButton = document.querySelector("#faucet-button");
const finishButton = document.querySelector("#finish-button");
const feedback = document.querySelector("#feedback");
const timerDisplay = document.querySelector("#timer");

const BOTTLE_CAPACITY_ML = 1000;
const FLOW_RATE_ML_PER_SECOND = 60;
const ROUND_TIME_SECONDS = 30;

let goalMl = 0;
let pouredMl = 0;
let totalScore = 0;
let isPouring = false;
let roundComplete = false;
let pourStartedAt = 0;
let pourStartAmount = 0;
let animationFrame = null;
let timerValue = ROUND_TIME_SECONDS;
let countdown = null;

function startRound() {
  goalMl = 300 + Math.floor(Math.random() * 13) * 50;

  pouredMl = 0;
  roundComplete = false;
  finishButton.hidden = true;
  clearInterval(countdown);
  countdown = null;
  timerValue = ROUND_TIME_SECONDS;
  timerDisplay.textContent = `Time left: ${timerValue} seconds`;

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
    pourStartAmount + ((timestamp - pourStartedAt) / 1000) * FLOW_RATE_ML_PER_SECOND
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
    pourStartAmount + ((performance.now() - pourStartedAt) / 1000) * FLOW_RATE_ML_PER_SECOND
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
      pourStartAmount + ((performance.now() - pourStartedAt) / 1000) * FLOW_RATE_ML_PER_SECOND
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
  if (roundScore > 80) {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
}

  totalScore += roundScore;


  scoreDisplay.textContent = totalScore;
  const resultMessage = overMl > 0
    ? `You went over the goal by ${overMl} mL.`
    : `${difference} mL away from the goal.`;
  feedback.textContent = `You poured ${Math.round(pouredMl)} mL. ${resultMessage} You scored ${roundScore} points.${bottleIsFull ? " The bottle is full!" : ""}`;
  faucetButton.textContent = "Next goal";
}

faucetButton.addEventListener("click", function () {
  if (roundComplete) {
    startRound();
  }
  else if (isPouring) {
    stopPouring();
  }
  else {
    startPouring();
  }
});

finishButton.addEventListener("click", function () {
  if (!roundComplete) {
    finishRound();
  }
});

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

startRound();