let start = Date.now();

const steps = [
  {
    cue: 1,
    text: "Привет, человек!",
  },
  {
    cue: 2,
    text: "То есть ... ты же человек?",
  },
  {
    cue: 4,
    text: "Мне нужны доказательства!  Я доверяю только математике",
    showQR: true,
  },
  {
    cue: 6,
    text: "Переходи по ссылке, сгенерируй доказательство в приложении",
    showQR: true,
  },
  {
    cue: 8,
    text: "Я не собираю чужие данные ...",
    showQR: true,
  },
  {
    cue: 9,
    text: "И не обращаюсь к внешним сервисам ",
    showQR: true,
  },
  {
    cue: 11,
    text: "Я  могу проверить условие для данных, не видя их",
    showQR: false,
  },
  {
    cue: 13,
    text: "Например диапазон возраста или срок действия документа",
    showQR: false,
  },
  {
    cue: 15,
    text: "Например диапазон возраста или срок действия документа",
    showQR: false,
  },
];

const sequenceLen = 16;

const getText = () => {
  // let currentStep = steps[0];

  const currentTime = Date.now();

  const elapsed = Math.floor((currentTime - start) / 1000);

  const currentCue = elapsed % sequenceLen;

  const newStep = steps.find((step) => step.cue === currentCue);

  const currentStep = currentCue === 0 ? steps[0] : newStep;
  // console.log(
  //   `elapsed = ${elapsed},currentCue= ${currentCue}, current = ${currentStep?.text}`,
  // );
  return currentStep;
};
setInterval(() => {
  const currentStep = getText();
  fetch("/verify")
    .then((res) => res.json())
    .then((res) => {
      window.result = res.valid;
    })
    .catch((e) => {
      console.error("failed to fetch lock status", e);
    });

  if (currentStep) {
    const showQR = currentStep.showQR ?? false;
    if (window.result) {
      start = Date.now();
      document.getElementById("hal").src = "assets/hal_blue.webp";
      document.getElementById("speechBubble").textContent =
        "Спасибо! Доступ открыт!";
    } else {
      document.getElementById("hal").src = "assets/hal.png";
      document.getElementById("speechBubble").textContent = currentStep.text;
    }
    document.getElementById("QR").style.visibility = showQR
      ? "visible"
      : "hidden";
  }
}, 1000);
