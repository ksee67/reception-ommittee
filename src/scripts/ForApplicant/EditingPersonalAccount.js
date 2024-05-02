document.addEventListener('DOMContentLoaded', function () {
    const userId = localStorage.getItem('userId');
    console.log('UserID:', userId); // для проверки айдишника

    fetch(`http://localhost:4000/user/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(userDetails => {
        console.log(userDetails); 
        const formattedDate = new Date(userDetails.Date_of_Birth).toISOString().split('T')[0];
        document.getElementById('lastName').value = userDetails.Surname;
        document.getElementById('firstName').value = userDetails.First_Name;
        document.getElementById('middleName').value = userDetails.Middle_Name;
        document.getElementById('birthdate').value = formattedDate;
        document.getElementById('email').value = userDetails.Login;
    })
    .catch(error => {
        console.error('Возникли проблемы при получении данных пользователя:', error);
    });

    document.getElementById('loginForm').addEventListener('submit', function(event) {
        event.preventDefault(); 
        const userId = localStorage.getItem('userId');

        // Получаем значения из формы
        const lastName = document.getElementById('lastName').value;
        const firstName = document.getElementById('firstName').value;
        const middleName = document.getElementById('middleName').value;
        const birthdate = document.getElementById('birthdate').value;
        const email = document.getElementById('email').value;
        // Проверяем, заполнены ли все поля
        if (!lastName || !firstName || !birthdate || !email) {
            alert('Все поля должны быть заполнены!');
            return; // Прерываем выполнение функции, если не все поля заполнены
        }

        // Проверка длины фамилии и имени
        if (lastName.length < 2 || firstName.length < 2) {
            alert('Фамилия и имя должны содержать минимум 2 символа');
            return;
        }

        // Проверка максимальной длины фамилии и имени
        if (lastName.length > 50 || firstName.length > 50) {
            alert('Фамилия и имя должны содержать не более 50 символов');
            return;
        }

        // Проверка формата логина
        if (email.length < 5 || email.indexOf('@') === -1 || email.indexOf('.') === -1) {
            alert('Логин должен содержать минимум 5 символов и иметь формат "user@example.com"');
            return;
        }

        // Создаем объект с данными для отправки на сервер
        const data = {
            lastName: lastName,
            firstName: firstName,
            middleName: middleName,
            birthdate: birthdate,
            email: email
        };

        // Отправляем запрос на сервер для изменения данных
        fetch(`http://localhost:3001/updateAbiturient/${userId}`, {
            method: 'PUT',  
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(updatedUserData => {
            console.log('Данные успешно изменены:', updatedUserData);
            window.alert('Данные успешно изменены!');
        })
        .catch(error => {
            console.error('Возникли проблемы при изменении данных:', error);
        });
    });
    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });
    
    document.getElementById('togglePassword').addEventListener('click', function () {
        togglePasswordVisibility('password');
    });
    
    document.getElementById('toggleConfirmPassword').addEventListener('click', function () {
        togglePasswordVisibility('confirmPassword');
    });
    
    function togglePasswordVisibility(id) {
        const input = document.getElementById(id);
        const button = document.getElementById(`toggle${id.charAt(0).toUpperCase() + id.slice(1)}`);
      
        if (input.type === 'password') {
          input.type = 'text';
          button.textContent = 'Скрыть';
        } else {
          input.type = 'password';
          button.textContent = 'Показать';
        }
      }
    
    document.getElementById('updatePassword').addEventListener('click', function(event) {
        event.preventDefault();
        const userId = localStorage.getItem('userId');

        // Получаем значения паролей из формы
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Проверка на совпадение паролей
        if (password !== confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }

        // Проверка ограничений на пароль
        if (password.length < 5 || password.length > 20 || !(/[A-Z]/.test(password)) || !(/[a-z]/.test(password)) || !(/[0-9]/.test(password)) || !(/[^A-Za-z0-9]/.test(password))) {
            alert('Пароль должен содержать от 5 до 20 символов, включать хотя бы одну заглавную букву, одну строчную букву, одну цифру и один спецсимвол');
            return;
        }

        // Создаем объект с данными для отправки на сервер
        const passwordData = {
            password: password
        };

        // Отправляем запрос на сервер для изменения пароля
        fetch(`http://localhost:4000/updatePasswordAbiturient/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(passwordData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(updatedPasswordData => {
            console.log('Пароль успешно изменен:', updatedPasswordData);
            window.alert('Пароль успешно изменен!');
        })
        .catch(error => {
            console.error('Возникли проблемы при изменении пароля:', error);
        });
    });
});
function deleteAbitur() {
    const userId = localStorage.getItem('userId');
    console.log('UserID:', userId); // для проверки айдишника
    const confirmationMessage = 'Вы уверены, что хотите удалить свой аккаунт? Удалённый аккаунт не подлежит восстановлению.';
  
    if (confirm(confirmationMessage)) {
      fetch(`http://localhost:3001/deleteAbiturient/${userId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error("Ошибка при удалении Абитуриента.");
        }
        return response.json();
      })
      .then(data => {
        console.log("Успешный ответ сервера:", data);
        alert("Ваш аккаунт успешно удален.");
        window.location.href = ('../Main.html'); // Переход на страницу глдавную
      })
      .catch(error => {
        console.error("Ошибка при удалении Абитуриента:", error);
        console.log("Ответ сервера:", error.message);
        alert("Произошла ошибка при удалении Абитуриента.");
      });
    }
  }
  