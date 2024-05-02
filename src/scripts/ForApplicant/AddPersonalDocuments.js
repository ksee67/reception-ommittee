function clearField(fieldId) {
    document.getElementById(fieldId).value = '';
}

function validateFileSize(input, maxSizeInMB) {
    if (input.files.length > 0) {
        const fileSizeInMB = input.files[0].size / (1024 * 1024); // размер файла в мегабайтах
        if (fileSizeInMB > maxSizeInMB) {
            alert(`Максимальный размер файла должен быть ${maxSizeInMB} МБ`);
            input.value = ''; 
        }
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    const userId = localStorage.getItem('userId');
    console.log('Пользователя ID:', userId); // для проверки айдишника
  
    try {
        const response = await fetch(`http://localhost:3001/PersonalData/${userId}`);
      
        if (!response.ok) {
            console.error('Ошибка при запросе данных пользователя');
            return;
        }
  
        const userData = await response.json();

        document.getElementById('gender').value = userData[0].Gender;
        document.getElementById('phoneNumber').value = userData[0].Phone_Number;
        document.getElementById('passportSeries').value = userData[0].Series;
        document.getElementById('passportNumber').value = userData[0].Number;
        document.getElementById('passportCode').value = userData[0].Subdivision_Code;
        document.getElementById('passportIssuedBy').value = userData[0].Issued_By;
        document.getElementById('certificateFileName').textContent = userData[0].Photo_certificate;
        document.getElementById('passportFileName').textContent = userData[0].Photo_passport;

        // Проверка и преобразование даты
        if (userData[0].Date_of_Issue) {
            const formattedDate = new Date(userData[0].Date_of_Issue).toISOString().split('T')[0];
            document.getElementById('passportIssueDate').value = formattedDate;
        }

        document.getElementById('residenceAddress').value = userData[0].Actual_Residence_Address;
        document.getElementById('registrationAddress').value = userData[0].Registration_Address;
        document.getElementById('snils').value = userData[0].SNILS;

        document.getElementById('passportCode').addEventListener('input', function () {
            const input = this.value.replace(/\D/g, ''); // Оставляем только цифры
            if (input.length > 6) {
                this.value = input.slice(0, 6);
            } else {
                this.value = input;
            }
        });

        document.getElementById('passportNumber').addEventListener('input', function () {
            const input = this.value.replace(/\D/g, ''); // Оставляем только цифры
            if (input.length > 5) {
                this.value = input.slice(0, 5);
            } else {
                this.value = input;
            }
        });

        document.getElementById('passportSeries').addEventListener('input', function () {
            const input = this.value.replace(/\D/g, ''); // Оставляем только цифры
            if (input.length > 4) {
                this.value = input.slice(0, 4);
            } else {
                this.value = input;
            }
        });

        // Добавление маски для номера телефона
        $(document).ready(function(){
            // Используем Inputmask.js для применения маски
            Inputmask().mask(document.querySelectorAll("input"));
        });
        
        // Ограничение на количество символов в адресах
        const residenceAddressInput = document.getElementById('residenceAddress');
        residenceAddressInput.addEventListener('input', function () {
            if (this.value.length > 255) {
                this.value = this.value.slice(0, 255);
            }
        });

        const registrationAddressInput = document.getElementById('registrationAddress');
        registrationAddressInput.addEventListener('input', function () {
            if (this.value.length > 255) {
                this.value = this.value.slice(0, 255);
            }
        });

    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
    }
    // Функция для удаления пробелов из строки
    function removeSpaces(str) {
        return str.replace(/\s/g, '');
    }
    document.getElementById('saveDocumentsButton').addEventListener('click', async function () {
        const userId = localStorage.getItem('userId');
        console.log('Айди студента:', userId); // для проверки айдишника
        var agreeCheckbox = document.getElementById("agreeCheckbox");
        if (!agreeCheckbox.checked) {
            alert("Для продолжения регистрации необходимо принять условия политики обработки персональных данных.");
            return; // Остановка выполнения функции
        }
        // Получаем остальные значения полей формы
        const gender = document.getElementById('gender').value;
        let phoneNumber = document.getElementById('phoneNumber').value;
        phoneNumber = removeSpaces(phoneNumber);
        const passportSeries = document.getElementById('passportSeries').value;
        const passportNumber = document.getElementById('passportNumber').value;
        const passportCode = document.getElementById('passportCode').value;
        const passportIssuedBy = document.getElementById('passportIssuedBy').value;
        const passportIssueDate = document.getElementById('passportIssueDate').value;
        const residenceAddress = document.getElementById('residenceAddress').value;
        const registrationAddress = document.getElementById('registrationAddress').value;
        const snils = document.getElementById('snils').value;
        const certificatePhotoName = document.getElementById('certificateFileName').textContent; // Получаем название файла аттестата
        const passportPhotoName = document.getElementById('passportFileName').textContent; // Получаем название файла паспорта
    
        console.log('Пол:', gender); // для проверки пола
        // Проверяем ограничения на ввод данных
        if (!gender || !phoneNumber || !passportSeries || !passportNumber || !passportCode || !passportIssuedBy || !passportIssueDate || !residenceAddress || !registrationAddress || !snils || !certificatePhotoName || !passportPhotoName) {
            alert('Пожалуйста, заполните все поля формы');
            return;
        }

        const series = /^\d{4}$/;
        if (!series.test(passportSeries)) {
            alert('Серия паспорта должна содержать 4 цифры');
            return;
        }
        if (!phoneNumber.match(/^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/)) {
            alert('Номер телефона должен соответствовать маске +7(999)999-99-99');
            return;
        }
        const number = /^\d{5}$/;
        if (!number.test(passportNumber)) {
            alert('Номер паспорта должен содержать ровно 5 цифр');
            return;
        }
        const code = /^\d{6}$/;
        if (!code.test(passportCode)) {
            alert('Код подразделения паспорта должен содержать ровно 6 цифры');
            return;
        }
     
        if (passportIssuedBy.length < 2 || passportIssuedBy.length > 255) {
            alert('Выдано кем должно содержать минимум 2 и максимум 255 символов');
            return;
        }
        if (residenceAddress.length < 2 || residenceAddress.length > 255) {
            alert('Адрес проживания должен содержать минимум 2 и максимум 255 символов');
            return;
        }
        if (registrationAddress.length < 2 || registrationAddress.length > 255) {
            alert('Адрес регистрации должен содержать минимум 2 и максимум 255 символов');
            return;
        }
        const snilsPattern = /^\d{11}$/; // выражение для проверки, что SNILS содержит только цифры и имеет длину 11 символов

        if (!snilsPattern.test(snils)) {
            alert('СНИЛС должен содержать ровно 11 цифр');
            return;
        }

        const currentDate = new Date().toISOString().split('T')[0];
        if (passportIssueDate > currentDate) {
            alert('Дата выдачи паспорта не может быть позже текущей даты');
            return;
        }
    
        try {
            if (!gender || !phoneNumber || !passportSeries || !passportNumber || !passportCode || !passportIssuedBy || !passportIssueDate || !residenceAddress || !registrationAddress || !snils || !certificatePhotoName || !passportPhotoName) {
                alert('Пожалуйста, заполните все поля формы');
                return;
            }
    
            // Проверяем наличие данных для данного абитуриента
            const responseAvailability = await fetch(`http://localhost:3001/PersonalDataAvailability/${userId}`);
            const dataAvailability = await responseAvailability.json();
    
            if (dataAvailability[0].count > 0) {
                // Если данные существуют, выполняем обновление
                const responseUpdate = await fetch(`http://localhost:3001/PersonalDataEdit/${userId}`, {
                    method: 'PUT',
                    body: formData,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        
                        Gender: gender,
                        Phone_Number: phoneNumber,
                        Series: passportSeries,
                        Number: passportNumber,
                        Subdivision_Code: passportCode,
                        Issued_By: passportIssuedBy,
                        Date_of_Issue: passportIssueDate,
                        Actual_Residence_Address: residenceAddress,
                        Registration_Address: registrationAddress,
                        SNILS: snils,
                        Photo_certificate: certificatePhotoName, // Добавляем название файла аттестата
                        Photo_passport: passportPhotoName // Добавляем название файла паспорта
                    })
                });
    
                if (responseUpdate.ok) {
                    alert('Данные успешно обновлены');
                    // Очищаем поля формы после успешного сохранения
                } else {
                    alert('Ошибка при обновлении данных');
                }
            } else {
                if (!gender || !phoneNumber || !passportSeries || !passportNumber || !passportCode || !passportIssuedBy || !passportIssueDate || !residenceAddress || !registrationAddress || !snils || !certificatePhotoName || !passportPhotoName) {
                    alert('Пожалуйста, заполните все поля формы');
                    return;
                }
        
                console.log('Отправляемые данные:', {
                    Abiturient_ID: userId,
                    Gender: gender,
                    Phone_Number: phoneNumber,
                    Series: passportSeries,
                    Number: passportNumber,
                    Subdivision_Code: passportCode,
                    Issued_By: passportIssuedBy,
                    Date_of_Issue: passportIssueDate,
                    Actual_Residence_Address: residenceAddress,
                    Registration_Address: registrationAddress,
                    SNILS: snils,
                    Photo_certificate: certificatePhotoName,
                    Photo_passport: passportPhotoName
                });
                
                // Если данных не существует, создаем новую запись
                const responseAdd = await fetch(`http://localhost:3001/PersonalDataAdd1`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        Abiturient_ID: userId,
                        Gender: gender,
                        Phone_Number: phoneNumber,
                        Series: passportSeries,
                        Number: passportNumber,
                        Subdivision_Code: passportCode,
                        Issued_By: passportIssuedBy,
                        Date_of_Issue: passportIssueDate,
                        Actual_Residence_Address: residenceAddress,
                        Registration_Address: registrationAddress,
                        SNILS: snils,
                        Photo_certificate: certificatePhotoName, // Добавляем название файла аттестата
                        Photo_passport: passportPhotoName // Добавляем название файла паспорта
                    })                
                });
    
                if (responseAdd.ok) {
                    alert('Данные успешно добавлены');
                    // Очищаем поля формы после успешного сохранения
                } else {
                    alert('Ошибка при добавлении данных');
                }
            }
        } catch (error) {
            console.error('Ошибка при отправке запроса:', error);
        }
    });

    document.getElementById('certificatePhoto').addEventListener('change', function() {
        const fileInput = document.getElementById('certificatePhoto');
        const preview = document.getElementById('certificatePhotoPreview');
        const fileNameDisplay = document.getElementById('certificateFileName'); // Получаем элемент для отображения названия файла
    
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name; // Получаем название файла
            fileNameDisplay.textContent = fileName; // Отображаем название файла
            preview.src = URL.createObjectURL(fileInput.files[0]); // Показываем выбранное изображение
            preview.style.display = 'block';
        } else {
            fileNameDisplay.textContent = 'Файл не выбран'; // Обновляем текст, если файл не выбран
            preview.src = '';
            preview.style.display = 'none';
        }
    });
    
    document.getElementById('passportPhoto').addEventListener('change', function() {
        const fileInput = document.getElementById('passportPhoto');
        const preview = document.getElementById('passportPhotoPreview');
        const fileNameDisplay = document.getElementById('passportFileName'); // Получаем элемент для отображения названия файла
    
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name; // Получаем название файла
            fileNameDisplay.textContent = fileName; // Отображаем название файла
            preview.src = URL.createObjectURL(fileInput.files[0]); // Показываем выбранное изображение
            preview.style.display = 'block';
        } else {
            fileNameDisplay.textContent = 'Файл не выбран'; // Обновляем текст, если файл не выбран
            preview.src = '';
            preview.style.display = 'none';
        }
    });
    // JavaScript
    document.querySelectorAll('.preview-image').forEach(item => {
        item.addEventListener('click', function() {
            const modal = document.getElementById('modal');
            const modalImg = document.getElementById('modalImage');
            
            modal.style.display = "block";
            modalImg.src = this.src;
            
            const span = document.getElementsByClassName("close")[0];
            
            span.onclick = function() {
                modal.style.display = "none";
            }
        });
    });

});


