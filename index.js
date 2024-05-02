const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // для сохранения загруженных файлов
const cors = require('cors');
const { createPool } = require('mysql');
const { exec } = require('child_process');
const crypto = require('crypto');

const app = express();
const port = 3001;
app.use(cors()); // Кросс-доменные запросы
app.use(bodyParser.json({ limit: '10mb' }));

// Подключений к базе данных
const pool = createPool({
  host: "localhost",
  user: "root",
  password: "M2$xbu7g",
  database: "AdmissionCommittee",
});

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Функция для шифрования данных
function encryptData(data, key) {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encryptedData = cipher.update(data, 'utf8', 'hex');
  encryptedData += cipher.final('hex');
  return encryptedData;
}


// Функция для дешифрования данных
function decryptData(data, key) {
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decryptedData = decipher.update(data, 'hex', 'utf8');
  decryptedData += decipher.final('utf8');
  return decryptedData;
}

app.post('/PersonalDataAdd1', async (req, res) => {
  try {
      const {
          Abiturient_ID,
          Gender,
          Phone_Number,
          Series,
          Number,
          Subdivision_Code,
          Issued_By,
          Date_of_Issue,
          Actual_Residence_Address,
          Registration_Address,
          SNILS,
          Photo_certificate,
          Photo_passport
      } = req.body;

      // ключ шифрования.
      const encryptionKey = 'mySecretKey123';

      // Шифрование данных перед добавлением в базу данных
      const encryptedData = {
          Series: encryptData(Series, encryptionKey),
          Number: encryptData(Number, encryptionKey),
          Subdivision_Code: encryptData(Subdivision_Code, encryptionKey),
          Issued_By: encryptData(Issued_By, encryptionKey),
          Actual_Residence_Address: encryptData(Actual_Residence_Address, encryptionKey),
          Registration_Address: encryptData(Registration_Address, encryptionKey),
          SNILS: encryptData(SNILS, encryptionKey)
      };

      const sql = `
          INSERT INTO Personal_Data 
          (Abiturient_ID, Gender, Phone_Number, Series, Number, Subdivision_Code, Issued_By, Date_of_Issue, Actual_Residence_Address, Registration_Address, SNILS, Photo_certificate, Photo_passport) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      pool.query(sql, [
          Abiturient_ID,
          Gender,
          Phone_Number,
          encryptedData.Series,
          encryptedData.Number,
          encryptedData.Subdivision_Code,
          encryptedData.Issued_By,
          Date_of_Issue,
          encryptedData.Actual_Residence_Address,
          encryptedData.Registration_Address,
          encryptedData.SNILS,
          Photo_certificate,
          Photo_passport
      ], (error, results) => {
          if (error) {
              console.error('Ошибка запроса: ' + error.message);
              res.status(500).send('Ошибка сервера');
              return;
          }
          res.status(200).send('Данные успешно добавлены');
      });
  } catch (error) {
      console.error('Произошла ошибка:', error);
      res.status(500).json({ error: 'Произошла ошибка на сервере' });
  }
});

app.post('/createBackup', (req, res) => {
  const backupFileName = 'backup.sql';
  const backupQuery = '"D:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe" -u root -pM2$xbu7g AdmissionCommittee > ' + backupFileName;

  exec(backupQuery, (error, stdout, stderr) => {
      if (error) {
          console.error(`Ошибка создания бэкапа: ${stderr}`);
          res.status(500).send({ error: 'Произошла ошибка при создании резервной копии.' });
      } else {
          console.log(`Бэкап успешно создан: ${backupFileName}`);
          res.status(200).json({ message: 'Бэкап успешно создан' });
        }
  });
});

app.post('/restoreBackup', (req, res) => {
  const backupFileName = 'backup.sql';
  const restoreQuery = `mysql -u root -pM2$xbu7g AdmissionCommittee < ${backupFileName}`;

  exec(restoreQuery, (error, stdout, stderr) => {
    if (error) {
      console.error(`Ошибка восстановления бэкапа: ${stderr}`);
      res.status(500).send({ error: 'Произошла ошибка при восстановлении резервной копии.' });
    } else {
      console.log(`Резервная копия успешно восстановлена: ${backupFileName}`);
      res.status(200).json({ message: 'Резервная копия успешно восстановлена' });
    }
  });
});
app.put('/updateEmailAddress/', (req, res) => {
  const newEmailAddress = req.body.emailAddress;

  const query = `
    UPDATE EmailAddresses
    SET EmailAddress = ?
    WHERE ID_Email = 1;
  `;

  pool.query(query, [newEmailAddress], (error) => {
    if (error) {
      console.error('Ошибка при обновлении электронной почты:', error);
      res.status(500).json({ message: 'Ошибка при обновлении электронной почты' });
      return;
    }

    console.log(`Электронная почта с ID 1 успешно обновлена`);
    res.json({ message: 'Электронная почта успешно обновлена' });
  });
});// POST-маршрут для отправки электронного письма
app.post('/sendHelpEmail', async (req, res) => {
  const { name, email, question } = req.body;

  // Получение электронной почты из базы данных
  const query = 'SELECT EmailAddress FROM EmailAddresses WHERE ID_Email = 1';
  let helpEmail;
  try {
    pool.query(query, (error, results) => {
      if (error) {
        console.error('Ошибка при получении электронной почты из базы данных:', error);
        res.status(500).json({ success: false, message: 'Произошла ошибка при получении электронной почты' });
        return;
      }
      helpEmail = results[0].EmailAddress;

      // Настройки транспорта Nodemailer
      const transporter = nodemailer.createTransport({
          host: 'smtp.mail.ru',
          port: 465,
          secure: true,
          auth: {
              user: 'vfznd@mail.ru',
              pass: 'a4FcenM9TGGpPazzpFH1',
          },
      });

      // Параметры электронного письма
      const mailOptions = {
          from: '"Электронная приемная комиссия РЭУ" <vfznd@mail.ru>',
          to: helpEmail, // электронная почта для получения сообщений из базы данных
          subject: 'Новое сообщение от абитуриента',
          text: `
              Имя: ${name}\n
              Email: ${email}\n
              Вопрос: ${question}\n
          `,
      };

      // Отправка электронного письма
      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.error('Ошибка при отправке уведомления на почту:', error);
              res.status(500).json({ success: false, message: 'Произошла ошибка при отправке Email' });
              return;
          }
          console.log(`Уведомление отправлено на почту ${email}: ${info.response}`);
          res.json({ success: true, message: 'Email успешно отправлен' });
      });
    });
  } catch (error) {
    console.error('Ошибка при выполнении запроса к базе данных:', error);
    res.status(500).json({ success: false, message: 'Произошла ошибка при выполнении запроса к базе данных' });
  }
});

// POST-маршрут для отправки электронного письма
app.post('/sendEmail', async (req, res) => {
  const { email, message } = req.body;

  const transporter = nodemailer.createTransport({
      host: 'smtp.mail.ru',
      port: 465,
      secure: true,
      auth: {
          user: 'vfznd@mail.ru',
          pass: 'a4FcenM9TGGpPazzpFH1',
      },
  });

  const mailOptions = {
      from: '"Электронная приемная комиссия РЭУ" <vfznd@mail.ru>',
      to: email,
      subject: 'Изменен статус заявки',
      text: message,
  };

  try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Уведомление отправлено на почту секретаря: ${info.response}`);
      res.json({ success: true, message: 'Email успешно отправлен' });
  } catch (error) {
      console.error('Ошибка при отправке уведомления на почту:', error);
      res.status(500).json({ success: false, message: 'Произошла ошибка при отправке Email' });
  }
});

app.delete('/logout', (req, res) => {
  res.sendStatus(204); 
});

app.put('/updateAbiturient/:userId', async (req, res) => {
  try {
    const abiturientId = req.params.userId;

    // Извлекаем данные из запроса
    const { lastName, firstName, middleName, birthdate, email } = req.body;

    // Подготавливаем SQL-запрос для обновления записи в таблице Abiturient
    const query = `
      UPDATE Abiturient
      SET Surname = ?, First_Name = ?, Middle_Name = ?, Date_of_Birth = ?, Login = ?
      WHERE ID_Abiturient = ?`;

    pool.query(query, [lastName, firstName, middleName, birthdate, email, abiturientId], (err, results) => {
      if (err) {
        console.error('Ошибка при обновлении данных абитуриента в базе данных:', err);
        return res.status(500).json({ error: 'Ошибка при обновлении данных абитуриента' });
      }

      res.json({ message: 'Данные абитуриента успешно обновлены' });
    });
  } catch (error) {
    console.error('Произошла ошибка:', error);
    res.status(500).json({ error: 'Произошла ошибка на сервере' });
  }
});

app.put('/updateAdministrator/:adminId', async (req, res) => {
  try {
    const adminId = req.params.adminId;

    // Извлекаем данные из запроса
    const { lastName, firstName, middleName, birthdate, email } = req.body;

    // Подготавливаем SQL-запрос для обновления записи в таблице Administrator
    const query = `
      UPDATE Administrator
      SET Surname = ?, First_Name = ?, Middle_Name = ?, Date_of_Birth = ?, Login = ?
      WHERE ID_Administrator = ?`;

    pool.query(query, [lastName, firstName, middleName, birthdate, email, adminId], (err, results) => {
      if (err) {
        console.error('Ошибка при обновлении данных администратора в базе данных:', err);
        return res.status(500).json({ error: 'Ошибка при обновлении данных администратора' });
      }

      res.json({ message: 'Данные администратора успешно обновлены' });
    });
  } catch (error) {
    console.error('Произошла ошибка:', error);
    res.status(500).json({ error: 'Произошла ошибка на сервере' });
  }
});


app.post('/addPersonalData', async (req, res) => {
  try {
      const {
          Gender,
          Phone_Number,
          Series,
          Number,
          Subdivision_Code,
          Issued_By,
          Date_of_Issue,
          Actual_Residence_Address,
          Registration_Address,
          SNILS,
          Abiturient_ID,
          Document_ID
      } = req.body;

      // Ваш ключ шифрования. Храните его в безопасном месте.
      const encryptionKey = 'mySecretKey123';

      // Шифрование данных перед добавлением в базу данных
      const encryptedData = {
          Gender: encryptData(Gender, encryptionKey),
          Phone_Number: encryptData(Phone_Number, encryptionKey),
          Series: encryptData(Series, encryptionKey),
          Number: encryptData(Number, encryptionKey),
          Subdivision_Code: encryptData(Subdivision_Code, encryptionKey),
          Issued_By: encryptData(Issued_By, encryptionKey),
          Date_of_Issue: encryptData(Date_of_Issue, encryptionKey),
          Actual_Residence_Address: encryptData(Actual_Residence_Address, encryptionKey),
          Registration_Address: encryptData(Registration_Address, encryptionKey),
          SNILS: encryptData(SNILS, encryptionKey),
          Abiturient_ID: encryptData(Abiturient_ID, encryptionKey),
          Document_ID: encryptData(Document_ID, encryptionKey)
      };

      const query = `
          INSERT INTO Personal_Data (
              Gender,
              Phone_Number,
              Series,
              Number,
              Subdivision_Code,
              Issued_By,
              Date_of_Issue,
              Actual_Residence_Address,
              Registration_Address,
              SNILS,
              Abiturient_ID,
              Document_ID
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const result = await pool.query(query, [
          encryptedData.Gender,
          encryptedData.Phone_Number,
          encryptedData.Series,
          encryptedData.Number,
          encryptedData.Subdivision_Code,
          encryptedData.Issued_By,
          encryptedData.Date_of_Issue,
          encryptedData.Actual_Residence_Address,
          encryptedData.Registration_Address,
          encryptedData.SNILS,
          encryptedData.Abiturient_ID,
          encryptedData.Document_ID
      ]);

      console.log('Данные успешно добавлены в таблицу Personal_Data');
      res.status(201).json({ message: 'Данные успешно добавлены в таблицу Personal_Data' });
  } catch (error) {
      console.error('Ошибка при добавлении данных в таблицу Personal_Data:', error);
      res.status(500).json({ error: 'Ошибка при добавлении данных в таблицу Personal_Data' });
  }
});

// Запрос для получения проходного балла для определенной программы
app.get('/getPassingGrade/:programId', (req, res) => {
  const programId = req.params.programId;

  const sql = `
    SELECT *
    FROM Passing_Grades
    WHERE Programs_ID = ?
  `;

  pool.query(sql, [programId], (error, results) => {
    if (error) {
      console.error('Ошибка выполнения запроса:', error);
      res.status(500).send('Произошла ошибка при выполнении запроса');
      return;
    }

    res.json(results);
  });
});
// Запрос для получения информации о местах для определенной программы
app.get('/places/:programId', (req, res) => {
  const programId = req.params.programId;

  const sql = `
  SELECT Available_Seats
  FROM Places
  WHERE Programs_ID = ?
  `;
   
  pool.query(sql, [programId], (error, results) => {
    if (error) {
      console.error('Ошибка выполнения запроса:', error);
      res.status(500).send('Произошла ошибка при выполнении запроса');
      return;
    }

    res.json(results);
  });
});

// Запрос для получения количества записей в таблице Applications для определенной программы
app.get('/getApplicationCount/:programId', (req, res) => {
  const programId = req.params.programId;

  const sql = `
    SELECT *
    FROM Application_Count
    WHERE Programs_ID = ?
  `;

  pool.query(sql, [programId], (error, results) => {
    if (error) {
      console.error('Ошибка выполнения запроса:', error);
      res.status(500).send('Произошла ошибка при выполнении запроса');
      return;
    }

    res.json(results);
  });
});

app.delete('/deleteEmployee/:id', (req, res) => {
  const userId = req.params.userId;

  const sql = 'DELETE FROM Administrator WHERE ID_Administrator = ?';

  pool.query(sql, [userId], (error, results) => {
    if (error) {
      console.error('Ошибка при удалении администратора:', error);
      res.status(500).send('Произошла ошибка при удалении администратора');
      return;
    }

    console.log('Администратор успешно удален, количество затронутых строк:', results.affectedRows);
    res.status(200).json({ message: 'Администратор успешно удален' });
  });
});

app.get('/getCheckApplication/:userId', (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT COUNT(*) as count
    FROM Applications
    WHERE Abiturient_ID = ?
  `;

  pool.query(sql, [userId], (error, results) => {
    if (error) {
      console.error('Ошибка выполнения запроса:', error);
      res.status(500).send('Произошла ошибка при выполнении запроса');
      return;
    }

    res.json(results);
  });
});

app.get('/checkApplication/:userId/:specialtyId', (req, res) => {
  const userId = req.params.userId;
  const specialtyId = req.params.specialtyId;

  const sql = `
    SELECT COUNT(*) as count
    FROM Applications
    WHERE Abiturient_ID = ? AND Programs_ID = ?
  `;

  pool.query(sql, [userId, specialtyId], (error, results) => {
    if (error) {
      console.error('Ошибка выполнения запроса:', error);
      res.status(500).send('Произошла ошибка при выполнении запроса');
      return;
    }

    res.json(results);
  });
});

app.delete('/deleteAbiturient/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const sql = 'DELETE FROM Abiturient WHERE ID_Abiturient = ?';

    pool.query(sql, [userId], (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }
      if (results.affectedRows === 0) {
        console.error('Не найдено ни одной записи для удаления');
        res.status(404).send('Не найдено ни одной записи для удаления');
        return;
      }
      res.status(200).json({ success: true, message: 'Абитуриент успешно удален.' });
    });
  } catch (error) {
    console.error('Ошибка при удалении абитуриента:', error);
    res.status(500).send('Ошибка сервера');
  }
});

// Запрос для получения форм обучения
app.get('/getEducationForms', async (req, res) => {
  try {
    const sql = `
      SELECT
        ID_Education_Form,
        Form_Name
      FROM
        Education_Form
    `;

    pool.query(sql, (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }
      res.status(200).json(results); // Отправляем данные в формате JSON
    });
  } catch (error) {
    console.error('Ошибка при получении форм обучения:', error);
    res.status(500).send('Ошибка сервера');
  }
});

// Запрос для получения классов
app.get('/getClasses', async (req, res) => {
  try {
    const sql = `
      SELECT
        ID_Class,
        Class_Name
      FROM
        Class
    `;

    pool.query(sql, (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }
      res.status(200).json(results); // Отправляем данные в формате JSON
    });
  } catch (error) {
    console.error('Ошибка при получении классов:', error);
    res.status(500).send('Ошибка сервера');
  }
});app.post('/checkApplicationDuplicate/:id', async (req, res) => {
  try {
      const userId = req.params.id; // Получаем userId из параметра маршрута

      // Запрос к базе данных для проверки наличия записи в таблице Applications
      const checkQuery = `
          SELECT Abiturient_ID
          FROM Applications
          WHERE Abiturient_ID = ?
      `;

      // Выполнение запроса к базе данных
      pool.query(checkQuery, [userId], (error, results) => {
          if (error) {
              console.error('Ошибка при выполнении запроса:', error);
              res.status(500).json({ error: 'Произошла ошибка на сервере' });
              return;
          }
          
          // Проверка наличия результатов запроса
          if (results.length === 0) {
              console.log('Запись с указанным Abiturient_ID не найдена в таблице Applications');
              res.status(404).json({ message: 'Запись с указанным Abiturient_ID не найдена', hasData: false });
          } else {
              console.log('Запись с указанным Abiturient_ID найдена в таблице Applications');
              res.status(200).json({ message: 'Запись с указанным Abiturient_ID найдена', hasData: true });
          }
      });
  } catch (error) {
      console.error('Произошла ошибка:', error);
      res.status(500).json({ error: 'Произошла ошибка на сервере' });
  }
});

app.post('/submitApplication/:id', async (req, res) => {
  try {
      const userId = req.params.id;

      // Проверяем, существует ли запись в таблице Applications с указанным Abiturient_ID
      const checkDuplicateQuery = `
          SELECT Abiturient_ID
          FROM Applications
          WHERE Abiturient_ID = ?
      `;
      const duplicateResult = await pool.query(checkDuplicateQuery, [userId]);

      // Проверяем, если уже существует запись с указанным Abiturient_ID
      if (duplicateResult.length > 0) {
          return res.status(400).json({ error: 'Заявка с таким Abiturient_ID уже существует' });
      }

      // Если запись с таким Abiturient_ID не существует, продолжаем вставку данных

      // Парсим данные из тела запроса
      const { averageGrade, specialty } = req.body;

      // Вставляем данные в таблицу Applications
      const insertQuery = `
          INSERT INTO Applications (Average_Student_Grade, Abiturient_ID, Status_ID, Programs_ID)
          VALUES (?, ?, ?, ?)
      `;
      await pool.query(insertQuery, [
          averageGrade,
          userId,
          4, // Здесь присваиваем статус 4
          specialty
      ]);

      // Отправляем JSON-ответ о успешном добавлении данных
      res.status(201).json({ message: 'Данные успешно добавлены' });
  } catch (error) {
      console.error('Ошибка при добавлении данных:', error);
      res.status(500).json({ error: 'Произошла ошибка на сервере' });
  }
});
app.post('/checkLogin', async (req, res) => {
      const login = req.body.login; // Предполагаю, что логин приходит в теле запроса

      // Проверяем уникальность логина
      const sql = `
          SELECT COUNT(*) AS count
          FROM (
              SELECT Login FROM Administrator
              UNION
              SELECT Login FROM Abiturient
          ) AS logins
          WHERE Login = ?
      `;
      pool.query(sql, [login], (error, results) => {
        if (error) {
          console.error('Ошибка выполнения запроса:', error);
          res.status(500).send('Произошла ошибка при выполнении запроса');
          return;
        }
    
        res.json(results);
      });
      
    });


app.delete('/deleteApplication/:id', async (req, res) => {
  try {
      const applicationId = req.params.id;

      // Удаляем запись из таблицы Applications по указанному Application_ID
      const deleteQuery = `
          DELETE FROM Applications
          WHERE Application_ID = ?
      `;
      await pool.query(deleteQuery, [applicationId]);

      res.status(200).json({ message: 'Заявка успешно удалена' });
  } catch (error) {
      console.error('Ошибка при удалении заявки:', error);
      res.status(500).json({ error: 'Произошла ошибка на сервере при удалении заявки' });
  }
});
app.post('/checkPersonalData', (req, res) => {
  try {
      const userId = req.body.userId; // Предполагается, что userId передается в теле запроса

      // Запрос к базе данных для проверки наличия записи в таблице Personal_Data
      const checkQuery = `
          SELECT Abiturient_ID
          FROM Personal_Data
          WHERE Abiturient_ID = ?
      `;

      // Выполнение запроса к базе данных
      pool.query(checkQuery, [userId], (error, results) => {
          if (error) {
              console.error('Ошибка при выполнении запроса:', error);
              res.status(500).json({ error: 'Произошла ошибка на сервере' });
              return;
          }
          
          // Проверка наличия результатов запроса
          if (results.length === 0) {
              console.log('Запись с указанным Abiturient_ID не найдена в таблице Personal_Data');
              res.status(404).json({ message: 'Запись с указанным Abiturient_ID не найдена', hasData: false });
          } else {
              console.log('Запись с указанным Abiturient_ID найдена в таблице Personal_Data');
              res.status(200).json({ message: 'Запись с указанным Abiturient_ID найдена', hasData: true });
          }
      });
  } catch (error) {
      console.error('Произошла ошибка:', error);
      res.status(500).json({ error: 'Произошла ошибка на сервере' });
  }
});


app.get('/getApplications/:userId', (req, res) => {
  const userId = req.params.userId;

  // SQL запрос
  const sqlQuery = `
      SELECT 
          Applications.Application_ID, 
          Applications.Submission_Date, 
          Applications.Average_Student_Grade, 
          Applications.Abiturient_ID, 
          Applications.Status_ID, 
          Applications.Programs_ID,
          Status.Status_name,
          Specialization.Specialty_Name,
          Specialization.Specialty_Code,
          Class.Class_Name,
          Education_Form.Form_Name
      FROM 
          Applications
      JOIN 
          Programs ON Applications.Programs_ID = Programs.ID_Program
      JOIN 
          Status ON Applications.Status_ID = Status.ID_Status
      JOIN 
          Specialization ON Programs.Specialization_ID = Specialization.ID_Specialization
      JOIN 
          Class ON Programs.Class_ID = Class.ID_Class
      JOIN 
          Education_Form ON Programs.Education_Form_ID = Education_Form.ID_Education_Form
      WHERE 
          Applications.Abiturient_ID = ?;
  `;

  // Выполнение SQL запроса
  pool.query(sqlQuery, [userId], (error, results) => {
      if (error) {
          console.error('Ошибка при выполнении запроса:', error);
          res.status(500).json({ error: 'Произошла ошибка на сервере' });
      } else {
          res.json(results); // Отправка данных в формате JSON
      }
  });
});

app.get('/getAllApplications', (req, res) => {

  // SQL запрос
  const sqlQuery = `
      SELECT 
          Applications.Application_ID, 
          Applications.Submission_Date, 
          Applications.Average_Student_Grade, 
          Applications.Abiturient_ID, 
          Applications.Status_ID, 
          Applications.Programs_ID,
          Status.Status_name,
          Specialization.Specialty_Name,
          Specialization.Specialty_Code,
          Class.Class_Name,
          Education_Form.Form_Name
      FROM 
          Applications
      JOIN 
          Programs ON Applications.Programs_ID = Programs.ID_Program
      JOIN 
          Status ON Applications.Status_ID = Status.ID_Status
      JOIN 
          Specialization ON Programs.Specialization_ID = Specialization.ID_Specialization
      JOIN 
          Class ON Programs.Class_ID = Class.ID_Class
      JOIN 
          Education_Form ON Programs.Education_Form_ID = Education_Form.ID_Education_Form
    
  `;

  // Выполнение SQL запроса
  pool.query(sqlQuery,  (error, results) => {
      if (error) {
          console.error('Ошибка при выполнении запроса:', error);
          res.status(500).json({ error: 'Произошла ошибка на сервере' });
      } else {
          res.json(results); // Отправка данных в формате JSON
      }
  });
});app.put('/PersonalDataEdit/:id', upload.fields([{ name: 'Photo_certificate', maxCount: 1 }, { name: 'Photo_passport', maxCount: 1 }]), async (req, res) => {
  try {
      const id = req.params.id;
      const {
          Gender,
          Phone_Number,
          Series,
          Number,
          Subdivision_Code,
          Issued_By,
          Date_of_Issue,
          Actual_Residence_Address,
          Registration_Address,
          SNILS
      } = req.body;

      const encryptionKey = 'mySecretKey123';

      const encryptedData = {
          Series: encryptData(Series, encryptionKey),
          Number: encryptData(Number, encryptionKey),
          Subdivision_Code: encryptData(Subdivision_Code, encryptionKey),
          Issued_By: encryptData(Issued_By, encryptionKey),
          Actual_Residence_Address: encryptData(Actual_Residence_Address, encryptionKey),
          Registration_Address: encryptData(Registration_Address, encryptionKey),
          SNILS: encryptData(SNILS, encryptionKey)
      };

      const certificatePhotoPath = req.files['Photo_certificate'] ? req.files['Photo_certificate'][0].path : null;
      const passportPhotoPath = req.files['Photo_passport'] ? req.files['Photo_passport'][0].path : null;

      const sql = `
          UPDATE Personal_Data
          SET 
              Gender = ?,
              Phone_Number = ?,
              Series = ?,
              Number = ?,
              Subdivision_Code = ?,
              Issued_By = ?,
              Date_of_Issue = ?,
              Actual_Residence_Address = ?,
              Registration_Address = ?,
              SNILS = ?,
              Photo_certificate = ?,
              Photo_passport = ?
          WHERE Abiturient_ID = ?`;

      pool.query(sql, [
          Gender,
          Phone_Number,
          encryptedData.Series,
          encryptedData.Number,
          encryptedData.Subdivision_Code,
          encryptedData.Issued_By,
          Date_of_Issue,
          encryptedData.Actual_Residence_Address,
          encryptedData.Registration_Address,
          encryptedData.SNILS,
          certificatePhotoPath,
          passportPhotoPath,
          id
      ], (error, results) => {
          if (error) {
              console.error('Ошибка запроса: ' + error.message);
              res.status(500).send('Ошибка сервера');
              return;
          }
          res.status(200).send('Данные успешно обновлены');
      });
  } catch (error) {
      console.error('Произошла ошибка:', error);
      res.status(500).json({ error: 'Произошла ошибка на сервере' });
  }
});

app.get('/PersonalDataAvailability/:id', async (req, res) => {
  try {
    const abiturientId = req.params.id;
    console.log('Получен запрос с ID:', abiturientId);

    const sql = `
      SELECT COUNT(*) AS count FROM Personal_Data
      WHERE Abiturient_ID = ?`;

    pool.query(sql, [abiturientId], (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }
      res.status(200).json(results); // Отправляем данные в формате JSON
    });
  } catch (error) {
    console.error('Ошибка при получении данных о заявках:', error);
    res.status(500).send('Ошибка сервера');
  }
});

app.post('/PersonalDataEdit1/:id'), async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Получен запрос с ID:', userId);

    const sqlCheckExistence = `
      SELECT COUNT(*) AS count FROM Personal_Data
      WHERE Abiturient_ID = ?`;

    pool.query(sqlCheckExistence, [userId], async (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }

      const count = results[0].count;

      if (count > 0) {
        // Если запись существует, выполняем обновление данных
        const sqlUpdate = `
          UPDATE Personal_Data
          SET Gender = ?, Phone_Number = ?, Series = ?, Number = ?,
              Subdivision_Code = ?, Issued_By = ?, Date_of_Issue = ?,
              Actual_Residence_Address = ?, Registration_Address = ?,
              SNILS = ?, Photo_certificate = ?, Photo_passport = ?
          WHERE Abiturient_ID = ?`;

        const paramsUpdate = [
          req.body.Gender, req.body.Phone_Number, req.body.Series,
          req.body.Number, req.body.Subdivision_Code, req.body.Issued_By,
          req.body.Date_of_Issue, req.body.Actual_Residence_Address,
          req.body.Registration_Address, req.body.SNILS,
          req.body.Photo_certificate, req.body.Photo_passport,
          userId
        ];

        pool.query(sqlUpdate, paramsUpdate, (error, results) => {
          if (error) {
            console.error('Ошибка запроса: ' + error.message);
            res.status(500).send('Ошибка сервера');
            return;
          }
          res.status(200).send('Данные успешно обновлены');
        });
      } else {
        // Если записи не существует, создаем новую запись
        const sqlInsert = `
          INSERT INTO Personal_Data 
          (Gender, Phone_Number, Series, Number, Subdivision_Code,
          Issued_By, Date_of_Issue, Actual_Residence_Address,
          Registration_Address, SNILS, Abiturient_ID,
          Photo_certificate, Photo_passport) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const paramsInsert = [
          req.body.Gender, req.body.Phone_Number, req.body.Series,
          req.body.Number, req.body.Subdivision_Code, req.body.Issued_By,
          req.body.Date_of_Issue, req.body.Actual_Residence_Address,
          req.body.Registration_Address, req.body.SNILS,
          userId, req.body.Photo_certificate,
          req.body.Photo_passport
        ];

        pool.query(sqlInsert, paramsInsert, (error, results) => {
          if (error) {
            console.error('Ошибка запроса: ' + error.message);
            res.status(500).send('Ошибка сервера');
            return;
          }
          res.status(200).send('Данные успешно добавлены');
        });
      }
    });
  } catch (error) {
    console.error('Ошибка при обработке запроса:', error);
    res.status(500).send('Ошибка сервера');
  }
}

// Запрос на обновление данных
app.post('/PersonalDataUpdate/:id', upload.fields([{ name: 'certificatePhoto', maxCount: 1 }, { name: 'passportPhoto', maxCount: 1 }]), async (req, res) => {
  try {
    const abiturientId = req.params.id;
    console.log('Received update request with parameters:', abiturientId);

    const sqlUpdate = `
      UPDATE Personal_Data
      SET Gender = ?, Phone_Number = ?, Series = ?, Number = ?,
          Subdivision_Code = ?, Issued_By = ?, Date_of_Issue = ?,
          Actual_Residence_Address = ?, Registration_Address = ?,
          SNILS = ?, Photo_certificate = ?, Photo_passport = ?
      WHERE Abiturient_ID = ?`;

    const paramsUpdate = [
      req.body.Gender, req.body.Phone_Number, req.body.Series,
      req.body.Number, req.body.Subdivision_Code, req.body.Issued_By,
      req.body.Date_of_Issue, req.body.Actual_Residence_Address,
      req.body.Registration_Address, req.body.SNILS,
      req.body.Photo_certificate, req.body.Photo_passport,
      abiturientId
    ];

    pool.query(sqlUpdate, paramsUpdate, (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }
      res.status(200).send('Данные успешно обновлены');
    });
  } catch (error) {
    console.error('Ошибка при обновлении данных:', error);
    res.status(500).send('Ошибка сервера');
  }
});

// Запрос на добавление новых данных
app.post('/PersonalDataInsert/:id', upload.fields([{ name: 'certificatePhoto', maxCount: 1 }, { name: 'passportPhoto', maxCount: 1 }]), async (req, res) => {
  try {
    const abiturientId = req.params.id;
    console.log('Received insert request with parameters:', abiturientId);

    const sqlInsert = `
      INSERT INTO Personal_Data 
      (Gender, Phone_Number, Series, Number, Subdivision_Code,
      Issued_By, Date_of_Issue, Actual_Residence_Address,
      Registration_Address, SNILS, Abiturient_ID,
      Photo_certificate, Photo_passport) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const paramsInsert = [
      req.body.Gender, req.body.Phone_Number, req.body.Series,
      req.body.Number, req.body.Subdivision_Code, req.body.Issued_By,
      req.body.Date_of_Issue, req.body.Actual_Residence_Address,
      req.body.Registration_Address, req.body.SNILS,
      abiturientId, req.body.Photo_certificate,
      req.body.Photo_passport
    ];

    pool.query(sqlInsert, paramsInsert, (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }
      res.status(200).send('Данные успешно добавлены');
    });
  } catch (error) {
    console.error('Ошибка при добавлении данных:', error);
    res.status(500).send('Ошибка сервера');
  }
});

app.get('/PersonalData/:id', async (req, res) => {
  try {
      const abiturientId = req.params.id;
      console.log('Получен запрос с ID:', abiturientId);

      const sql = `
          SELECT * FROM Personal_Data
          WHERE Abiturient_ID = ?`;

      pool.query(sql, [abiturientId], (error, results) => {
          if (error) {
              console.error('Ошибка запроса: ' + error.message);
              res.status(500).send('Ошибка сервера');
              return;
          }

          // Расшифровка данных перед отправкой на клиентскую сторону
          const decryptedResults = results.map(result => {
              return {
                  ...result,
                  Series: decryptData(result.Series, 'mySecretKey123'),
                  Number: decryptData(result.Number, 'mySecretKey123'),
                  Subdivision_Code: decryptData(result.Subdivision_Code, 'mySecretKey123'),
                  Issued_By: decryptData(result.Issued_By, 'mySecretKey123'),
                  Actual_Residence_Address: decryptData(result.Actual_Residence_Address, 'mySecretKey123'),
                  Registration_Address: decryptData(result.Registration_Address, 'mySecretKey123'),
                  SNILS: decryptData(result.SNILS, 'mySecretKey123')
              };
          });

          res.status(200).json(decryptedResults); // Отправляем расшифрованные данные в формате JSON
      });
  } catch (error) {
      console.error('Ошибка при получении данных о заявках:', error);
      res.status(500).send('Ошибка сервера');
  }
});

// Программы таблица
app.get('/Programs', async (req, res) => {
  try {
    const sql = `
      SELECT
        Programs.ID_Program,
        Education_Form.ID_Education_Form,
        Education_Form.Form_Name AS Education_Form_Name,
        Class.ID_Class,
        Class.Class_Name,
        Specialization.ID_Specialization,
        Specialization.Specialty_Code,
        Specialization.Specialty_Name,
        Specialization.Qualification_Name,
        Specialization.Description,
        Specialization.Training_Duration,
        Specialization.Direction_ID
      FROM
        Programs
      JOIN
        Education_Form ON Programs.Education_Form_ID = Education_Form.ID_Education_Form
      JOIN
        Class ON Programs.Class_ID = Class.ID_Class
      JOIN
        Specialization ON Programs.Specialization_ID = Specialization.ID_Specialization
    `;

    pool.query(sql, (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }
      res.status(200).json(results); // Отправляем данные в формате JSON
    });
  } catch (error) {
    console.error('Ошибка при получении программы:', error);
    res.status(500).send('Ошибка сервера');
  }
});

app.get('/AboutPrograms', async (req, res) => {
  try {
    const programId = req.query.id; //  значение параметра id из запроса
    const sql = `
      SELECT
        Programs.ID_Program,
        Programs.Photo_URL,
        Education_Form.ID_Education_Form,
        Education_Form.Form_Name,
        Class.ID_Class,
        Class.Class_Name,
        Specialization.ID_Specialization,
        Specialization.Specialty_Code,
        Specialization.Specialty_Name,
        Specialization.Qualification_Name,
        Specialization.Description,
        Specialization.Training_Duration,
        Specialization.Direction_ID
      FROM
        Programs
      JOIN
        Education_Form ON Programs.Education_Form_ID = Education_Form.ID_Education_Form
      JOIN
        Class ON Programs.Class_ID = Class.ID_Class
      JOIN
        Specialization ON Programs.Specialization_ID = Specialization.ID_Specialization
      WHERE
        Programs.ID_Program = ?; -- Фильтруем по ID_Program
    `;

    pool.query(sql, [programId], (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }

      if (results.length === 0) {
        // Если не найдено соответствий, возвращаем 404 Not Found
        res.status(404).send('Программа не найдена');
        return;
      }

      res.status(200).json(results[0]); // Отправляем данные в формате JSON (берем первый элемент, так как ожидаем только одну запись)
    });
  } catch (error) {
    console.error('Ошибка при получении программы:', error);
    res.status(500).send('Ошибка сервера');
  }
});

app.get('/totalUsers', async (req, res) => {
  try {
    const sql = 'SELECT COUNT(*) AS totalUsers FROM Administrator;    ';
    pool.query(sql, (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }
      res.status(200).json(results); // Отправляем данные в формате JSON
    });
  } catch (error) {
    console.error('Ошибка при получении  специальности:', error);
    res.status(500).send('Ошибка сервера');
  }
});
app.get('/totalAbiturient', (req, res) => {
    try {
      const sql = 'SELECT COUNT(*) AS totalAbiturients FROM Abiturient;      ';
      pool.query(sql, (error, results) => {
        if (error) {
          console.error('Ошибка запроса: ' + error.message);
          res.status(500).send('Ошибка сервера');
          return;
        }
        res.status(200).json(results); // Отправляем данные в формате JSON
      });
    } catch (error) {
      console.error('Ошибка при получении  специальности:', error);
      res.status(500).send('Ошибка сервера');
    }
});
app.put('/changeDocumentsApplications/:id', async (req, res) => {
  const applicationId = req.params.id;
  const { Discount, Original_Document } = req.body;

  try {
    // Изменяем данные в базе данных
    const result = await pool.query(
      'UPDATE Applications SET Discount = ?, Original_Document = ? WHERE Application_ID = ?',
      [Discount, Original_Document, applicationId]
    );

    if (result.affectedRows > 0) {
      res.status(200).send({ message: 'Данные успешно изменены' });
    } else {
      res.status(404).send({ message: 'Заявка не найдена' });
    }
  } catch (error) {
    console.error('Ошибка при изменении данных:', error);
    res.status(500).send({ message: 'Ошибка при изменении данных' });
  }
});

app.get('/AllApplications', async (req, res) => {
  try {
      const programId = req.query.programId;
      const classId = req.query.classId;
      const educationFormId = req.query.educationFormId;
      console.log('Received request with parameters:', programId, classId, educationFormId);

      const sql = `
        SELECT
          Applications.Application_ID,
          Applications.Submission_Date,
          Applications.Average_Student_Grade,
          Applications.Discount,
          Applications.Original_Document,
          Abiturient.ID_Abiturient,
          Abiturient.Surname,
          Abiturient.First_Name,
          Abiturient.Middle_Name,
          Abiturient.Date_of_Birth,
          Abiturient.Login,
          Status.Status_Name,
          Programs.ID_Program,
          Programs.Education_Form_ID,
          Education_Form.Form_Name, 
          Programs.Class_ID,
          Class.Class_Name,  
          Specialization.ID_Specialization,
          Specialization.Specialty_Code,
          Specialization.Specialty_Name
        FROM
          Applications
        JOIN
          Abiturient ON Applications.Abiturient_ID = Abiturient.ID_Abiturient
        JOIN
          Status ON Applications.Status_ID = Status.ID_Status
        JOIN
          Programs ON Applications.Programs_ID = Programs.ID_Program
        JOIN
          Specialization ON Programs.Specialization_ID = Specialization.ID_Specialization
        JOIN
          Class ON Programs.Class_ID = Class.ID_Class
        JOIN
          Education_Form ON Programs.Education_Form_ID = Education_Form.ID_Education_Form
        WHERE
          Programs.ID_Program = ? AND
          Class.ID_Class = ? AND
          Education_Form.ID_Education_Form = ?
        LIMIT 0, 1000;
      `;

      pool.query(sql, [programId, classId, educationFormId], (error, results) => {
          if (error) {
              console.error('Ошибка запроса: ' + error.message);
              res.status(500).send('Ошибка сервера');
              return;
          }
          res.status(200).json(results); // Отправляем данные в формате JSON
      });
  } catch (error) {
      console.error('Ошибка при получении данных о заявках:', error);
      res.status(500).send('Ошибка сервера');
  }
});

app.put('/ChangeStatus/:applicationId', (req, res) => {
  const applicationId = req.params.applicationId;
  const newStatusId = req.body.newStatusId;

  const sql = `
      UPDATE Applications
      SET Status_ID = ?
      WHERE Application_ID = ?;
  `;

  pool.query(sql, [newStatusId, applicationId], (error, results) => {
      if (error) {
          console.error('Ошибка при обновлении статуса:', error);
          res.status(500).json({ error: 'Внутренняя ошибка сервера' });
          return;
      }
      res.json({ success: true });
  });
});


app.get('/ListOfPrograms', async (req, res) => {
  try {
        const sql = `
        SELECT DISTINCT
        Programs.ID_Program,
        Programs.Education_Form_ID,
        Education_Form.Form_Name,
        Programs.Class_ID,
        Class.Class_Name,
        Specialization.ID_Specialization,
        Specialization.Specialty_Code,
        Specialization.Specialty_Name
    FROM
        Programs
    JOIN
        Specialization ON Programs.Specialization_ID = Specialization.ID_Specialization
    JOIN
        Class ON Programs.Class_ID = Class.ID_Class
    JOIN
        Education_Form ON Programs.Education_Form_ID = Education_Form.ID_Education_Form
    LIMIT 0, 1000;

    `;

    pool.query(sql, (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }

      res.status(200).json(results); // Отправляем данные в формате JSON
    });
  } catch (error) {
    console.error('Ошибка при получении данных о заявках:', error);
    res.status(500).send('Ошибка сервера');
  }
});

// для получения данных о заявках
app.get('/applications', async (req, res) => {
  try {
    const sql = `
      SELECT
        Application_ID,
        Submission_Date,
        Average_Student_Grade,
        Abiturient_ID,
        Status_ID,
        Programs_ID
      FROM
        Applications
    `;

    pool.query(sql, (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }

      res.status(200).json(results); // Отправляем данные в формате JSON
    });
  } catch (error) {
    console.error('Ошибка при получении данных о заявках:', error);
    res.status(500).send('Ошибка сервера');
  }
});

app.post('/import-administrator', upload.single('file'), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send('Файл не был загружен');
  }

  const workbook = XLSX.readFile(file.path);
  const sheetName = workbook.SheetNames[0]; 
  const worksheet = workbook.Sheets[sheetName];
  const excelData = XLSX.utils.sheet_to_json(worksheet);

  const promises = excelData.map(data => {
    return new Promise((resolve, reject) => {
      const { Surname, First_Name, Middle_Name, Date_of_Birth, Login, Password, Post_ID} = data;
      const sql = 'INSERT INTO Administrator (Surname, First_Name, Middle_Name, Date_of_Birth, Login, Password, Post_ID) VALUES (?, ?, ?, ?, ?, ?, ?)';
      pool.query(sql, [Surname, First_Name, Middle_Name, Date_of_Birth, Login, Password, Post_ID], (error, results) => {
        if (error) {
          console.error('Ошибка запроса: ' + error.message);
          reject(error);
          return;
        }
        console.log('Запись успешно добавлена');
        resolve(results);
      });
    });
  });

  Promise.all(promises)
    .then(() => {
      res.status(200).json({ message: 'Все записи успешно добавлены' });
    })
    .catch((error) => {
      res.status(500).json({ error: 'Произошла ошибка при добавлении записей' });
    });
});

app.get('/applications/statistics', async (req, res) => {
  try {
    const start = new Date(req.query.start);
    const end = new Date(req.query.end);
    
    const sql = `
      SELECT
        DATE(Submission_Date) as date,
        COUNT(*) as count
      FROM
        Applications
      WHERE
        Submission_Date >= ? AND Submission_Date <= ?
      GROUP BY
        date
    `;

    const results = await pool.query(sql, [start, end]);

    // Преобразуем данные в массив объектов перед отправкой
    const data = Array.isArray(results) ? results.map(entry => ({ date: entry.date, count: entry.count })) : [];

    res.json(data);
  } catch (error) {
    console.error('Ошибка при получении данных для статистики:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Пример маршрута для получения статистики заявок за месяц
app.get('/applications/statistics/month', async (req, res) => {
  try {
    const sql = `
      SELECT
        DATE_FORMAT(Submission_Date, '%Y-%m') as month,
        COUNT(*) as count
      FROM
        Applications
      GROUP BY
        month
      ORDER BY
        month;
    `;

    pool.query(sql, (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }

      const data = results.map(entry => entry.count);

      res.status(200).json(data); // Отправляем данные в формате JSON
    });
  } catch (error) {
    console.error('Ошибка при получении статистики заявок за месяц:', error);
    res.status(500).send('Ошибка сервера');
  }
});

// Пример маршрута для получения статистики заявок за неделю
app.get('/applications/statistics/week', async (req, res) => {
  try {
    const sql = `
      SELECT
        YEARWEEK(Submission_Date) as week,
        COUNT(*) as count
      FROM
        Applications
      GROUP BY
        week
      ORDER BY
        week;
    `;

    pool.query(sql, (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }

      const data = results.map(entry => entry.count);

      res.status(200).json(data); // Отправляем данные в формате JSON
    });
  } catch (error) {
    console.error('Ошибка при получении статистики заявок за неделю:', error);
    res.status(500).send('Ошибка сервера');
  }
});

// Пример маршрута для получения статистики заявок за год
app.get('/applications/statistics/year', async (req, res) => {
  try {
    const sql = `
      SELECT
        YEAR(Submission_Date) as year,
        COUNT(*) as count
      FROM
        Applications
      GROUP BY
        year
      ORDER BY
        year;
    `;

    pool.query(sql, (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }

      const data = results.map(entry => entry.count);

      res.status(200).json(data); // Отправляем данные в формате JSON
    });
  } catch (error) {
    console.error('Ошибка при получении статистики заявок за год:', error);
    res.status(500).send('Ошибка сервера');
  }
});
// маршрут для получения данных о абитуриентах
app.get('/abiturients', async (req, res) => {
  try {
    const sql = `
      SELECT
        ID_Abiturient,
        Surname,
        First_Name,
        Middle_Name,
        Date_of_Birth,
        Login,
        Post_ID,
        Parent_ID
      FROM
        Abiturient
    `;

    pool.query(sql, (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }

      res.status(200).json(results); // Отправляем данные в формате JSON
    });
  } catch (error) {
    console.error('Ошибка при получении данных о абитуриентах:', error);
    res.status(500).send('Ошибка сервера');
  }
});


app.get('/Administrators', async (req, res) => {
  try {
    const sql = 'SELECT Administrator.*, Post.Post_name AS Post_name FROM Administrator INNER JOIN Post ON Administrator.Post_ID = Post.ID_Post;';
    pool.query(sql, (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }
      res.status(200).json(results); // Отправляем данные в формате JSON
    });
  } catch (error) {
    console.error('Ошибка при получении  данных об администраторах:', error);
    res.status(500).send('Ошибка сервера');
  }
});

app.delete('/deleteAdmin/:id', async (req, res) => {
  try {
    const administratorId = req.params.id;
    const sql = 'DELETE FROM Administrator WHERE ID_Administrator = ?';
    
    pool.query(sql, [administratorId], (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }
      res.status(200).json({ success: true, message: 'Сотрудник успешно удален.' });
    });
  } catch (error) {
    console.error('Ошибка при удалении сотрудника:', error);
    res.status(500).send('Ошибка сервера');
  }
});

app.put('/ChangeRole/:administratorId', async (req, res) => {
  const { administratorId } = req.params;
  const { newRoleId } = req.body;

  try {
    const sql = 'UPDATE Administrator SET Post_ID = ? WHERE ID_Administrator = ?';
    pool.query(sql, [newRoleId, administratorId], (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
        return;
      }
      res.status(200).json({ success: true, message: 'Роль успешно изменена' });
    });
  } catch (error) {
    console.error('Ошибка при изменении роли администратора:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

app.post('/AddAdministrator', async (req, res) => {
  try {
    const {
      Surname,
      First_Name,
      Middle_Name,
      Date_of_Birth,
      Login,
      Password,
      Post_ID
    } = req.body;

    const sql = `
      INSERT INTO Administrator (Surname, First_Name, Middle_Name, Date_of_Birth, Login, Password, Post_ID)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `;

    pool.query(sql, [Surname, First_Name, Middle_Name, Date_of_Birth, Login, Password, Post_ID], (error, results) => {
      if (error) {
        console.error('Ошибка запроса: ' + error.message);
        res.status(500).send('Ошибка сервера');
        return;
      }
      res.status(200).json({ success: true, message: 'Администратор успешно добавлен' });
    });
  } catch (error) {
    console.error('Ошибка при добавлении администратора:', error);
    res.status(500).send('Ошибка сервера');
  }
});
app.listen(port, () => {
  console.log('Сервер запущен на порту 3001');
});
