document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const programId = urlParams.get('id');

    fetch(`http://localhost:3001/AboutPrograms?id=${programId}`)
        .then(response => response.json())
        .then(data => {
            //  HTML данными из полученного ответа
            document.getElementById('Specialty_Name').textContent = data.Specialty_Name;
            document.getElementById('Specialty_Code').innerHTML = `<strong>Направление специальности:</strong> ${data.Specialty_Code}`;
            document.getElementById('Qualification_Name').innerHTML = `<strong>Квалификация:</strong> ${data.Qualification_Name}`;
            document.getElementById('Training_Duration').innerHTML = `<strong>Срок обучения:</strong> ${data.Training_Duration}`;
            document.getElementById('Class_Name').innerHTML = `<strong>На базе какого класса:</strong> ${data.Class_Name}`;
            document.getElementById('Education_Form_Name').innerHTML = `<strong>Форма обучения:</strong> ${data.Form_Name}`;
            document.getElementById('Description').innerHTML = `<strong>Описание специальности:</strong> ${data.Description}`;

            // картинка
            const programImage = document.getElementById('programImage');
            if (programImage) {
                programImage.src = data.Photo_URL;
            }
        })
        .catch(error => console.error('Ошибка:', error));

    // Функция для получения данных о количестве мест, количестве поданных заявлений и проходном балле
        fetch(`http://localhost:3001/getPassingGrade/${programId}`)
            .then(response => response.json())
            .then(data => {
                // Выводим данные о количестве мест, если они есть
                if (data.length > 0) {
                    const passingGrade = document.getElementById('passingGrade');
                    passingGrade.innerHTML = `<strong>Проходной балл на текущий момент:</strong> ${data[0].Passing_Grade}`;
                } else {
                    const Passing_Grade = document.getElementById('passingGrade');
                    Passing_Grade.innerHTML = '<strong>Проходной балл на текущий момент:</strong> 3.0';
                }
            })
            .catch(error => console.error('Ошибка при получении данных о проходном балле и количестве мест:', error));

        // Запрашиваем данные о количестве поданных заявлений
        fetch(`http://localhost:3001/getApplicationCount/${programId}`)
            .then(response => response.json())
            .then(data => {
                // Выводим количество поданных заявлений, если они есть
                if (data.length > 0) {
                    const applicationCount = document.getElementById('applicationCount');
                    applicationCount.innerHTML = `<strong>Количество поданных заявлений:</strong> ${data[0].Total_Count}`;
                } else {
                    const applicationCount = document.getElementById('applicationCount');
                    applicationCount.innerHTML = '<strong>Количество поданных заявлений:</strong> Нет поданных заявлений';
                }
            })
            .catch(error => console.error('Ошибка при получении данных о количестве поданных заявлений:', error));
            
            fetch(`http://localhost:3001/places/${programId}`)
            .then(response => response.json())
            .then(data => {
                // Выводим количество поданных заявлений, если они есть
                if (data.length > 0) {
                    const availableSeats = document.getElementById('availableSeats');
                    availableSeats.innerHTML = `<strong>Количество мест:</strong> ${data[0].Available_Seats}`;
                } else {
                    const availableSeats = document.getElementById('availableSeats');
                    availableSeats.innerHTML = '<strong>Количество мест:</strong> Нет информации';
                }
            })
            .catch(error => console.error('Ошибка при получении данных о количестве поданных заявлений:', error));
    

    // Повторно вызываем функцию при изменении программы
    document.getElementById('selectProgram').addEventListener('change', function () {
        const selectedProgramId = this.value;
        fetchData(selectedProgramId);
    });
});
