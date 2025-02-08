document.addEventListener("DOMContentLoaded", function () {
    const uploadForm = document.getElementById("uploadForm");
    const fileInput = document.getElementById("file");
    const extraInfoInput = document.getElementById("extraInfo");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const analysisResult = document.getElementById("analysisResult");
    const analyzeButton = document.getElementById("analyzeButton");

    // Garante que os elementos existem antes de prosseguir
    if (!uploadForm || !fileInput || !analysisResult || !analyzeButton) {
        console.error("Erro: Elementos essenciais do formulário não foram encontrados.");
        return;
    }

    uploadForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!fileInput.files.length) {
            alert("Por favor, selecione um arquivo antes de enviar.");
            return;
        }

        // Captura extraInfo com segurança
        const extraInfo = extraInfoInput ? extraInfoInput.value.trim() : "";

        // Desativa o botão e exibe o carregamento
        analyzeButton.disabled = true;
        analyzeButton.innerText = "Processando...";
        if (loadingIndicator) loadingIndicator.style.display = "block";

        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        formData.append("extraInfo", extraInfo);

        try {
            const response = await fetch("http://localhost:5001/api/analyze", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Erro do servidor: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Formata a resposta e exibe no frontend
            analysisResult.innerHTML = formatAnalysis(data.analysis);
        } catch (error) {
            console.error("Erro ao processar a análise:", error);
            analysisResult.innerHTML = `<p style="color: red;">Erro ao processar a análise: ${error.message}</p>`;
        }

        // Reativa o botão e esconde a barra de carregamento
        analyzeButton.disabled = false;
        analyzeButton.innerText = "Analisar Contrato";
        if (loadingIndicator) loadingIndicator.style.display = "none";
    });

    // Função para formatar a resposta corretamente
    function formatAnalysis(analysis) {
        if (typeof analysis !== "object" || analysis === null) {
            return `<p style="color: red;">Erro ao formatar os dados da análise.</p>`;
        }

        let formattedText = `<h3>Resultado da Análise</h3>`;

        Object.entries(analysis).forEach(([key, value]) => {
            formattedText += `<p><strong>${key}:</strong><br>R: ${formatValue(value)}</p>`;
        });

        return formattedText;
    }

    // Função auxiliar para formatar corretamente valores
    function formatValue(value) {
        if (typeof value === "object" && value !== null) {
            return Object.entries(value)
                .map(([subKey, subValue]) => `<br>- <strong>${subKey}:</strong> ${subValue}`)
                .join("");
        }
        return Array.isArray(value) ? value.join(", ") : value;
    }
});
