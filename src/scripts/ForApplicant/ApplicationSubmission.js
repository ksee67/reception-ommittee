// Функция для преобразования значения с запятой в точку
function convertCommaToDot(value) {
    return value.replace(',', '.'); // Заменяем запятую на точку
}
document.querySelector('.btn-primary').addEventListener('click', async () => {
    try {
      const userId = localStorage.getItem('userId'); // Получаем ID пользователя из localStorage
      const responseAvailability = await fetch(`http://localhost:3001/PersonalDataAvailability/${userId}`);
      const dataAvailability = await responseAvailability.json();
  
      if (dataAvailability[0].count > 0) {
        // Если данные существуют, то продолжаем подачу заявки
        let averageGradeInput = document.getElementById('averageGrade');
        const averageGrade = convertCommaToDot(averageGradeInput.value); // Преобразуем значение с запятой в точку
        const specialty = document.getElementById('specialty').value;
  
        // Проверяем средний балл
        if (!validateAverageGrade(averageGrade)) {
          return; // Прерываем отправку формы
        }
  
        // Проверяем, подавал ли студент заявку на эту специальность уже
        const responseCheckApplication = await fetch(`http://localhost:3001/checkApplication/${userId}/${specialty}`);
        const dataCheckApplication = await responseCheckApplication.json();
  
        if (dataCheckApplication[0].count > 0) {
          // Если заявка уже подана, выводим сообщение и прерываем подачу заявки
          alert('Вы уже подали заявку на эту специальность.');
          return;
        }
  
        // Проверяем, не превышено ли количество заявок для абитуриента
        const responseCheckApplicationCount = await fetch(`http://localhost:3001/getCheckApplication/${userId}`);
        const dataCheckApplicationCount = await responseCheckApplicationCount.json();
  
        if (dataCheckApplicationCount[0].count >= 5) {
          // Если количество заявок превышено, выводим сообщение и прерываем подачу заявки
          alert('Вы уже подали максимальное количество заявок.');
          return;
        }
  
        // Подтверждаем отправку заявки
        if (!confirmSubmission()) {
          return; // Прерываем отправку формы
        }
  
        // Если данные в таблице Personal_Data есть и дубликатов нет, отправляем заявку
        const response = await fetch('http://localhost:3001/submitApplication/' + userId, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            averageGrade,
            specialty
          })
        });
  
        if (!response.ok) {
          throw new Error('Failed to submit application');
        }
  
        const data = await response.json();
        console.log(data.message); // Ответ от сервера
        alert('Заявка успешно отправлена. Посмотрите статус заявки в личном'); // Уведомление о успешной отправке
        location.reload(); // Перезагрузка страницы
      } else {
        // Если данных нет, выводим сообщение и прерываем подачу заявки
        alert('Персональные данные не заполнены. Заполните данные перед подачей заявки.');
        return;
      }
    } catch (error) {
      console.error('Ошибка при отправке заявки:', error);
      alert('Произошла ошибка при отправке заявки');
    }
  });
  
// Функция для проверки среднего балла
function validateAverageGrade(averageGrade) {
    averageGrade = convertCommaToDot(averageGrade); // Преобразуем значение с запятой в точку для проверки
    if (!/^([3-5](\.|\,)?\d{0,5}|5(\.|\,)?0{1,5})$/.test(averageGrade)) {
        alert('Ошибка ввода среднего балла обучения. Введите число от 3 до 5 с не более чем четырьмя знаками после запятой.');
        return false; // Прерываем отправку формы
    }

    // Проверяем, что значение находится в диапазоне от 3 до 5
    if (parseFloat(averageGrade) < 3 || parseFloat(averageGrade) > 5) {
        alert('Ошибка ввода среднего балла обучения. Средний балл должен быть не менее 3 и не более 5.');
        return false; // Прерываем отправку формы
    }

    return true;
}



// Функция для подтверждения отправки заявки
function confirmSubmission() {
    const specialtySelect = document.getElementById('specialty');
    const specialtyText = specialtySelect.options[specialtySelect.selectedIndex].text;
    const averageGrade = document.getElementById('averageGrade').value;

    const confirmation = confirm(`Вы уверены, что хотите подать заявку на специальность "${specialtyText}" с баллом ${averageGrade}?`);

    return confirmation;
}

// Загружаем программы при загрузке страницы
document.addEventListener('DOMContentLoaded', loadPrograms);

async function loadPrograms() {
    try {
        const serviceResponse = await fetch('http://localhost:3001/ListOfPrograms');
        if (!serviceResponse.ok) {
            throw new Error('Failed to fetch service data');
        }
        const serviceData = await serviceResponse.json();
        const serviceSelect = $('#specialty'); // jQuery для выбора элемента

        serviceData.forEach(service => {
            const option = new Option(`${service.Specialty_Code} ${service.Specialty_Name} - ${service.Form_Name} - ${service.Class_Name}`, service.ID_Program, false, false);
            serviceSelect.append(option);
        });

        // Применяем Select2 к элементу select
        serviceSelect.select2();

        // Обработчик события изменения выбранной услуги
        serviceSelect.on('change', function () {
            // Ваш код обработки изменения выбранной услуги здесь
            console.log('Выбранная специальность:', $(this).val());
        });

    } catch (error) {
        console.error('Error fetching service data:', error);
    }
}
// Получение данных о заявках с сервера
async function fetchApplications(userId) {
    try {
        const response = await fetch(`http://localhost:3001/getApplications/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch applications');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching applications:', error);
        return [];
    }
}

// Функция для создания карточки по заявке с кнопкой удаления
function createApplicationCard(application) {
    const card = document.createElement('div');
    card.classList.add('card');
    
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    
    const title = document.createElement('h5');
    title.classList.add('card-title');
    title.textContent = `Заявка №${application.Application_ID}`;
    
    // Форматирование даты
    const submissionDate = new Date(application.Submission_Date);
    const formattedDate = `${submissionDate.getFullYear()}-${(submissionDate.getMonth() + 1).toString().padStart(2, '0')}-${submissionDate.getDate().toString().padStart(2, '0')}`;
    
    const details = document.createElement('p');
    details.classList.add('card-text');
    details.innerHTML = `
        Дата подачи: ${formattedDate}<br>
        Специальность:  ${application.Specialty_Code} ${application.Specialty_Name}<br>
        Форма обучения: ${application.Form_Name}. ${application.Class_Name} класса<br>
    `;

    // Создание кнопки удаления
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Отменить заявку';
    deleteButton.classList.add('btn', 'btn-danger', 'mt-2');
    deleteButton.addEventListener('click', async () => {
        // Запрашиваем подтверждение перед удалением
        const confirmDelete = confirm(`Вы уверены, что хотите удалить заявку №${application.Application_ID}?`);
    
        if (confirmDelete) {
            try {
                const response = await fetch(`http://localhost:3001/deleteApplication/${application.Application_ID}`, {
                    method: 'DELETE'
                });
    
                if (!response.ok) {
                    throw new Error('Failed to delete application');
                }
    
                // Удаление карточки из интерфейса
                card.remove();
                alert('Заявка успешно удалена');
                
                // Обновление страницы после удаления
                location.reload();
            } catch (error) {
                console.error('Error deleting application:', error);
                alert('Произошла ошибка при удалении заявки');
            }
        }
    });
    

    cardBody.appendChild(title);
    cardBody.appendChild(details);
    cardBody.appendChild(deleteButton); // Добавление кнопки удаления
    card.appendChild(cardBody);
    
    return card;
}


// Функция для отображения карточек на странице
async function displayApplications(userId) {
    const applications = await fetchApplications(userId);
    const container = document.getElementById('applicationContainer');

    // Очищаем контейнер перед добавлением новых карточек
    container.innerHTML = '';

    if (applications.length === 0) {
        // Если нет заявок, добавляем надпись
        const noApplicationsMessage = document.createElement('p');
        noApplicationsMessage.textContent = 'У вас пока нет заявок.';
        container.appendChild(noApplicationsMessage);
    } else {
        // Если есть заявки, добавляем карточки
        applications.forEach(application => {
            const card = createApplicationCard(application);
            container.appendChild(card);
        });
    }
}

// Получение userId из localStorage
const userId = localStorage.getItem('userId');
console.log('UserID:', userId);

// Вызов функции для отображения карточек по заявкам
displayApplications(userId);
