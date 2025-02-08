const express = require('express');
const { analyzeContract } = require('./controllers');

const router = express.Router();

// Rota de teste para verificar se a API está online
router.get('/status', (req, res) => {
    res.json({ message: "API online 🚀" });
});

// Rota principal de análise de contrato
router.post('/analyze', analyzeContract);

module.exports = router;
