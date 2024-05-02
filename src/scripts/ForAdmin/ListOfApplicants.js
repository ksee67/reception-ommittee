let data;
let searchInput;
let classFilter;
let formFilter;
let currentPage = 1;

// Функция для создания карточки абитуриента
function createProgramsCard(program) {
    const card = document.createElement('div');
    card.classList.add('col-md-12', 'mb-4');
    card.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-text">Специальность: ${program.Specialty_Name} (${program.Specialty_Code})</h5>
                <p class="card-text">Направление: ${program.Specialty_Name}</p>
                <p class="card-text">База класса: ${program.Class_Name}</p>
                <p class="card-text">Форма обучения: ${program.Form_Name}</p>
            </div>
        </div>
    `;

    // Добавляем обработчик события для открытия страницы со списком студентов
    card.addEventListener('click', () => {
        // Передаем значения ID_Program, Class_ID и Education_Form_ID в функцию открытия страницы
        openStudentsPage(program.ID_Program, getClassId(program.Class_Name), getEducationFormId(program.Form_Name));
    });

    return card;
}
// Открываем страницу абитуриентов при клике на карточку
function openStudentsPage(programId, classId, educationFormId) {
    const studentsPageUrl = `studentsPage.html?programId=${programId}&classId=${classId}&educationFormId=${educationFormId}`;
    window.location.href = studentsPageUrl;
}

async function loadPrograms(page = currentPage, itemsPerPage = 5, searchQuery = '', selectedClass = 'all', selectedForm = 'all') {
    try {
        const response = await fetch('http://localhost:3001/ListOfPrograms');
        data = await response.json();

        const programsCardsContainer = document.getElementById('applicantCards');
        // Очищаем контейнер перед добавлением новых карточек
        programsCardsContainer.innerHTML = '';

        // Фильтрация данных по поисковому запросу, классу и форме обучения
        const filteredData = data.filter(program =>
            program.Specialty_Name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (selectedClass === 'all' || getClassId(program.Class_Name) === parseInt(selectedClass)) &&
            (selectedForm === 'all' || getEducationFormId(program.Form_Name) === parseInt(selectedForm))
        );

        const totalPages = Math.ceil(filteredData.length / itemsPerPage);

        // Отображаем карточки для текущей страницы
        const startIdx = (page - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        const pageData = filteredData.slice(startIdx, endIdx);

        if (pageData.length === 0) {
            // Если нет результатов, выводим сообщение
            const noResultsMessage = document.createElement('p');
            noResultsMessage.textContent = 'По вашему запросу ничего не найдено';
            programsCardsContainer.appendChild(noResultsMessage);
        } else {
            // Если есть результаты, создаем карточки
            pageData.forEach(program => {
                const card = createProgramsCard(program);
                programsCardsContainer.appendChild(card);
            });
        }

        // После загрузки данных и создания карточек, добавляем пагинацию
        renderPagination(page, totalPages);
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

// Добавляем обработчики событий для изменений в фильтрах
classFilter = document.getElementById('classFilter');
formFilter = document.getElementById('formFilter');

classFilter.addEventListener('change', () => {
    const searchQuery = searchInput.value;
    const selectedClass = classFilter.value;
    const selectedForm = formFilter.value;
    loadPrograms(1, 5, searchQuery, selectedClass, selectedForm);
});

formFilter.addEventListener('change', () => {
    const searchQuery = searchInput.value;
    const selectedClass = classFilter.value;
    const selectedForm = formFilter.value;
    loadPrograms(1, 5, searchQuery, selectedClass, selectedForm);
});

// Добавляем обработчик событий для кнопки поиска
const searchButton = document.getElementById('searchButton');
searchInput = document.getElementById('searchInput');

searchButton.addEventListener('click', () => {
    const searchQuery = searchInput.value;
    const selectedClass = classFilter.value;
    const selectedForm = formFilter.value;
    loadPrograms(1, 5, searchQuery, selectedClass, selectedForm);
});

// Функция для отображения пагинации
function renderPagination(currentPage, totalPages) {
    const paginationContainer = document.getElementById('paginationContainer');
    paginationContainer.innerHTML = '';

    // Кнопка "Предыдущая"
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Предыдущая';
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            loadPrograms(currentPage - 1);
            currentPage = i; //  строку для обновления currentPage
        }
    });
    paginationContainer.appendChild(prevButton);

    // Цифры страниц
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => {
            loadPrograms(i);
            currentPage = currentPage - 1; // Добавьте эту строку для обновления currentPage
        });
        paginationContainer.appendChild(pageButton);
    }

    // Кнопка "Следующая"
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Следующая';
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadPrograms(currentPage + 1);
            currentPage = currentPage + 1; // Добавьте эту строку для обновления currentPage
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Вызываем функцию загрузки данных
loadPrograms();

// Функция для получения ID_Class по Class_Name
function getClassId(className) {
    switch (className) {
        case 'На базе 9-го':
            return 1;
        case 'На базе 11-го':
            return 2;
        default:
            return null;
    }
}

// Функция для получения ID_Education_Form по Education_Form_Name
function getEducationFormId(formName) {
    switch (formName) {
        case 'Внебюджетная':
            return 1;
        case 'Бюджетная':
            return 2;
        default:
            return null;
    }
}

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