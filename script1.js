const registros = JSON.parse(localStorage.getItem('registros')) || {}; // Carrega os registros do localStorage ou inicia vazio
const bossSelect = document.getElementById('boss');
const serverButtons = document.getElementById('serverButtons');
const serverButtons2 = document.getElementById('serverButtons_2');
const registrarButton = document.getElementById('registrarButton');
const resultadoDiv = document.getElementById('resultado');
const serverButtonsList = document.querySelectorAll('.server-btn');

// Alterna a cor dos botões na sequência e salva no localStorage
function changeButtonColor(button) {
    const nextColor = ['green', 'blue', 'purple', 'red', 'yellow', 'lightgray'];
    const currentIndex = nextColor.indexOf(button.style.backgroundColor) || 0;
    const nextIndex = (currentIndex + 1) % nextColor.length;
    button.style.backgroundColor = nextColor[nextIndex];

    // Salva o estado da cor dos botões no localStorage
    saveButtonColors();
}

// Salva o estado dos botões no localStorage
function saveButtonColors() {
    const buttonStates = {};
    serverButtonsList.forEach(button => {
        buttonStates[button.getAttribute('data-value')] = button.style.backgroundColor;
    });
    localStorage.setItem('buttonStates', JSON.stringify(buttonStates));
}

// Carrega as cores dos botões do localStorage
function loadButtonColors() {
    const buttonStates = JSON.parse(localStorage.getItem('buttonStates')) || {};
    serverButtonsList.forEach(button => {
        if (buttonStates[button.getAttribute('data-value')]) {
            button.style.backgroundColor = buttonStates[button.getAttribute('data-value')];
        }
    });
}

// Registra o horário automaticamente e salva no localStorage
function registerAutomaticTime() {
    const boss = bossSelect.value;

    // Verifica se há algum botão com a cor vermelha
    const redButton = Array.from(serverButtonsList).find(button => button.style.backgroundColor === 'red');

    if (redButton) {
        const server = redButton.getAttribute('data-value');
        const hora = new Date();
        const horaRegistrada = `${hora.getHours().toString().padStart(2, '0')}:${hora.getMinutes().toString().padStart(2, '0')}`;
        const horaComMaisQuatroHoras = new Date(hora.getTime() + 4 * 59 * 60 * 1000);
        const horaEsperada = `${horaComMaisQuatroHoras.getHours().toString().padStart(2, '0')}:${horaComMaisQuatroHoras.getMinutes().toString().padStart(2, '0')}`;
        const registroId = `${boss}-${server}-${Date.now()}`;

        // Adiciona o registro e salva no localStorage
        registros[boss] = registros[boss] || [];
        registros[boss].push({ id: registroId, horaRegistrada, horaEsperada, server });
        localStorage.setItem('registros', JSON.stringify(registros));

        // Muda a cor do botão vermelho para laranja
        redButton.style.backgroundColor = 'orange';
        saveButtonColors(); // Atualiza o localStorage das cores

        exibirRegistros();
    } else {
        alert("Nenhum servidor está marcado em vermelho.");
    }
}

// Exibe os registros salvos na tela
function exibirRegistros() {
    resultadoDiv.innerHTML = ''; // Limpa o conteúdo anterior

    Object.entries(registros).forEach(([boss, registrosDoBoss]) => {
        const bossDiv = document.createElement('div');
        bossDiv.innerHTML = `<h2>Registros do ${boss}</h2>`;

        registrosDoBoss.forEach(({ id, horaRegistrada, horaEsperada, server }) => {
            const registroDiv = document.createElement('p');
            registroDiv.innerHTML = `
                ${server} - Hora Registrada: ${horaRegistrada} | Próximo: ${horaEsperada}
                <button onclick="removeDiv(this, '${boss}', '${id}')">Excluir</button>
            `;
            bossDiv.appendChild(registroDiv);
        });

        resultadoDiv.appendChild(bossDiv);
    });
}

// Remove um registro e salva no localStorage
function removeDiv(button, boss, id) {
    const div = button.parentNode;
    div.remove();
    if (registros[boss]) {
        registros[boss] = registros[boss].filter(registro => registro.id !== id);
        localStorage.setItem('registros', JSON.stringify(registros)); // Atualiza o localStorage
    }
}

// Alterna entre os conjuntos de botões com base no boss selecionado
bossSelect.addEventListener('change', function() {
    const selectedBoss = this.value;
    serverButtons.classList.toggle('hidden', selectedBoss !== 'Bonnie');
    serverButtons2.classList.toggle('hidden', selectedBoss !== 'Clyde');
    document.getElementById('serverButtons_3').classList.toggle('hidden', selectedBoss !== 'Rat King'); // Adiciona o M1
});

// Define evento de clique para os botões de servidor
serverButtonsList.forEach(button => {
    button.addEventListener('click', function() {
        changeButtonColor(this);
    });
});

// Registra a hora automaticamente ao clicar no botão "Registrar"
registrarButton.addEventListener('click', function(event) {
    event.preventDefault();  // Impede o envio do formulário
    registerAutomaticTime();
});

// Carrega os registros e cores ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    exibirRegistros(); // Exibe os registros salvos no localStorage
    loadButtonColors(); // Restaura as cores dos botões salvas
});

// Função para limpar todos os registros do localStorage
function limparRegistros() {
    if (confirm("Tem certeza que deseja limpar todos os registros? Esta ação não pode ser desfeita!")) {
        localStorage.clear(); // Limpa todo o localStorage
        location.reload(); // Recarrega a página para aplicar as mudanças
    }
}

// Adiciona o evento ao botão de limpar
document.getElementById('limparButton').addEventListener('click', limparRegistros);
