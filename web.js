async function checkVerificationStatus() {
    try {
        const response = await fetch('/verify', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        const resultElement = document.getElementById('result');
        if (data.valid == "yes") {
            resultElement.textContent = "Все верно, вам и правда больше 18 лет";
            resultElement.style.color = "seagreen"
        } else if (data.valid == "no") {
            resultElement.textContent = "Похоже что-то не так";
            resultElement.style.color = "salmon"
        }
    } catch (error) {
        console.error('Error checking verification status:', error);
        document.getElementById('result').textContent = "An error occurred during verification.";
    }
}

setInterval(checkVerificationStatus, 2500);