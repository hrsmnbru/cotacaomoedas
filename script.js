const API_BASE_URL = 'https://api.frankfurter.app/latest'; 

const CURRENCIES = {
    "BRL": "Real Brasileiro",
    "USD": "Dólar Americano",
    "EUR": "Euro",
    "GBP": "Libra Esterlina",
    "JPY": "Iene Japonês",
    "CAD": "Dólar Canadense",
    "AUD": "Dólar Australiano",
    "CHF": "Franco Suíço"
};

const amountInput = document.getElementById('amount-input');
const fromCurrencySelect = document.getElementById('from-currency');
const toCurrencySelect = document.getElementById('to-currency');
const toResultInput = document.getElementById('output-resultado'); 
const messageArea = document.getElementById('message-area');
const converterLoading = document.getElementById('converter-loading');
const amountError = document.getElementById('amount-error');
const ratesTableBody = document.getElementById('rates-table-body');
const tableLoading = document.getElementById('table-loading');
const refreshButton = document.getElementById('botao-atualizar');
const swapButton = document.getElementById('botao-inverter');

const tableRateTh = document.getElementById('table-rate-th');

let conversionRates = {};

function displayMessage(msg, type = 'info') {
    messageArea.textContent = msg;
    messageArea.className = `alert alert-${type} text-center fw-medium transition-opacity`; 
    messageArea.classList.remove('d-none');
    setTimeout(() => {
        messageArea.classList.add('d-none');
    }, 5000);
}

function updateRatesHeader(baseCurrency) {
    if (tableRateTh) {
        tableRateTh.textContent = `Cotação (1 ${baseCurrency})`;
    }
}

function setConverterLoading(isLoading) {
    if (isLoading) {
        converterLoading.classList.remove('d-none');
        amountInput.disabled = true;
        fromCurrencySelect.disabled = true;
        toCurrencySelect.disabled = true;
    } else {
        converterLoading.classList.add('d-none');
        amountInput.disabled = false;
        fromCurrencySelect.disabled = false;
        toCurrencySelect.disabled = false;
    }
}

function calculateConversion() {
    const amount = parseFloat(amountInput.value);
    const to = toCurrencySelect.value;

    if (isNaN(amount) || amount <= 0) {
        amountError.classList.remove('d-none');
        toResultInput.value = '0,00';
        return;
    }
    amountError.classList.add('d-none');

    const rate = conversionRates[to];
    
    if (rate !== undefined) {
        const convertedValue = amount * rate;
        toResultInput.value = convertedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    } else {
        if (to === fromCurrencySelect.value) {
            toResultInput.value = amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
            return;
        }
         toResultInput.value = '---';
    }
}

async function fetchRatesAndPopulateTable(baseCurrency) {
    tableLoading.classList.remove('d-none');
    refreshButton.disabled = true;

    try {
        const url = `${API_BASE_URL}?from=${baseCurrency}`;

        const response = await fetch(url); 
        const data = await response.json();

        if (response.status !== 200 || !data.rates) {
            displayMessage(`Erro ao carregar cotações: ${data.error || 'Resposta inválida da API'}`, 'danger');
            ratesTableBody.innerHTML = '<tr><td colspan="3" class="text-center p-4 text-danger">Falha ao carregar cotações.</td></tr>';

            conversionRates.base = baseCurrency; 
            return;
        }
        
        conversionRates = {...data.rates, [baseCurrency]: 1}; 
        conversionRates.base = data.base; // Armazena a base real retornada pela API
        
        let tableHtml = '';
        const availableCurrencies = Object.keys(CURRENCIES).filter(code => code !== baseCurrency);
        
        availableCurrencies.forEach(code => {
            if (conversionRates[code] !== undefined) {
                const rate = conversionRates[code];
                const rateDisplay = rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
                
                tableHtml += `
                    <tr>
                        <td class="px-3 py-3 text-sm text-gray-800 fw-medium" data-label="Moeda">${code}</td>
                        <td class="px-3 py-3 text-sm text-gray-600" data-label="Nome">${CURRENCIES[code] || 'Moeda Estrangeira'}</td>
                        <td class="px-3 py-3 text-end text-sm text-gray-800 fw-semibold" data-label="Cotação (1 ${baseCurrency})">${rateDisplay}</td>
                    </tr>
                `;
            }
        });

        ratesTableBody.innerHTML = tableHtml;
        displayMessage(`Cotações atualizadas com base em 1 ${baseCurrency}.`, 'success');
        
    } catch (error) {
        console.error('Erro na requisição da API:', error);
        displayMessage('Erro de rede. Verifique sua conexão.', 'danger');
        ratesTableBody.innerHTML = '<tr><td colspan="3" class="text-center p-4 text-danger">Erro de rede.</td></tr>';
    } finally {
        tableLoading.classList.add('d-none');
        refreshButton.disabled = false;
    }
}

function updateConversion(fetchNewRates = false) {
    const fromCurrency = fromCurrencySelect.value;

    updateRatesHeader(fromCurrency);

    if (fetchNewRates || Object.keys(conversionRates).length === 0 || conversionRates.base !== fromCurrency) {
        fetchRatesAndPopulateTable(fromCurrency).then(() => {
            calculateConversion();
        });
    } else {
        calculateConversion();
    }
}

function populateSelects() {
    let optionsHtml = '';
    for (const code in CURRENCIES) {
        optionsHtml += `<option value="${code}">${code} - ${CURRENCIES[code]}</option>`;
    }
    fromCurrencySelect.innerHTML = optionsHtml;
    toCurrencySelect.innerHTML = optionsHtml;

    fromCurrencySelect.value = 'BRL';
    toCurrencySelect.value = 'USD';
}

function swapCurrencies() {
    const fromValue = fromCurrencySelect.value;
    const toValue = toCurrencySelect.value;
    
    fromCurrencySelect.value = toValue;
    toCurrencySelect.value = fromValue;
    
    updateConversion(true); 
    
    displayMessage(`Moedas trocadas: ${toValue} agora é a Origem.`, 'info');
}

// --- INICIALIZAÇÃO E EVENT LISTENERS ---

window.onload = function () {
    populateSelects();
    
    updateConversion(true); 
    
    amountInput.addEventListener('input', () => updateConversion(false));
    fromCurrencySelect.addEventListener('change', () => updateConversion(true));
    toCurrencySelect.addEventListener('change', () => calculateConversion());

    if (swapButton) {
        swapButton.addEventListener('click', swapCurrencies);
    }

    refreshButton.addEventListener('click', () => {
        updateConversion(true); 
    });
};