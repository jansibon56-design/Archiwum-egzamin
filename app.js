const TEST_SIZE = 40;
const EXAM_TIME_SECONDS = 60 * 60;


let allQuestions = [];
let testQuestions = [];
let currentIndex = 0;
let userAnswers = {};
let remainingSeconds = EXAM_TIME_SECONDS;
let timerInterval = null;
let testFinished = false;

const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const reviewScreen = document.getElementById("review-screen");

const startBtn = document.getElementById("start-btn");
const loadError = document.getElementById("load-error");

const progress = document.getElementById("progress");
const source = document.getElementById("source");
const answeredCounter = document.getElementById("answered-counter");
const timerEl = document.getElementById("timer");
const questionText = document.getElementById("question-text");
const answersEl = document.getElementById("answers");
const imageWrap = document.getElementById("image-wrap");
const questionImage = document.getElementById("question-image");

const nextBtn = document.getElementById("next-btn");
const finishBtn = document.getElementById("finish-btn");

const scoreEl = document.getElementById("score");
const reviewBtn = document.getElementById("review-btn");
const restartBtn = document.getElementById("restart-btn");
const backResultBtn = document.getElementById("back-result-btn");
const reviewList = document.getElementById("review-list");
const reviewSummary = document.getElementById("review-summary");

function initializeQuestions() {
  if (!Array.isArray(QUESTIONS)) {
    throw new Error("Plik questions.js nie zawiera prawidłowej tablicy QUESTIONS.");
  }

  allQuestions = QUESTIONS;

  if (allQuestions.length === 0) {
    throw new Error("Baza pytań jest pusta.");
  }

  if (allQuestions.length < TEST_SIZE) {
    loadError.textContent = `Uwaga: w bazie jest tylko ${allQuestions.length} pytań. Test użyje wszystkich dostępnych pytań.`;
    loadError.classList.remove("hidden");
  }
}

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function startTest() {
  const count = Math.min(TEST_SIZE, allQuestions.length);
  testQuestions = shuffle(allQuestions).slice(0, count);
  currentIndex = 0;
  userAnswers = {};
  testFinished = false;
  remainingSeconds = EXAM_TIME_SECONDS;

  showScreen(quizScreen);
  renderQuestion();
  startTimer();
}

function showScreen(screen) {
  [startScreen, quizScreen, resultScreen, reviewScreen].forEach(el => el.classList.add("hidden"));
  screen.classList.remove("hidden");
}

function renderQuestion() {
  const question = testQuestions[currentIndex];
  const selected = userAnswers[question.id];

  progress.textContent = `Pytanie ${currentIndex + 1}/${testQuestions.length}`;
  source.textContent = question.source ? `Źródło: ${question.source}` : "";
  answeredCounter.textContent = `Udzielono odpowiedzi: ${Object.keys(userAnswers).length}/${testQuestions.length}`;
  questionText.textContent = question.question;

  if (question.image) {
    questionImage.src = question.image;
    imageWrap.classList.remove("hidden");
  } else {
    questionImage.removeAttribute("src");
    imageWrap.classList.add("hidden");
  }

  answersEl.innerHTML = "";

  ["A", "B", "C", "D"].forEach(letter => {
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.innerHTML = `<strong>${letter}.</strong> ${question.answers?.[letter] ?? letter}`;

    if (selected === letter) {
      btn.classList.add("selected");
    }

    btn.addEventListener("click", () => {
      userAnswers[question.id] = letter;
      renderQuestion();
    });

    answersEl.appendChild(btn);
  });

  nextBtn.disabled = currentIndex === testQuestions.length - 1;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateTimerDisplay() {
  timerEl.textContent = formatTime(remainingSeconds);

  if (remainingSeconds <= 300) {
    timerEl.classList.add("warning");
  } else {
    timerEl.classList.remove("warning");
  }
}

function startTimer() {
  stopTimer();
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      stopTimer();
      finishTest(true);
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function finishTest(timeExpired = false) {
  if (testFinished) return;

  const unanswered = testQuestions.length - Object.keys(userAnswers).length;

  if (!timeExpired && unanswered > 0) {
    const confirmFinish = confirm(`Nie odpowiedziałeś na ${unanswered} pytań. Czy na pewno zakończyć test?`);
    if (!confirmFinish) return;
  }

  testFinished = true;
  stopTimer();

  const correctCount = calculateScore();
  const percent = Math.round((correctCount / testQuestions.length) * 100);

  scoreEl.textContent = timeExpired
    ? `Czas minął. Wynik: ${correctCount}/${testQuestions.length} poprawnych (${percent}%)`
    : `${correctCount}/${testQuestions.length} poprawnych (${percent}%)`;

  showScreen(resultScreen);
}

function calculateScore() {
  return testQuestions.filter(q => userAnswers[q.id] === q.correct).length;
}

function renderReview() {
  const correctCount = calculateScore();
  const percent = Math.round((correctCount / testQuestions.length) * 100);

  reviewSummary.textContent = `Wynik: ${correctCount}/${testQuestions.length} poprawnych (${percent}%)`;
  reviewList.innerHTML = "";

  testQuestions.forEach((question, index) => {
    const selected = userAnswers[question.id] || null;
    const isCorrect = selected === question.correct;

    const card = document.createElement("section");
    card.className = `review-question ${isCorrect ? "correct-box" : "wrong-box"}`;

    const imageHtml = question.image
      ? `<div class="image-wrap"><img src="${question.image}" alt="Ilustracja do pytania"></div>`
      : "";

    const answersHtml = ["A", "B", "C", "D"].map(letter => {
      const isCorrectAnswer = letter === question.correct;
      const isUserWrongAnswer = selected === letter && !isCorrect;

      let classes = "review-answer";
      if (isCorrectAnswer) classes += " correct";
      if (isUserWrongAnswer) classes += " wrong";

      let badges = "";
      if (isCorrectAnswer) badges += `<span class="badge correct">Poprawna odpowiedź</span>`;
      if (selected === letter) {
        badges += isCorrect
          ? `<span class="badge correct">Twoja odpowiedź</span>`
          : `<span class="badge wrong">Twoja odpowiedź</span>`;
      }

      return `
        <div class="${classes}">
          <strong>${letter}.</strong> ${question.answers?.[letter] ?? letter}
          ${badges}
        </div>
      `;
    }).join("");

    card.innerHTML = `
      <h2>Pytanie ${index + 1}</h2>
      <div class="muted">${question.source ? `Źródło: ${question.source}` : ""}</div>
      ${imageHtml}
      <p>${question.question}</p>
      <div class="review-answers">${answersHtml}</div>
    `;

    reviewList.appendChild(card);
  });

  showScreen(reviewScreen);
}

startBtn.addEventListener("click", startTest);


nextBtn.addEventListener("click", () => {
  if (testFinished) return;

  if (currentIndex < testQuestions.length - 1) {
    currentIndex++;
    renderQuestion();
  }
});

finishBtn.addEventListener("click", finishTest);
reviewBtn.addEventListener("click", renderReview);
restartBtn.addEventListener("click", startTest);
backResultBtn.addEventListener("click", () => showScreen(resultScreen));

try {
  initializeQuestions();
  startBtn.disabled = false;
} catch (error) {
  startBtn.disabled = true;
  loadError.textContent = error.message;
  loadError.classList.remove("hidden");
}
