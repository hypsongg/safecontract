require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const routes = require('./routes'); 

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use('/api', routes); // Certifique-se que esta linha está correta

const PORT = process.env.PORT || 5001; // Altere de 5000 para 5001

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
