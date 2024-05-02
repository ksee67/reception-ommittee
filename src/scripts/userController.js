document.getElementById('loginForm').addEventListener('submit', function(event) {
  event.preventDefault(); 

  const formData = new FormData(this);
  const data = {
    email: formData.get('email'),
    password: formData.get('password')
  };

  fetch('http://localhost:4000/login', {
    method: 'POST',
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
  .then(data => {
    console.log("Ответ сервера:", data);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('userId', data.id); 
    console.log('Tokens сохранены:', data.accessToken, data.refreshToken);
    console.log("Данные с сервера:", data);
    // Сохраняем роль пользователя в локальном хранилище
    localStorage.setItem('userRole', data.postID);
    switch (data.postID) {
      case 1:
        console.log("Inside switch - role 1");
        window.location.replace('../pages/AdminPanel/Main.html');
        break;
      case 2:
        console.log("Inside switch - role 2");
        window.location.replace('../pages/SecretaryPanel/Main.html');
        break;
      case 3:
        console.log("Inside switch - role 3");
        window.location.replace('../pages/ApplicantPanel/PersonalAccount.html');
        break;
      default:
        console.log("Выбрана - незвестно");
        // Другие действия, если неизвестный role
        break;
    }
    console.log("After switch");
    
  })
  .catch(error => {
    console.error('ВОзникли проблемы:', error); 
    alert('Неверный логин или пароль.');
  });  
});
