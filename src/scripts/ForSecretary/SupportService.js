class User {
    constructor(userId) {
      this.userId = userId;
    }
  
    getUserDetails() {
      const url = `http://localhost:4000/administrator/${this.userId}`;
  
      return fetch(url, {
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
      .then(data => {
        const userEmail = data.Login;
        const userEmailElement = document.getElementById('userEmail');
        userEmailElement.textContent = userEmail || 'example@mail.com';  // если почта пользователя не найдена, будет использоваться example@mail.com
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
      });
    }
  
    updateUserDetails(userDetails) {
      const url = `http://localhost:4000/administrator/${this.userId}`;
  
      return fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userDetails),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      });
    }
  }
  
  const userId = localStorage.getItem('userId');
  
  const user = new User(userId);
  user.getUserDetails();
  
// Получение текущей электронной почты пользователя
function getUserEmail() {
  const userEmailElement = document.getElementById('userEmail');
  const userEmail = userEmailElement.textContent;
  return userEmail;
}

// Обработчик события клика по кнопке "Выбрать мою текущую почту"
document.getElementById('selectEmailButton').addEventListener('click', () => {
  const userEmail = getUserEmail();
  document.getElementById('helpEmailInput').value = userEmail;
});

// Обработчик события клика по кнопке "Сохранить"
document.getElementById('saveEmailButton').addEventListener('click', () => {
  const newEmailAddress = document.getElementById('helpEmailInput').value;

  if (!newEmailAddress) {
    alert('Пожалуйста, введите адрес электронной почты');
    return;
  }

  if (newEmailAddress.length < 5 || newEmailAddress.length > 255) {
    alert('Адрес электронной почты должен содержать от 5 до 255 символов');
    return;
  }

  if (!newEmailAddress.includes('@') || !newEmailAddress.includes('.')) {
    alert('Адрес электронной почты должен содержать @ и .');
    return;
  }

  const confirmationMessage = `Вы уверены, что хотите получать сообщения на Вашу почту ${newEmailAddress} от абитуриентов?`;

  if (confirm(confirmationMessage)) {
    fetch('http://localhost:3001/updateEmailAddress', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ emailAddress: newEmailAddress })
    })
    .then(response => {
      if (response.ok) {
        console.log('Электронная почта успешно обновлена');
        alert('Электронная почта успешно обновлена');
      } else {
        console.error('Ошибка при обновлении электронной почты');
        alert('Ошибка при обновлении электронной почты');
      }
    })
    .catch(error => {
      console.error('Ошибка при отправке запроса на обновление электронной почты:', error);
      alert('Ошибка при отправке запроса на обновление электронной почты');
    });
  }
});

// Обработчик события клика по кнопке "Выбрать мою текущую почту"
document.getElementById('selectEmailButton').addEventListener('click', () => {
  const currentEmail = document.getElementById('userEmail').textContent;
  const confirmationMessage = `Вы уверены, что хотите получать сообщения на Вашу почту "${currentEmail}" от абитуриентов?`;

  if (confirm(confirmationMessage)) {
    document.getElementById('helpEmailInput').value = currentEmail;

    // Отправка запроса на обновление электронной почты
    fetch('http://localhost:3001/updateEmailAddress', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ emailAddress: currentEmail })
    })
    .then(response => {
      if (response.ok) {
        console.log('Электронная почта успешно обновлена');
        alert('Ваша почта успешно принята для связи');
      } else {
        console.error('Ошибка при обновлении электронной почты');
      }
    })
    .catch(error => {
      console.error('Ошибка при отправке запроса на обновление электронной почты:', error);
    });
  }
});
