document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Отправляем запрос на сервер для авторизации
    fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
        
    })
    .then(data => {
        // Проверяем Post_ID и перенаправляем на соответствующую страницу
        switch (data.role) {
            case 1:
                window.location.href = '../pages/AdminPanel/Main.html';
                break;
            case 2:
                window.location.href = '../pages/SecretaryPanel/Main.html';
                break;
            case 3:
                window.location.href = '../pages/ApplicantPanel/Main.html';
                break;
            default:
                //  если неизвестный Post_ID
                break;
        }
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
        alert('Произошла ошибка. Попробуйте еще раз.');
    });
});
