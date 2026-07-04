// calculator.js

(function() {
    // Falls der Rechner bereits initialisiert ist, abbrechen
    if (document.getElementById('floating-calculator')) return;

    // Lade Stylesheet, falls noch nicht geladen
    if (!document.querySelector('link[href*="calculator.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'calculator.css';
        document.head.appendChild(link);
    }

    // HTML des Rechners und des Triggers erzeugen
    const html = `
        <button id="calc-trigger-btn" title="Taschenrechner öffnen" class="hidden">🧮</button>
        
        <div id="floating-calculator" style="opacity:0;pointer-events:none;transform:translateY(20px) scale(0.95)">
            <div class="calc-header" id="calc-header">
                <div class="calc-title">🔢 Taschenrechner</div>
                <button class="calc-close" onclick="CalculatorApp.toggle()">×</button>
            </div>
            <div class="calc-screen">
                <div class="calc-formula" id="calc-formula"></div>
                <div class="calc-display" id="calc-display">0</div>
            </div>
            <div class="calc-body">
                <div class="calc-tabs">
                    <button class="calc-tab-btn active" id="tab-btn-standard" onclick="CalculatorApp.switchTab('standard')">Standard</button>
                    <button class="calc-tab-btn" id="tab-btn-units" onclick="CalculatorApp.switchTab('units')">Einheiten</button>
                </div>
                
                <div id="calc-panel-standard" class="calc-grid">
                    <button class="calc-btn action" onclick="CalculatorApp.clear()">C</button>
                    <button class="calc-btn op" onclick="CalculatorApp.input('(')">(</button>
                    <button class="calc-btn op" onclick="CalculatorApp.input(')')">)</button>
                    <button class="calc-btn op" onclick="CalculatorApp.input('/')">/</button>
                    
                    <button class="calc-btn" onclick="CalculatorApp.input('7')">7</button>
                    <button class="calc-btn" onclick="CalculatorApp.input('8')">8</button>
                    <button class="calc-btn" onclick="CalculatorApp.input('9')">9</button>
                    <button class="calc-btn op" onclick="CalculatorApp.input('*')">*</button>
                    
                    <button class="calc-btn" onclick="CalculatorApp.input('4')">4</button>
                    <button class="calc-btn" onclick="CalculatorApp.input('5')">5</button>
                    <button class="calc-btn" onclick="CalculatorApp.input('6')">6</button>
                    <button class="calc-btn op" onclick="CalculatorApp.input('-')">-</button>
                    
                    <button class="calc-btn" onclick="CalculatorApp.input('1')">1</button>
                    <button class="calc-btn" onclick="CalculatorApp.input('2')">2</button>
                    <button class="calc-btn" onclick="CalculatorApp.input('3')">3</button>
                    <button class="calc-btn op" onclick="CalculatorApp.input('+')">+</button>
                    
                    <button class="calc-btn" onclick="CalculatorApp.input('0')">0</button>
                    <button class="calc-btn" onclick="CalculatorApp.input('.')">,</button>
                    <button class="calc-btn equals" onclick="CalculatorApp.evaluate()">=</button>
                </div>
                
                <div id="calc-panel-units" class="calc-conv-grid" style="display: none;">
                    <button class="calc-conv-btn" onclick="CalculatorApp.convert('kmh2ms')">km/h ➔ m/s<br>(: 3,6)</button>
                    <button class="calc-conv-btn" onclick="CalculatorApp.convert('ms2kmh')">m/s ➔ km/h<br>(* 3,6)</button>
                    <button class="calc-conv-btn" onclick="CalculatorApp.convert('kN2N')">kN ➔ N<br>(* 1000)</button>
                    <button class="calc-conv-btn" onclick="CalculatorApp.convert('N2kN')">N ➔ kN<br>(: 1000)</button>
                    <button class="calc-conv-btn" onclick="CalculatorApp.convert('t2kg')">t ➔ kg<br>(* 1000)</button>
                    <button class="calc-conv-btn" onclick="CalculatorApp.convert('kg2t')">kg ➔ t<br>(: 1000)</button>
                    <button class="calc-conv-btn" onclick="CalculatorApp.convert('g2kg')">g ➔ kg<br>(: 1000)</button>
                    <button class="calc-conv-btn" onclick="CalculatorApp.convert('kg2g')">kg ➔ g<br>(* 1000)</button>
                </div>
            </div>
        </div>
    `;

    // In Body einfügen
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    // Globale App-Logik definieren
    window.CalculatorApp = {
        currentInput: '0',
        formula: '',
        lastAnswer: null,

        init() {
            const trigger = document.getElementById('calc-trigger-btn');
            trigger.addEventListener('click', () => this.toggle());

            // Dragging aktivieren
            this.setupDragging();
            
            // Tastatur-Events abfangen
            this.setupKeyboard();
        },

        showTrigger() {
            document.getElementById('calc-trigger-btn').classList.remove('hidden');
        },

        hideTrigger() {
            document.getElementById('calc-trigger-btn').classList.add('hidden');
            this.close();
        },

        toggle() {
            const calc = document.getElementById('floating-calculator');
            calc.classList.toggle('active');
        },

        close() {
            const calc = document.getElementById('floating-calculator');
            calc.classList.remove('active');
        },

        switchTab(tab) {
            const stdBtn = document.getElementById('tab-btn-standard');
            const unitBtn = document.getElementById('tab-btn-units');
            const stdPanel = document.getElementById('calc-panel-standard');
            const unitPanel = document.getElementById('calc-panel-units');

            if (tab === 'standard') {
                stdBtn.classList.add('active');
                unitBtn.classList.remove('active');
                stdPanel.style.display = 'grid';
                unitPanel.style.display = 'none';
            } else {
                stdBtn.classList.remove('active');
                unitBtn.classList.add('active');
                stdPanel.style.display = 'none';
                unitPanel.style.display = 'grid';
            }
        },

        input(char) {
            if (this.currentInput === '0' && char !== '.') {
                if (char === '(' || char === ')' || char === '+' || char === '-' || char === '*' || char === '/') {
                    this.currentInput = '0' + char;
                } else {
                    this.currentInput = char;
                }
            } else {
                this.currentInput += char;
            }
            this.updateScreen();
        },

        clear() {
            this.currentInput = '0';
            this.formula = '';
            this.updateScreen();
        },

        updateScreen() {
            document.getElementById('calc-display').textContent = this.currentInput.replace(/\./g, ',');
            document.getElementById('calc-formula').textContent = this.formula;
        },

        evaluate() {
            try {
                // Ersetze Kommas durch Punkte vor dem Eval
                let expr = this.currentInput;
                this.formula = this.currentInput.replace(/\./g, ',') + ' =';
                
                // Gefährliches eval absichern mit einfacher Sanitization
                expr = expr.replace(/[^0-9+\-*/().]/g, '');
                let result = Function(`"use strict"; return (${expr})`)();
                
                // Formatiere das Ergebnis
                if (result !== undefined && !isNaN(result)) {
                    // Runden auf max 6 Nachkommastellen
                    result = parseFloat(result.toFixed(6));
                    this.currentInput = result.toString();
                } else {
                    this.currentInput = 'Fehler';
                }
            } catch (e) {
                this.currentInput = 'Fehler';
            }
            this.updateScreen();
        },

        convert(type) {
            let val = parseFloat(this.currentInput.replace(/,/g, '.'));
            if (isNaN(val)) return;

            let result = 0;
            let unitFrom = '', unitTo = '';

            switch (type) {
                case 'kmh2ms':
                    result = val / 3.6;
                    unitFrom = 'km/h';
                    unitTo = 'm/s';
                    break;
                case 'ms2kmh':
                    result = val * 3.6;
                    unitFrom = 'm/s';
                    unitTo = 'km/h';
                    break;
                case 'kN2N':
                    result = val * 1000;
                    unitFrom = 'kN';
                    unitTo = 'N';
                    break;
                case 'N2kN':
                    result = val / 1000;
                    unitFrom = 'N';
                    unitTo = 'kN';
                    break;
                case 't2kg':
                    result = val * 1000;
                    unitFrom = 't';
                    unitTo = 'kg';
                    break;
                case 'kg2t':
                    result = val / 1000;
                    unitFrom = 'kg';
                    unitTo = 't';
                    break;
                case 'g2kg':
                    result = val / 1000;
                    unitFrom = 'g';
                    unitTo = 'kg';
                    break;
                case 'kg2g':
                    result = val * 1000;
                    unitFrom = 'kg';
                    unitTo = 'g';
                    break;
            }

            this.formula = `${val} ${unitFrom} ➔`;
            this.currentInput = parseFloat(result.toFixed(6)).toString();
            this.updateScreen();
            this.switchTab('standard');
        },

        setupKeyboard() {
            window.addEventListener('keydown', (e) => {
                const calc = document.getElementById('floating-calculator');
                if (!calc.classList.contains('active')) return;

                if (e.key >= '0' && e.key <= '9') {
                    this.input(e.key);
                } else if (e.key === '.' || e.key === ',') {
                    this.input('.');
                } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
                    this.input(e.key);
                } else if (e.key === '(' || e.key === ')') {
                    this.input(e.key);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    this.evaluate();
                } else if (e.key === 'Backspace') {
                    if (this.currentInput.length > 1) {
                        this.currentInput = this.currentInput.slice(0, -1);
                    } else {
                        this.currentInput = '0';
                    }
                    this.updateScreen();
                } else if (e.key === 'Escape') {
                    this.close();
                }
            });
        },

        setupDragging() {
            const header = document.getElementById('calc-header');
            const calc = document.getElementById('floating-calculator');
            let isDragging = false;
            let startX, startY, initialX, initialY;

            header.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                
                // Position ermitteln
                const rect = calc.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;
                
                calc.style.right = 'auto';
                calc.style.bottom = 'auto';
                calc.style.left = initialX + 'px';
                calc.style.top = initialY + 'px';
                
                e.preventDefault();
            });

            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                calc.style.left = (initialX + dx) + 'px';
                calc.style.top = (initialY + dy) + 'px';
            });

            window.addEventListener('mouseup', () => {
                isDragging = false;
            });

            // Touch-Unterstützung
            header.addEventListener('touchstart', (e) => {
                isDragging = true;
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                const rect = calc.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;
                calc.style.right = 'auto';
                calc.style.bottom = 'auto';
                calc.style.left = initialX + 'px';
                calc.style.top = initialY + 'px';
            });

            window.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                const touch = e.touches[0];
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;
                calc.style.left = (initialX + dx) + 'px';
                calc.style.top = (initialY + dy) + 'px';
            });

            window.addEventListener('touchend', () => {
                isDragging = false;
            });
        }
    };

    window.CalculatorApp.init();
})();
