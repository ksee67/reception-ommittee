function validateForm() {
    var agreeCheckbox = document.getElementById("agreeCheckbox");
    if (!agreeCheckbox.checked) {
        alert("Для продолжения регистрации необходимо принять условия соглашения.");
        return false; // Отмена отправки формы
    }
    return true; // Продолжение отправки формы
}
// Функция для обработки события отправки формы
function registerApplicant() {
    // Получаем значения полей формы
    const surname = document.getElementById('inputLastName').value;
    const firstName = document.getElementById('inputFirstName').value;
    const middleName = document.getElementById('inputPatronymic').value;
    const dateOfBirth = document.getElementById('inputDOB').value;
    const email = document.getElementById('inputEmail').value;
    const password = document.getElementById('inputPassword').value;
    const password2 = document.getElementById('inputConfirmPassword').value;
    const postId = 3; // значение по умолчанию - 3 Абитуриент
  
    // Проверка на совпадение паролей
    if (password !== password2) {
        alert('Пароли не совпадают');
        return;
    }
  
    // Проверка длины фамилии и имени
    if (surname.length < 2 || firstName.length < 2) {
        alert('Фамилия и имя должны содержать минимум 2 символа');
        return;
    }
  
    // Проверка максимальной длины фамилии и имени
    if (surname.length > 50 || firstName.length > 50) {
        alert('Фамилия и имя должны содержать не более 50 символов');
        return;
    }
  
    // Проверка формата логина
    if (email.length < 5 || email.indexOf('@') === -1 || email.indexOf('.') === -1) {
        alert('Логин должен содержать минимум 5 символов и иметь формат "user@example.com"');
        return;
    }
  
    // Проверка ограничений на пароль
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{5,255}$/;
    if (!passwordRegex.test(password)) {
        alert('Пароль должен содержать минимум одну заглавную и строчную букву, цифру, специальный символ и быть длиной от 5 до 100 символов');
      return;
    }
  
    // Проверка на текущую или будущую дату рождения
    const currentDate = new Date();
    const selectedDate = new Date(dateOfBirth);
    if (selectedDate >= currentDate) {
        alert('Дата рождения должна быть меньше текущей даты');
        return;
    }
  
    // Проверка уникальности логина
    fetch('http://localhost:3001/checkLogin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            login: email,
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data[0].count >= 1) {
            alert('Пользователь с таким логином уже существует!');
            return;
        }
  
        // Отправляем данные на сервер
        fetch('http://localhost:4000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                surname: surname,
                firstName: firstName,
                middleName: middleName,
                dateOfBirth: dateOfBirth,
                email: email,
                password: password,
                postId: postId,
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            alert('Вы успешно зарегистрированы!');
            // Очистка полей формы или другие необходимые действия после успешной регистрации
            document.getElementById('registrationForm').reset();
        })
        .catch(error => {
            console.error('Ошибка при отправке запроса:', error);
            alert('Произошла ошибка при регистрации абитуриента');
        });
    })
    .catch(error => {
        console.error('Ошибка при отправке запроса:', error);
        alert('Произошла ошибка при проверке логина');
    });
  }
  
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling.querySelector('button');

    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = 'Скрыть';
    } else {
        input.type = 'password';
        button.textContent = 'Показать';
    }
}
function clearInput(inputId) {
    document.getElementById(inputId).value = '';
}
