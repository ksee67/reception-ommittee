document.addEventListener('DOMContentLoaded', function () {
  // проверяем роли при загрузке страницы
  const userRole = localStorage.getItem('userRole');

  switch (userRole) {
    case '1':
      window.location.replace('../AccessDenied.html');
    break;
    case '2':
    // Код для роли 2 секретаря
    window.location.replace('../AccessDenied.html');
    break;
    case '3':
    // доступно все
    break;
    default:
    // другая роль ыы такой нет =)
    window.location.replace('../../AccessDenied.html');
    break;
  }
});
