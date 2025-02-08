const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
console.log("Chave da OpenAI:", process.env.OPENAI_API_KEY);
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const analyzeContract = async (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const file = req.files.file;
    const ext = path.extname(file.name).toLowerCase();
    let extractedText = '';

    try {
        if (ext === '.pdf') {
            extractedText = await pdfParse(file.data).then(data => data.text);
        } else if (ext === '.docx') {
            extractedText = await mammoth.extractRawText({ buffer: file.data }).then(result => result.value);
        } else {
            return res.status(400).json({ error: 'Formato de arquivo não suportado' });
        }

        // Enviar para a API do ChatGPT
        const analysis = await sendToGPT(extractedText);
        res.json({ analysis });
    } catch (error) {
        console.error("Erro ao processar o contrato:", error);
        res.status(500).json({ error: "Erro ao processar o contrato." });
    }
};

const sendToGPT = async (contractText) => {
    const prompt = `
    Você é um especialista jurídico e recebeu um contrato para análise. Extraia as seguintes informações do texto:
    - Data do Primeiro Pagamento
    - Vigência do Contrato
    - Multas e Penalidades
    - Valores e Prazos
    - Cláusulas de Renovação Automática
    - Obrigações Principais
    - Jurisdição e Foro
    - Confidencialidade e Concorrência

    Aqui está o contrato:
    ${contractText}

    Responda apenas no formato JSON válido.
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Você é um advogado especialista em contratos." },
                { role: "user", content: prompt }
            ],
            temperature: 0.5
        });

        let content = response.choices[0].message.content;

        // Remover possíveis marcações erradas ```json ... ```
        content = content.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(content);
    } catch (error) {
        console.error("Erro ao converter resposta do ChatGPT para JSON:", error);
        return { error: "Erro ao processar a resposta da IA" };
    }
};

const processContract = (text) => {
    const keyPoints = {
        "Data do Primeiro Pagamento": /(\d{2}\/\d{2}\/\d{4})/,
        "Vigência do Contrato": /(\d+ meses|\d+ anos)/i,
        "Multas e Penalidades": /(?:multa|penalidade).+?(\d+%|\d+ reais)/i,
        "Valores e Prazos": /(?:valor|preço).+?(\d+\.\d{2})/,
        "Cláusulas de Renovação Automática": /renovação automática/i,
        "Obrigações Principais": /obrigações.+?(\w+)/i,
        "Jurisdição de Foro": /foro de (\w+)/i,
        "Confidencialidade e Concorrência": /confidencialidade|concorrência/i
    };

    let results = {};
    for (const key in keyPoints) {
        const match = text.match(keyPoints[key]);
        results[key] = match ? match[0] : "Não encontrado";
    }

    return results;
};

module.exports = { analyzeContract, processContract };
