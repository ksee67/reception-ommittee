async function checkStatus() {
    const applicationNumberInput = parseInt(document.getElementById('applicationNumber').value);

    try {
        const userId = localStorage.getItem('userId');
        const response = await fetch(`http://localhost:3001/getAllApplications`);
        const applications = await response.json();

        const application = applications.find(app => app.Application_ID === applicationNumberInput);
        const submissionDate = new Date(application.Submission_Date);
        const formattedDate = `${submissionDate.getDate().toString().padStart(2, '0')}-${(submissionDate.getMonth() + 1).toString().padStart(2, '0')}-${submissionDate.getFullYear()}`;
        
        if (application) {
            const statusCard = document.getElementById('statusCard');
            statusCard.innerHTML = `
                <div class="card">
                    <div class="card-body">
                    <h5 class="card-title">Статус заявки №${application.Application_ID}</h5>
                        <p class="card-text">
                            Специальность: ${application.Specialty_Code} ${application.Specialty_Name}<br>
                            Дата подачи: ${formattedDate}<br>
                            Статус: <b>${application.Status_name}</b>
                        </p>

                    </div>
                </div>
            `;
        } else {
            alert('Заявка с указанным номером не найдена');
        }
    } catch (error) {
        console.error('Error fetching application status:', error);
        alert('Произошла ошибка при получении статуса заявки');
    }
}
