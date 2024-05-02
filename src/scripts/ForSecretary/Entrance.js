let data;
let cardsPerPage;
let filteredData;
let searchInput; 
let classFilter;  
let formFilter;   

// Функция для сброса всех фильтров и обновления страницы
function resetFilters() {
    searchInput.value = '';  // Очистка текста поиска

    // Устанавливаем значение "all" для фильтра класса
    const classFilterElement = document.getElementById('classFilter');
    if (classFilterElement) {
        classFilterElement.selectedIndex = 0;
    }

    // Устанавливаем значение "all" для фильтра формы обучения
    const formFilterElement = document.getElementById('formFilter');
    if (formFilterElement) {
        formFilterElement.selectedIndex = 0;
    }

    // Обновление карточек с новыми значениями фильтров
    renderCardsWithSearchAndFilters(0, cardsPerPage, '', 'all', 'all');

    // Пересчитаем и отобразим пагинацию для отфильтрованных данных
    const totalPagesFiltered = Math.ceil(filteredData.length / cardsPerPage);
    renderPagination(1, totalPagesFiltered);
}

// Функция для отображения карточек с учетом поиска и фильтров
function renderCardsWithSearchAndFilters(startIndex, cardsPerPage, searchQuery, classFilterValue, formFilterValue) {
    const cardContainer = document.getElementById('cardContainer');
    cardContainer.innerHTML = '';

    // Филтр на основе поискового запроса, класса и формы обучения
    filteredData = data.filter(program =>
        program.Specialty_Name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (classFilterValue === 'all' || getClassId(program.Class_Name) === parseInt(classFilterValue)) &&
        (formFilterValue === 'all' || getEducationFormId(program.Education_Form_Name) === parseInt(formFilterValue))
    );

    if (filteredData.length === 0) {
        const noResultsMessage = document.createElement('p');
        noResultsMessage.textContent = 'По вашему запросу ничего не найдено';
        cardContainer.appendChild(noResultsMessage);
    } else {
        // Отобразим карточки при наличии результатов
        for (let i = startIndex; i < startIndex + cardsPerPage && i < filteredData.length; i++) {
            const program = filteredData[i];
            const { ID_Program, Specialty_Name, Specialty_Code, Training_Duration, Class_Name, Education_Form_Name } = program;

            const card = document.createElement('div');
            card.classList.add('card', 'mb-3');

            card.innerHTML = `
                <!-- Добавляем обработчик событий на карточку -->
                <div class="card-content" data-id="${ID_Program}">
                    <div class="additional-info">
                        <p class="card-text">Класс: ${Class_Name}</p>
                        <p class="card-text">Форма обучения: ${Education_Form_Name}</p>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${Specialty_Code} - ${Specialty_Name}</h5>
                        <p class="card-text">Срок обучения: ${Training_Duration}</p>
                    </div>
                </div>
            `;

            cardContainer.appendChild(card);
        }

        // Добавляем обработчик событий для каждой карточки
        const cardContentElements = document.querySelectorAll('.card-content');
        cardContentElements.forEach((cardContent) => {
            cardContent.addEventListener('click', () => {
                // Получаем ID_Program из data-id атрибута
                const programId = cardContent.dataset.id;
            window.location.href = `http://127.0.0.1:5500/src/pages/SecretaryPanel/AboutTheProgram.html?id=${programId}`;
            });
        });
    
    }
}

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
// Функция для отображения пагинации
function renderPagination(currentPage, totalPages) {
    const paginationContainer = document.getElementById('paginationContainer');
    paginationContainer.innerHTML = ''; // Очищаем контейнер перед отображением новой пагинации

    // Кнопка "Предыдущая"
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Предыдущая';
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            renderCardsWithSearchAndFilters((currentPage - 2) * cardsPerPage, cardsPerPage, searchInput.value, classFilter.value, formFilter.value);
            renderPagination(currentPage - 1, totalPages);
        }
    });
    paginationContainer.appendChild(prevButton);

    // Цифры страниц
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => {
            renderCardsWithSearchAndFilters((i - 1) * cardsPerPage, cardsPerPage, searchInput.value, classFilter.value, formFilter.value);
            renderPagination(i, totalPages);
        });
        paginationContainer.appendChild(pageButton);
    }

    // Кнопка "Следующая"
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Следующая';
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            renderCardsWithSearchAndFilters(currentPage * cardsPerPage, cardsPerPage, searchInput.value, classFilter.value, formFilter.value);
            renderPagination(currentPage + 1, totalPages);
        }
    });
    paginationContainer.appendChild(nextButton);
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

// Загрузка данных при загрузке страницы
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:3001/Programs');
        data = await response.json();

        cardsPerPage = 6;

        const totalPages = Math.ceil(data.length / cardsPerPage);

        searchInput = document.getElementById('specialty');
        classFilter = document.getElementById('classFilter'); // Убрали let перед classFilter
        formFilter = document.getElementById('formFilter'); // Убрали let перед formFilter

        renderCardsWithSearchAndFilters(0, cardsPerPage, '', 'all', 'all');
        renderPagination(1, totalPages);

        searchInput.addEventListener('input', () => {
            const searchQuery = searchInput.value;
            renderCardsWithSearchAndFilters(0, cardsPerPage, searchQuery, classFilter.value, formFilter.value);
            const totalPagesFiltered = Math.ceil(filteredData.length / cardsPerPage);
            renderPagination(1, totalPagesFiltered);
        });

        classFilter.addEventListener('change', () => {
            const searchQuery = searchInput.value;
            renderCardsWithSearchAndFilters(0, cardsPerPage, searchQuery, classFilter.value, formFilter.value);
            const totalPagesFiltered = Math.ceil(filteredData.length / cardsPerPage);
            renderPagination(1, totalPagesFiltered);
        });

        formFilter.addEventListener('change', () => {
            const searchQuery = searchInput.value;
            renderCardsWithSearchAndFilters(0, cardsPerPage, searchQuery, classFilter.value, formFilter.value);
            const totalPagesFiltered = Math.ceil(filteredData.length / cardsPerPage);
            renderPagination(1, totalPagesFiltered);
        });
        
        // Добавим кнопку "Сбросить"
        const resetButton = document.getElementById('resetButton');
        resetButton.addEventListener('click', resetFilters);

        startButton.addEventListener('click', () => {
            recognition.start();
        });
        const startButton = document.getElementById('startButton');
        startButton.addEventListener('click', () => {
            recognition.start();
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});
const inputField = document.getElementById('specialty');

const keyboardButton = document.getElementById('keyboardButton');

keyboardButton.addEventListener('click', () => {
    //  фокус на поле ввода
    inputField.focus();
});
