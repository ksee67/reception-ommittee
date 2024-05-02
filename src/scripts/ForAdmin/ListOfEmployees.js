let administratorsData;

// Функция для форматирования даты
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function redirectToAddingEmployee() {
    window.location.href = '../../pages/AdminPanel/AddingEmployee.html';
}

async function changeRole(administratorId, administratorName) {
    // Запрашиваем подтверждение от пользователя
    const isConfirmed = window.confirm(`Вы уверены, что хотите изменить роль сотруднику ${administratorName}?`);

    if (!isConfirmed) {
        return;
    }

    // Получаем выбранный элемент <select>
    const roleSelect = document.getElementById(`roleSelect-${administratorId}`);

    // Получаем новый ID роли из выбранной опции
    const newRoleId = parseInt(roleSelect.value);

    // Продолжаем с изменением роли
    try {
        // Отправляем запрос на изменение роли
        const response = await fetch(`http://localhost:3001/ChangeRole/${administratorId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ newRoleId }),
        });

        // Получаем результат операции
        const result = await response.json();

        if (result.success) {
            // Если изменение роли успешно, перезагружаем данные об администраторах
            loadAdministratorsData();
            alert('Роль успешно изменена.');
        } else {
            alert('Не удалось изменить роль.');
        }
    } catch (error) {
        console.error('Ошибка при изменении роли:', error);
        alert('Произошла ошибка при изменении роли.');
    }
}

async function deleteAdministrator(administratorId, administratorName) {
    // Запрос подтверждения у пользователя
    const isConfirmed = window.confirm(`Вы уверены, что хотите удалить сотрудника ${administratorName}?`);

    if (!isConfirmed) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3001/DeleteAdministrator/${administratorId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            // Если удаление успешно, обновим таблицу
            loadAdministratorsData();
            alert('Сотрудник успешно удален.');
        } else {
            alert('Не удалось удалить сотрудника.');
        }
    } catch (error) {
        console.error('Ошибка при удалении администратора:', error);
        alert('Произошла ошибка при удалении администратора.');
    }
}
let currentPage = 1;
let pageSize = 6;

function renderAdministratorsList(administratorsData, page, pageSize) {
  const administratorsTableBody = document.getElementById('administratorsTableBody');
  administratorsTableBody.innerHTML = '';

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = administratorsData.slice(startIndex, endIndex);

  paginatedData.forEach(administrator => {
    const administratorRow = document.createElement('tr');
    administratorRow.innerHTML = `
            <td>${administrator.Surname} ${administrator.First_Name} ${administrator.Middle_Name}</td>
            <td>${formatDate(administrator.Date_of_Birth)}</td>

            <td>
                <span>${administrator.Post_name}</span>
                <select class="form-control mr-2" id="roleSelect-${administrator.ID_Administrator}" name="roleSelect">
                    <option value="1" ${administrator.Role_ID === 1 ? 'selected' : ''}>Администратор</option>
                    <option value="2" ${administrator.Role_ID === 2 ? 'selected' : ''}>Секретарь приемной комиссии</option>
                </select>
            </td>
            <td>
                <button class="btn btn-primary" onclick="changeRole('${administrator.ID_Administrator}', '${administrator.Role_ID}', '${administrator.Surname} ${administrator.First_Name} ${administrator.Middle_Name}')">Изменить роль</button>
            </td>
            <td>
                <button class="btn btn-danger" onclick="deleteAdministrator('${administrator.ID_Administrator}', '${administrator.Surname} ${administrator.First_Name} ${administrator.Middle_Name}')">Удалить сотрудника</button>
            </td>
        `;
    administratorsTableBody.appendChild(administratorRow);
  });
}

async function loadAdministratorsData() {
  try {
    const response = await fetch('http://localhost:3001/Administrators');
    administratorsData = await response.json();
    renderAdministratorsList(administratorsData, currentPage, pageSize);
    sortByNameAsc();
    filterAdministrators();
    renderPagination(currentPage, Math.ceil(administratorsData.length / pageSize));
  } catch (error) {
    console.error('Ошибка при загрузке данных администраторов:', error);
  }
}

// Функция для фильтрации администраторов по должности
function filterAdministrators() {
  // Получаем выбранный элемент <select>
  const classFilter = document.getElementById('classFilter');

  // Получаем значение фильтра
  const selectedClass = classFilter.value;

  // Фильтруем данные
  const filteredData = administratorsData.filter(administrator =>
    selectedClass === 'all' || getPostId(administrator.Post_name) === parseInt(selectedClass)
  );

  // Перерисовываем таблицу с отфильтрованными данными
  renderAdministratorsList(filteredData, 1, pageSize);
  renderPagination(1, Math.ceil(filteredData.length / pageSize));
}

// Функция для получения
function getPostId(postName) {
  switch (postName) {
    case 'Администратор':
      return 1;
    case 'Секретарь приемной комиссии':
      return 2;
    default:
      return null;
  }
}

function sortByNameAsc() {
  // Вызываем функцию сортировки по фамилии по возрастанию
  sortAdministrators('Surname', 'asc');
}

function sortByNameDesc() {
  // Вызываем функцию сортировки по фамилии по убыванию
  sortAdministrators('Surname', 'desc');
}

function sortAdministrators(property, order) {
  // Копируем массив для избежания изменений в оригинальном массиве
  const sortedData = [...administratorsData];

  // Сортируем данные в зависимости от выбранных параметров
  sortedData.sort((a, b) => {
    const aValue = a[property].toUpperCase();
    const bValue = b[property].toUpperCase();

    if (order === 'asc') {
      return aValue.localeCompare(bValue);
    } else if (order === 'desc') {
      return bValue.localeCompare(aValue);
    }

    return 0;
  });

  // Перерисовываем таблицу с отсортированными данными
  renderAdministratorsList(sortedData, 1, pageSize);
  renderPagination(1, Math.ceil(sortedData.length / pageSize));
}

function searchAdministrators() {
  // Получаем значение из поля ввода
  const searchInput = document.getElementById('searchInput');
  const searchTerm = searchInput.value.toLowerCase();

  // Получаем выбранный элемент <select> для фильтрации по должности
  const classFilter = document.getElementById('classFilter');
  const selectedClass = classFilter.value;

  // Фильтруем данные в зависимости от введенного поискового запроса и выбранной должности
  const filteredData = administratorsData.filter(administrator => {
    const fullName = `${administrator.Surname} ${administrator.First_Name} ${administrator.Middle_Name}`.toLowerCase();
    const postMatches = selectedClass === 'all' || getPostId(administrator.Post_name) === parseInt(selectedClass);
    return fullName.includes(searchTerm) && postMatches;
  });

  // Очищаем таблицу от предыдущих результатов
  const tableBody = document.getElementById('administratorsTableBody');
  tableBody.innerHTML = '';

  // Перерисовываем таблицу с отфильтрованными данными
  renderAdministratorsList(filteredData, 1, pageSize);
  renderPagination(1, Math.ceil(filteredData.length / pageSize));

  // Выводим сообщение, если нет совпадений
  if (filteredData.length === 0) {
    // Создаем новую строку и ячейку
    const noResultsRow = document.createElement('tr');
    const noResultsCell = document.createElement('td');
    noResultsCell.colSpan = 5; // Устанавливаем colSpan в 5, чтобы объединить все столбцы в одну ячейку

    // Добавляем текст в ячейку
    noResultsCell.textContent = 'Такого сотрудника нет в базе';

    // Добавляем ячейку в строку
    noResultsRow.appendChild(noResultsCell);

    // Добавляем новую строку в таблицу
    tableBody.appendChild(noResultsRow);
  }
}

// Обработчик события для кнопки "Искать"
const searchButton = document.getElementById('searchButton');
searchButton.addEventListener('click', searchAdministrators);

// Функция для отображения пагинации
function renderPagination(currentPage, totalPages) {
  const paginationContainer = document.getElementById('paginationContainer');
  paginationContainer.innerHTML = '';

  // Кнопка "Предыдущая"
  const prevButton = document.createElement('button');
  prevButton.textContent = 'Предыдущая';
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      renderAdministratorsList(administratorsData, currentPage - 1, pageSize);
      renderPagination(currentPage - 1, totalPages);
    }
  });
  paginationContainer.appendChild(prevButton);

  // Цифры страниц
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i;
    pageButton.addEventListener('click', () => {
      renderAdministratorsList(administratorsData, i, pageSize);
      renderPagination(i, totalPages);
    });
    paginationContainer.appendChild(pageButton);
  }

  // Кнопка "Следующая"
  const nextButton = document.createElement('button');
  nextButton.textContent = 'Следующая';
  nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
      renderAdministratorsList(administratorsData, currentPage + 1, pageSize);
      renderPagination(currentPage + 1, totalPages);
    }
  });
  paginationContainer.appendChild(nextButton);
}

loadAdministratorsData();

// Yandex Webkit Speech 
const recognition = new window.webkitSpeechRecognition();

recognition.lang = 'ru-RU';
recognition.interimResults = false;

recognition.onresult = (event) => {
    const speechToText = event.results[0][0].transcript;
    searchInput.value = speechToText;
    renderCardsWithSearchAndFilters(0, cardsPerPage, speechToText, classFilter.value, formFilter.value);
    const totalPagesFiltered = Math.ceil(filteredData.length / cardsPerPage);
    renderPagination(1, totalPagesFiltered);
};

recognition.onerror = (event) => {
    console.error('Ошибка распознавания речи:', event.error);
};

recognition.onstart = () => {
    console.log('Запущено распознавание речи...');
};

recognition.onend = () => {
    console.log('Распознавание речи окончено');
};
// Получаем элемент для вывода статуса распознавания речи
const voiceStatus = document.getElementById('voiceStatus');

recognition.onstart = () => {
    voiceStatus.textContent = 'Запущено распознавание речи...';
};

recognition.onend = () => {
    voiceStatus.textContent = 'Распознавание речи окончено';
};

// Обчвим кнопку включение прослушивания
const startButton = document.getElementById('startButton');

startButton.addEventListener('click', () => {
    recognition.start();
});

// Вызываем функцию загрузки данных и отображения администраторов при загрузке страницы
loadAdministratorsData();
