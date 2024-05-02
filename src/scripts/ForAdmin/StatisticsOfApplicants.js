// Функция форматирования строки даты
function formatDateString(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) {
        return null; 
    }
    const formattedDate = date.toISOString().split('T')[0];
    return formattedDate;
}

// Функция получения даты последнего месяца
function getLastMonthDate() {
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    return startDate;
}

function getLastWeekDates() {
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 7);
    return { startDate, endDate };
}async function generateStatistics() {
    try {
        const response = await fetch('http://localhost:3001/applications');
        const data = await response.json();

        const weeklyData = getDataForPeriod(data, getLastWeekDates());
        const monthlyData = getDataForPeriod(data, { startDate: getLastMonthDate(), endDate: new Date() });
        const yearlyData = getDataForPeriod(data, { startDate: new Date().getFullYear() - 1, endDate: new Date() });
        const labels = ['Неделя', 'Месяц', 'Год'];
        const datasets = [
            {
                label: 'Количество заявок за неделю',
                data: [Object.values(weeklyData).reduce((a, b) => a + b, 0), 0, 0],
                backgroundColor: ['rgba(255, 99, 132, 0.6)'],
                borderColor: ['rgba(255, 99, 132, 1)'],
                borderWidth: 2,
                categoryPercentage: 0.5,
                barPercentage: 0.5
            },
            {
                label: 'Количество заявок за месяц',
                data: [0, Object.values(monthlyData).reduce((a, b) => a + b, 0), 0],
                backgroundColor: ['rgba(54, 162, 235, 0.6)'],
                borderColor: ['rgba(54, 162, 235, 1)'],
                borderWidth: 2,
                categoryPercentage: 0.5,
                barPercentage: 0.8
            },
            {
                label: 'Количество заявок за год',
                data: [0, 0, Object.values(yearlyData).reduce((a, b) => a + b, 0)],
                backgroundColor: ['rgba(255, 205, 86, 0.6)'],
                borderColor: ['rgba(255, 205, 86, 1)'],
                borderWidth: 2,
                categoryPercentage: 0.5,
                barPercentage: 0.8
            }
        ];
        
        generateChart({ labels, datasets });
        
    } catch (error) {
        console.error('Ошибка при получении данных о заявках:', error);
    }
}

function getDataForPeriod(data, period) {
    const filteredData = data.filter(record => {
        const date = new Date(record.Submission_Date);
        return (date >= period.startDate) && (date <= period.endDate);
    });

    const applicationsData = {};

    filteredData.forEach(record => {
        const periodLabel = getPeriodLabel(record.Submission_Date, period);

        if (!applicationsData[periodLabel]) {
            applicationsData[periodLabel] = 0;
        }

        applicationsData[periodLabel]++;
    });

    return applicationsData;
}

function getPeriodLabel(dateString, period) {
    const date = new Date(dateString);

    if (date >= period.startDate && date <= period.endDate) {
        if (period.endDate - period.startDate <= 7 * 24 * 60 * 60 * 1000) {
            return 'Неделя';
        } else if (date.getMonth() === period.startDate.getMonth() && date.getFullYear() === period.startDate.getFullYear()) {
            return 'Месяц';
        } else if (date.getFullYear() === period.startDate.getFullYear()) {
            return 'Год';
        }
    }

    return '';
}


function getDataForPeriod(data, period, backgroundColor, borderColor) {
    const filteredData = data.filter(record => {
        const date = new Date(record.Submission_Date);
        const recordDate = `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + date.getDate()).slice(-2)}`;

        return (date >= period.startDate) && (date <= period.endDate);
    });

    const applicationsData = {};

    filteredData.forEach(record => {
        const date = formatDateString(record.Submission_Date);

        if (!applicationsData[date]) {
            applicationsData[date] = 0;
        }

        applicationsData[date]++;
    });

    return applicationsData;
}


function generateChart(data) {
    const ctx = document.getElementById('applicationsChart').getContext('2d');
    let existingChart = window.applicationsChart;

    if (existingChart instanceof Chart) {
        existingChart.destroy();
    }

    window.applicationsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: data.datasets
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Статистика по количеству заявок'
                }
            }
        }
    });
}
fetch('http://localhost:3001/totalUsers')
    .then(response => response.json())
    .then(data => {
        const totalUsers = data && data[0] && data[0].totalUsers !== undefined ? data[0].totalUsers : 0;

        // Запрос на получение количества абитуриентов
        fetch('http://localhost:3001/totalAbiturient')
            .then(response => response.json())
            .then(data => {
                const totalAbiturients = data && data[0] && data[0].totalAbiturients !== undefined ? data[0].totalAbiturients : 0;

                // Суммируем значения и обновляем блок статистики
                const totalUsersAndAbiturients = totalUsers + totalAbiturients;
                document.getElementById('totalUsers').innerText = `Количество зарегистрированных пользователей: ${totalUsersAndAbiturients}`;
            })
            .catch(error => console.error('Error fetching totalAbiturient:', error));
    })
    .catch(error => console.error('Error fetching totalUsers:', error));

    fetch('http://localhost:3001/totalUsers')
    .then(response => response.json())
    .then(data => {
        if (data && data[0] && data[0].totalUsers !== undefined) {
            document.getElementById('totalEmployee').innerText = `Количество сотрудников: ${data[0].totalUsers}`;
        } else {
            console.error('Error: Invalid data received for totalEmployee');
        }
    })
    .catch(error => console.error('Error fetching totalEmployee:', error));

fetch('http://localhost:3001/totalAbiturient')
.then(response => response.json())
.then(data => {
    if (data && data[0] && data[0].totalAbiturients !== undefined) {
        document.getElementById('totalAbiturients').innerText = `Количество абитуриентов: ${data[0].totalAbiturients}`;
    } else {
        console.error('Error: Invalid data received for totalAbiturients');
    }
})
.catch(error => console.error('Error fetching totalAbiturient:', error));

// Инициализация по умолчанию (при загрузке страницы)
generateStatistics();

        // Получение данных о пользовательских статистиках с сервера
        Promise.all([
            fetch('http://localhost:3001/totalUsers').then(response => response.json()),
            fetch('http://localhost:3001/totalAbiturient').then(response => response.json())
        ]).then(([totalUsersData, totalAbiturientData]) => {
            const adminCount = totalUsersData[0].totalUsers;
            const abiturientCount = totalAbiturientData[0].totalAbiturients;

            // Создание данных для диаграммы
            const userData = {
                labels: ['Администраторы', 'Абитуриенты'],
                datasets: [{
                    label: 'Количество пользователей',
                    data: [adminCount, abiturientCount],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)', // Красный цвет для администраторов
                        'rgba(54, 162, 235, 0.5)' // Синий цвет для абитуриентов
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)'
                    ],
                    borderWidth: 0,
                    barThickness: 50 // ширину столбцов

                }]
            };

            // Получение контекста холста
            const ctx = document.getElementById('userChart').getContext('2d');

            // Создание объекта диаграммы
            const userChart = new Chart(ctx, {
                type: 'bar',
                data: userData,
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }).catch(error => {
            console.error('Ошибка при получении данных:', error);
        });