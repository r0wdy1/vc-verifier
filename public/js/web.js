window.result = null;
async function checkVerificationStatus() {
  try {
    const response = await fetch("/verify", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    const resultElement = document.getElementById("result");

    const lockIcon = document.querySelector("svg.icon_lock");
    const unlockIcon = document.querySelector("svg.icon_unlock");

    const reset = () => {
      resultElement.textContent = "Начните валидацию или ожидаете проверку...";
      resultElement.style.color = "black";
      lockIcon.classList.toggle("hidden", false);
      lockIcon.classList.toggle("lock", false);
      unlockIcon.classList.toggle("unlock", false);
    };

    if (data.valid || window.result) {
      resultElement.textContent =
        "Спасибо за подтверждение возраста. Доступ разрешен!";
      resultElement.style.color = "seagreen";
      unlockIcon.classList.toggle("unlock", true);
      lockIcon.classList.toggle("hidden", true);
      // Reset
      setTimeout(reset, 5000);
    } else if (data.valid === false || window.result === false) {
      resultElement.innerHTML =
        "Доступ запрещен!</br>Если Вам больше 18-ти, пройдите валидацию повторно.";
      resultElement.style.color = "salmon";
      lockIcon.classList.toggle("lock", true);
      lockIcon.classList.toggle("hidden", false);
      // Reset
      setTimeout(reset, 5000);
    }
  } catch (error) {
    console.error("Error checking verification status:", error);
    document.getElementById("result").textContent =
      "An error occurred during verification.";
  }
}

setInterval(checkVerificationStatus, 2500);
