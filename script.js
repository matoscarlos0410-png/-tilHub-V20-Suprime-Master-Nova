/* =========================================================
   ÚTILHUB V20 — NOVA FLOW ULTIMATE
   SCRIPT.JS
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const STORAGE_KEY = "utilhub-v20";
const OLD_KEYS = [
  "utilhub-v19",
  "utilhub-v18",
  "utilhub-v17",
  "utilhub-v15-advanced"
];

const $ = (selector, parent = document) =>
  parent.querySelector(selector);

const $$ = (selector, parent = document) =>
  [...parent.querySelectorAll(selector)];

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

const random = (min, max) =>
  Math.random() * (max - min) + min;

const randomInt = (min, max) =>
  Math.floor(random(min, max + 1));


/* =========================================================
   ESTADO
   ========================================================= */

const defaultState = {
  version: 20,

  theme: "dark",

  motion: true,

  performance: "balanced",

  focus: false,

  novaMode: "cosmic",

  novaIntensity: 0.8,

  novaSpeed: 1,

  novaParticles: 100,

  novaAuto: false,

  favorites: [],

  recent: [],

  notes: "",

  tasks: [],

  shopping: [],

  dictionaryRecent: [],

  stopwatch: {
    running: false,
    elapsed: 0,
    startedAt: 0
  },

  timer: {
    running: false,
    endAt: 0,
    remaining: 0
  }
};


let state = loadState();

let activeCategory = "all";

let currentTool = null;

let toastTimer = null;


/* =========================================================
   STORAGE
   ========================================================= */

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}


function mergeState(base, saved) {

  const result = {
    ...base,
    ...saved
  };

  result.favorites = Array.isArray(saved?.favorites)
    ? saved.favorites
    : [];

  result.recent = Array.isArray(saved?.recent)
    ? saved.recent
    : [];

  result.tasks = Array.isArray(saved?.tasks)
    ? saved.tasks
    : [];

  result.shopping = Array.isArray(saved?.shopping)
    ? saved.shopping
    : [];

  result.dictionaryRecent =
    Array.isArray(saved?.dictionaryRecent)
      ? saved.dictionaryRecent
      : [];

  result.stopwatch = {
    ...base.stopwatch,
    ...(saved?.stopwatch || {})
  };

  result.timer = {
    ...base.timer,
    ...(saved?.timer || {})
  };

  return result;
}


function loadState() {

  try {

    const current = localStorage.getItem(STORAGE_KEY);

    if (current) {
      return mergeState(
        cloneDefaultState(),
        JSON.parse(current)
      );
    }

    for (const key of OLD_KEYS) {

      const old = localStorage.getItem(key);

      if (!old) continue;

      try {

        const parsed = JSON.parse(old);

        const migrated = mergeState(
          cloneDefaultState(),
          parsed
        );

        migrated.version = 20;

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(migrated)
        );

        return migrated;

      } catch {
        continue;
      }
    }

  } catch (error) {
    console.warn("No se pudo cargar el almacenamiento.", error);
  }

  return cloneDefaultState();
}


function saveState() {

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );
  } catch (error) {
    console.warn("No se pudo guardar el estado.", error);
  }

  updateStats();
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

  const toast = $("#toast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}


/* =========================================================
   TOOL CATALOG
   ========================================================= */

const tools = [

  {
    id: "calculator",
    icon: "🧮",
    name: "Calculadora",
    description: "Operaciones y cálculos avanzados.",
    category: "math"
  },

  {
    id: "percentage",
    icon: "％",
    name: "Porcentajes",
    description: "Calcula porcentajes, aumentos y reducciones.",
    category: "math"
  },

  {
    id: "discount",
    icon: "💰",
    name: "Descuentos",
    description: "Calcula precio final y ahorro.",
    category: "math"
  },

  {
    id: "rule3",
    icon: "📐",
    name: "Regla de tres",
    description: "Resuelve proporciones rápidamente.",
    category: "math"
  },

  {
    id: "fractions",
    icon: "½",
    name: "Fracciones",
    description: "Suma, resta, multiplica y divide fracciones.",
    category: "math"
  },

  {
    id: "average",
    icon: "📊",
    name: "Promedio",
    description: "Calcula promedios de una lista de números.",
    category: "math"
  },

  {
    id: "area",
    icon: "📏",
    name: "Áreas y perímetros",
    description: "Calcula figuras geométricas.",
    category: "math"
  },

  {
    id: "binary",
    icon: "🔢",
    name: "Decimal ↔ Binario",
    description: "Convierte números entre sistemas.",
    category: "math"
  },

  {
    id: "length",
    icon: "📏",
    name: "Longitud",
    description: "Convierte unidades de longitud.",
    category: "convert"
  },

  {
    id: "weight",
    icon: "⚖️",
    name: "Peso",
    description: "Convierte unidades de masa.",
    category: "convert"
  },

  {
    id: "volume",
    icon: "🧪",
    name: "Volumen",
    description: "Convierte unidades de volumen.",
    category: "convert"
  },

  {
    id: "temperature",
    icon: "🌡️",
    name: "Temperatura",
    description: "Convierte Celsius, Fahrenheit y Kelvin.",
    category: "convert"
  },

  {
    id: "timeconvert",
    icon: "⏱️",
    name: "Conversor de tiempo",
    description: "Convierte segundos, minutos y horas.",
    category: "convert"
  },

  {
    id: "currency",
    icon: "💱",
    name: "Monedas",
    description: "Convierte valores monetarios.",
    category: "convert"
  },

  {
    id: "datediff",
    icon: "📅",
    name: "Diferencia de fechas",
    description: "Calcula el tiempo entre dos fechas.",
    category: "time"
  },

  {
    id: "age",
    icon: "🎂",
    name: "Calculadora de edad",
    description: "Calcula una edad a partir de una fecha.",
    category: "time"
  },

  {
    id: "timer",
    icon: "⏳",
    name: "Temporizador",
    description: "Cuenta regresiva personalizable.",
    category: "time"
  },

  {
    id: "stopwatch",
    icon: "⏱️",
    name: "Cronómetro",
    description: "Mide tiempo y registra vueltas.",
    category: "time"
  },

  {
    id: "clock",
    icon: "🕐",
    name: "Reloj",
    description: "Muestra la hora actual.",
    category: "time"
  },

  {
    id: "worldclock",
    icon: "🌍",
    name: "Reloj mundial",
    description: "Consulta diferentes zonas horarias.",
    category: "time"
  },

  {
    id: "countdown",
    icon: "⌛",
    name: "Cuenta regresiva",
    description: "Cuenta hasta una fecha determinada.",
    category: "time"
  },

  {
    id: "text",
    icon: "📝",
    name: "Analizador de texto",
    description: "Cuenta palabras, caracteres y líneas.",
    category: "text"
  },

  {
    id: "case",
    icon: "🔤",
    name: "Mayúsculas y minúsculas",
    description: "Transforma rápidamente un texto.",
    category: "text"
  },

  {
    id: "notes",
    icon: "📒",
    name: "Notas",
    description: "Guarda notas directamente en tu navegador.",
    category: "organize"
  },

  {
    id: "tasks",
    icon: "✅",
    name: "Tareas",
    description: "Organiza tus pendientes.",
    category: "organize"
  },

  {
    id: "shopping-list",
    icon: "🛒",
    name: "Lista de compras",
    description: "Crea y organiza productos.",
    category: "life"
  },

  {
    id: "shopping",
    icon: "🛍️",
    name: "Buscar productos",
    description: "Busca productos en sitios externos.",
    category: "life"
  },

  {
    id: "food",
    icon: "🍔",
    name: "Buscar comida",
    description: "Busca restaurantes y comida.",
    category: "life"
  },

  {
    id: "password",
    icon: "🔐",
    name: "Generador de contraseñas",
    description: "Genera contraseñas aleatorias.",
    category: "life"
  },

  {
    id: "random",
    icon: "🎲",
    name: "Generador aleatorio",
    description: "Genera números y opciones al azar.",
    category: "fun"
  },

  {
    id: "qr",
    icon: "🔳",
    name: "Código QR",
    description: "Genera un código QR.",
    category: "fun"
  },

  {
    id: "dictionary",
    icon: "📖",
    name: "Diccionario",
    description: "Consulta definiciones.",
    category: "study"
  },

  {
    id: "study",
    icon: "📚",
    name: "Organizador de estudio",
    description: "Organiza tus sesiones de estudio.",
    category: "study"
  },

  {
    id: "goals",
    icon: "🎯",
    name: "Objetivos",
    description: "Crea objetivos personales.",
    category: "organize"
  },

  {
    id: "focus",
    icon: "🧠",
    name: "Modo concentración",
    description: "Reduce distracciones.",
    category: "study"
  }

];


/* =========================================================
   TOOL RENDER
   ========================================================= */

function renderTools() {

  const grid = $("#toolGrid");

  if (!grid) return;

  const query =
    ($("#toolSearch")?.value || "")
      .trim()
      .toLowerCase();

  const filtered = tools.filter(tool => {

    const matchesCategory =
      activeCategory === "all" ||
      tool.category === activeCategory;

    const text =
      `${tool.name} ${tool.description} ${tool.category}`
        .toLowerCase();

    const matchesSearch =
      !query ||
      text.includes(query);

    return matchesCategory && matchesSearch;
  });


  if (!filtered.length) {

    grid.innerHTML = `
      <div class="emptyState">
        <strong>No encontramos esa herramienta</strong>
        <span>Prueba otra búsqueda o categoría.</span>
      </div>
    `;

    return;
  }


  grid.innerHTML = filtered.map(tool => {

    const favorite =
      state.favorites.includes(tool.id);

    return `
      <article class="toolCard">

        <div>

          <div class="toolTop">

            <div class="toolIcon">
              ${tool.icon}
            </div>

            <button
              class="favoriteBtn ${favorite ? "active" : ""}"
              data-favorite="${tool.id}"
              type="button"
              aria-label="Favorito"
            >
              ${favorite ? "★" : "☆"}
            </button>

          </div>

          <h3>
            ${escapeHtml(tool.name)}
          </h3>

          <p>
            ${escapeHtml(tool.description)}
          </p>

        </div>

        <div class="toolBottom">

          <span class="toolCategory">
            ${escapeHtml(categoryName(tool.category))}
          </span>

          <button
            class="openToolBtn"
            data-open="${tool.id}"
            type="button"
          >
            Abrir →
          </button>

        </div>

      </article>
    `;
  }).join("");
}


/* =========================================================
   QUICK TOOLS
   ========================================================= */

function renderQuickTools() {

  const container = $("#quickTools");

  if (!container) return;

  const recentTools =
    state.recent
      .map(id => tools.find(tool => tool.id === id))
      .filter(Boolean)
      .slice(0, 5);


  if (!recentTools.length) {

    container.innerHTML = `
      <div class="emptyState">
        <strong>Aún no hay herramientas recientes</strong>
        <span>Abre una herramienta para verla aquí.</span>
      </div>
    `;

    return;
  }


  container.innerHTML =
    recentTools.map(tool => `
      <button
        class="quickItem"
        data-open="${tool.id}"
        type="button"
      >

        <span class="toolIcon">
          ${tool.icon}
        </span>

        <span>
          <strong>
            ${escapeHtml(tool.name)}
          </strong>

          <span>
            Acceso rápido
          </span>
        </span>

      </button>
    `).join("");
}


/* =========================================================
   STATS
   ========================================================= */

function updateStats() {

  if ($("#toolCount")) {
    $("#toolCount").textContent =
      tools.length;
  }

  if ($("#favoriteCount")) {
    $("#favoriteCount").textContent =
      state.favorites.length;
  }

  if ($("#recentCount")) {
    $("#recentCount").textContent =
      state.recent.length;
  }
}


/* =========================================================
   CATEGORÍAS
   ========================================================= */

function categoryName(category) {

  const names = {
    math: "Matemática",
    convert: "Conversiones",
    time: "Tiempo",
    text: "Texto",
    organize: "Organización",
    life: "Vida diaria",
    fun: "Entretenimiento",
    study: "Estudio"
  };

  return names[category] || "General";
}


/* =========================================================
   FAVORITOS
   ========================================================= */

function toggleFavorite(id) {

  if (state.favorites.includes(id)) {

    state.favorites =
      state.favorites.filter(
        item => item !== id
      );

    showToast("Eliminado de favoritos.");

  } else {

    state.favorites.push(id);

    showToast("Añadido a favoritos.");
  }

  saveState();

  renderTools();
}


/* =========================================================
   RECENTES
   ========================================================= */

function addRecent(id) {

  state.recent =
    [
      id,
      ...state.recent.filter(
        item => item !== id
      )
    ].slice(0, 12);

  saveState();

  renderQuickTools();
}


/* =========================================================
   OPEN TOOL
   ========================================================= */

function openTool(id) {

  const tool =
    tools.find(item => item.id === id);

  if (!tool) return;

  currentTool = id;

  addRecent(id);

  $("#toolPanelIcon").textContent =
    tool.icon;

  $("#toolPanelCategory").textContent =
    categoryName(tool.category);

  $("#toolPanelTitle").textContent =
    tool.name;

  const content =
    $("#toolContent");

  if (!content) return;

  try {

    content.innerHTML =
      getToolHTML(id);

    bindTool(id);

  } catch (error) {

    console.error(error);

    content.innerHTML = `
      <div class="emptyState">
        <strong>No se pudo abrir esta herramienta.</strong>
        <span>Intenta nuevamente.</span>
      </div>
    `;

  }

  $("#toolPanel").classList.add("open");

  $("#toolPanel").setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow = "hidden";
}


function closeTool() {

  $("#toolPanel")?.classList.remove("open");

  $("#toolPanel")?.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.style.overflow = "";

  currentTool = null;
}


/* =========================================================
   TOOL HTML
   ========================================================= */

function getToolHTML(id) {

  switch (id) {

    case "calculator":
      return calculatorHTML();

    case "percentage":
      return percentageHTML();

    case "discount":
      return discountHTML();

    case "rule3":
      return rule3HTML();

    case "fractions":
      return fractionsHTML();

    case "average":
      return averageHTML();

    case "area":
      return areaHTML();

    case "binary":
      return binaryHTML();

    case "length":
      return converterHTML(
        "length",
        "Longitud",
        {
          metro: 1,
          kilometro: 1000,
          centimetro: 0.01,
          milimetro: 0.001,
          pulgada: 0.0254,
          pie: 0.3048
        }
      );

    case "weight":
      return converterHTML(
        "weight",
        "Peso",
        {
          kilogramo: 1,
          gramo: 0.001,
          tonelada: 1000,
          libra: 0.45359237,
          onza: 0.0283495
        }
      );

    case "volume":
      return converterHTML(
        "volume",
        "Volumen",
        {
          litro: 1,
          mililitro: 0.001,
          metroCubico: 1000,
          galon: 3.78541
        }
      );

    case "temperature":
      return temperatureHTML();

    case "timeconvert":
      return timeConvertHTML();

    case "currency":
      return currencyHTML();

    case "datediff":
      return dateDiffHTML();

    case "age":
      return ageHTML();

    case "timer":
      return timerHTML();

    case "stopwatch":
      return stopwatchHTML();

    case "clock":
      return clockHTML();

    case "worldclock":
      return worldClockHTML();

    case "countdown":
      return countdownHTML();

    case "text":
      return textHTML();

    case "case":
      return caseHTML();

    case "notes":
      return notesHTML();

    case "tasks":
      return tasksHTML();

    case "shopping-list":
      return shoppingListHTML();

    case "shopping":
      return shoppingHTML();

    case "food":
      return foodHTML();

    case "password":
      return passwordHTML();

    case "random":
      return randomHTML();

    case "qr":
      return qrHTML();

    case "dictionary":
      return dictionaryHTML();

    case "study":
      return studyHTML();

    case "goals":
      return goalsHTML();

    case "focus":
      return focusHTML();

    default:
      return `
        <div class="emptyState">
          <strong>Herramienta no disponible</strong>
        </div>
      `;
  }
}


/* =========================================================
   CALCULADORA
   ========================================================= */

function calculatorHTML() {

  return `
    <div class="toolForm">

      <div class="field">
        <label>Expresión</label>

        <input
          id="calcInput"
          class="toolInput"
          placeholder="Ejemplo: (25 + 10) * 2"
          autocomplete="off"
        >
      </div>

      <div class="toolButtons">

        <button
          id="calcButton"
          class="toolButton primary"
          type="button"
        >
          Calcular
        </button>

        <button
          id="calcClear"
          class="toolButton"
          type="button"
        >
          Limpiar
        </button>

      </div>

      <div
        id="calcResult"
        class="resultBox"
      >
        Introduce una operación.
      </div>

      <div class="toolHint">
        Operadores: + − × ÷ % ^ y paréntesis.
      </div>

    </div>
  `;
}


function bindCalculator() {

  $("#calcButton")?.addEventListener(
    "click",
    () => {

      const input =
        $("#calcInput").value.trim();

      const result =
        safeCalculate(input);

      $("#calcResult").innerHTML =
        result.error
          ? `<span>${escapeHtml(result.error)}</span>`
          : `<strong>${formatNumber(result.value)}</strong>`;
    }
  );

  $("#calcClear")?.addEventListener(
    "click",
    () => {
      $("#calcInput").value = "";
      $("#calcResult").textContent =
        "Introduce una operación.";
    }
  );

  $("#calcInput")?.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {
        $("#calcButton").click();
      }
    }
  );
}


/* =========================================================
   SAFE CALCULATOR
   ========================================================= */

function safeCalculate(expression) {

  if (!expression) {
    return {
      error: "Escribe una operación."
    };
  }

  let exp =
    expression
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/,/g, ".")
      .replace(/\^/g, "**");

  if (!/^[0-9+\-*/().%\s*]+$/.test(exp)) {

    return {
      error: "La operación contiene caracteres no permitidos."
    };
  }

  if (exp.includes("**")) {

    const pieces =
      exp.split("**");

    if (
      pieces.length > 2 ||
      pieces.some(
        piece => piece.trim() === ""
      )
    ) {

      return {
        error: "Potencia no válida."
      };
    }
  }

  try {

    const tokens =
      tokenizeMath(
        expression
      );

    const value =
      parseMathExpression(tokens);

    if (!Number.isFinite(value)) {
      return {
        error: "Resultado no válido."
      };
    }

    return {
      value
    };

  } catch {

    return {
      error: "No se pudo calcular la operación."
    };
  }
}


/* =========================================================
   MATH PARSER
   ========================================================= */

function tokenizeMath(expression) {

  const normalized =
    expression
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/,/g, ".");

  const tokens = [];

  let i = 0;

  while (i < normalized.length) {

    const char =
      normalized[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (
      /[0-9.]/.test(char)
    ) {

      let number = "";

      while (
        i < normalized.length &&
        /[0-9.]/.test(normalized[i])
      ) {

        number += normalized[i];

        i++;
      }

      if (
        (number.match(/\./g) || []).length > 1
      ) {
        throw new Error("Número inválido");
      }

      tokens.push({
        type: "number",
        value: Number(number)
      });

      continue;
    }

    if ("+-*/%^()".includes(char)) {

      tokens.push({
        type: char,
        value: char
      });

      i++;

      continue;
    }

    throw new Error("Carácter inválido");
  }

  return tokens;
}


function parseMathExpression(tokens) {

  let position = 0;


  function peek() {
    return tokens[position];
  }


  function consume(type) {

    const token =
      tokens[position];

    if (!token || token.type !== type) {
      throw new Error("Se esperaba " + type);
    }

    position++;

    return token;
  }


  function expression() {

    let value =
      term();

    while (
      peek()?.type === "+" ||
      peek()?.type === "-"
    ) {

      const operator =
        consume(peek().type).type;

      const right =
        term();

      value =
        operator === "+"
          ? value + right
          : value - right;
    }

    return value;
  }


  function term() {

    let value =
      power();

    while (
      peek()?.type === "*" ||
      peek()?.type === "/" ||
      peek()?.type === "%"
    ) {

      const operator =
        consume(peek().type).type;

      const right =
        power();

      if (
        (operator === "/" ||
          operator === "%") &&
        right === 0
      ) {
        throw new Error("División entre cero");
      }

      if (operator === "*") {
        value *= right;
      }

      if (operator === "/") {
        value /= right;
      }

      if (operator === "%") {
        value %= right;
      }
    }

    return value;
  }


  function power() {

    let value =
      unary();

    if (peek()?.type === "^") {

      consume("^");

      const right =
        power();

      value =
        Math.pow(value, right);
    }

    return value;
  }


  function unary() {

    if (peek()?.type === "+") {

      consume("+");

      return unary();
    }

    if (peek()?.type === "-") {

      consume("-");

      return -unary();
    }

    return primary();
  }


  function primary() {

    const token =
      peek();

    if (!token) {
      throw new Error("Falta valor");
    }

    if (token.type === "number") {

      position++;

      return token.value;
    }

    if (token.type === "(") {

      consume("(");

      const value =
        expression();

      consume(")");

      return value;
    }

    throw new Error("Expresión inválida");
  }


  const result =
    expression();

  if (position !== tokens.length) {
    throw new Error("Expresión incompleta");
  }

  return result;
}


/* =========================================================
   PORCENTAJES
   ========================================================= */

function percentageHTML() {

  return `
    <div class="toolForm">

      <div class="formRow">

        <div class="field">
          <label>Porcentaje</label>
          <input
            id="percentValue"
            class="toolInput"
            type="number"
            placeholder="20"
          >
        </div>

        <div class="field">
          <label>De</label>
          <input
            id="percentBase"
            class="toolInput"
            type="number"
            placeholder="500"
          >
        </div>

      </div>

      <button
        id="percentCalc"
        class="toolButton primary"
      >
        Calcular
      </button>

      <div id="percentResult" class="resultBox">
        Resultado.
      </div>

    </div>
  `;
}


function bindPercentage() {

  $("#percentCalc")?.addEventListener(
    "click",
    () => {

      const p =
        Number($("#percentValue").value);

      const base =
        Number($("#percentBase").value);

      if (!Number.isFinite(p) ||
          !Number.isFinite(base)) {

        $("#percentResult").textContent =
          "Completa ambos valores.";

        return;
      }

      $("#percentResult").innerHTML =
        `<strong>${formatNumber(base * p / 100)}</strong>`;
    }
  );
}


/* =========================================================
   DESCUENTO
   ========================================================= */

function discountHTML() {

  return `
    <div class="toolForm">

      <div class="formRow">

        <div class="field">
          <label>Precio</label>
          <input
            id="discountPrice"
            class="toolInput"
            type="number"
            min="0"
            placeholder="100"
          >
        </div>

        <div class="field">
          <label>Descuento %</label>
          <input
            id="discountPercent"
            class="toolInput"
            type="number"
            min="0"
            max="100"
            placeholder="20"
          >
        </div>

      </div>

      <button
        id="discountCalc"
        class="toolButton primary"
      >
        Calcular
      </button>

      <div id="discountResult" class="resultBox">
        Resultado.
      </div>

    </div>
  `;
}


function bindDiscount() {

  $("#discountCalc")?.addEventListener(
    "click",
    () => {

      const price =
        Number($("#discountPrice").value);

      const percent =
        Number($("#discountPercent").value);

      if (
        !Number.isFinite(price) ||
        !Number.isFinite(percent) ||
        price < 0 ||
        percent < 0 ||
        percent > 100
      ) {

        $("#discountResult").textContent =
          "Introduce valores válidos.";

        return;
      }

      const saving =
        price * percent / 100;

      const finalPrice =
        price - saving;

      $("#discountResult").innerHTML = `
        <div>
          Ahorro:
          <strong>${formatNumber(saving)}</strong>
        </div>

        <div style="margin-top:8px">
          Precio final:
          <strong>${formatNumber(finalPrice)}</strong>
        </div>
      `;
    }
  );
}


/* =========================================================
   REGLA DE TRES
   ========================================================= */

function rule3HTML() {

  return `
    <div class="toolForm">

      <div class="formRow">

        <div class="field">
          <label>A</label>
          <input id="ruleA" class="toolInput" type="number">
        </div>

        <div class="field">
          <label>B</label>
          <input id="ruleB" class="toolInput" type="number">
        </div>

      </div>

      <div class="field">
        <label>C</label>
        <input id="ruleC" class="toolInput" type="number">
      </div>

      <button
        id="ruleCalc"
        class="toolButton primary"
      >
        Resolver
      </button>

      <div id="ruleResult" class="resultBox">
        A : B = C : X
      </div>

    </div>
  `;
}


function bindRule3() {

  $("#ruleCalc")?.addEventListener(
    "click",
    () => {

      const A = Number($("#ruleA").value);
      const B = Number($("#ruleB").value);
      const C = Number($("#ruleC").value);

      if (
        !Number.isFinite(A) ||
        !Number.isFinite(B) ||
        !Number.isFinite(C) ||
        A === 0
      ) {

        $("#ruleResult").textContent =
          "Introduce valores válidos.";

        return;
      }

      const X =
        B * C / A;

      $("#ruleResult").innerHTML =
        `X = <strong>${formatNumber(X)}</strong>`;
    }
  );
}


/* =========================================================
   FRACCIONES
   ========================================================= */

function fractionsHTML() {

  return `
    <div class="toolForm">

      <div class="formRow">

        <div class="field">
          <label>Numerador 1</label>
          <input id="fA" class="toolInput" type="number">
        </div>

        <div class="field">
          <label>Denominador 1</label>
          <input id="fB" class="toolInput" type="number">
        </div>

      </div>

      <div class="formRow">

        <div class="field">
          <label>Numerador 2</label>
          <input id="fC" class="toolInput" type="number">
        </div>

        <div class="field">
          <label>Denominador 2</label>
          <input id="fD" class="toolInput" type="number">
        </div>

      </div>

      <div class="field">
        <label>Operación</label>

        <select id="fOp" class="toolSelect">
          <option value="+">Suma</option>
          <option value="-">Resta</option>
          <option value="*">Multiplicación</option>
          <option value="/">División</option>
        </select>
      </div>

      <button
        id="fractionCalc"
        class="toolButton primary"
      >
        Calcular
      </button>

      <div id="fractionResult" class="resultBox">
        Resultado.
      </div>

    </div>
  `;
}


function gcd(a, b) {

  a = Math.abs(a);
  b = Math.abs(b);

  while (b !== 0) {

    const temp = b;

    b = a % b;

    a = temp;
  }

  return a || 1;
}


function bindFractions() {

  $("#fractionCalc")?.addEventListener(
    "click",
    () => {

      const a = Number($("#fA").value);
      const b = Number($("#fB").value);
      const c = Number($("#fC").value);
      const d = Number($("#fD").value);

      const op = $("#fOp").value;

      if (
        !Number.isInteger(a) ||
        !Number.isInteger(b) ||
        !Number.isInteger(c) ||
        !Number.isInteger(d) ||
        b === 0 ||
        d === 0
      ) {

        $("#fractionResult").textContent =
          "Introduce fracciones válidas.";

        return;
      }

      let n;
      let den;

      if (op === "+") {
        n = a * d + c * b;
        den = b * d;
      }

      if (op === "-") {
        n = a * d - c * b;
        den = b * d;
      }

      if (op === "*") {
        n = a * c;
        den = b * d;
      }

      if (op === "/") {

        if (c === 0) {

          $("#fractionResult").textContent =
            "No se puede dividir entre cero.";

          return;
        }

        n = a * d;
        den = b * c;
      }

      if (den < 0) {

        n *= -1;
        den *= -1;
      }

      const divisor =
        gcd(n, den);

      n /= divisor;
      den /= divisor;

      $("#fractionResult").innerHTML = `
        <strong>${n}/${den}</strong>
        <div style="margin-top:8px">
          Decimal: ${formatNumber(n / den)}
        </div>
      `;
    }
  );
}


/* =========================================================
   PROMEDIO
   ========================================================= */

function averageHTML() {

  return `
    <div class="toolForm">

      <div class="field">

        <label>
          Números separados por comas
        </label>

        <input
          id="averageInput"
          class="toolInput"
          placeholder="12, 15, 18, 20"
        >

      </div>

      <button
        id="averageCalc"
        class="toolButton primary"
      >
        Calcular promedio
      </button>

      <div id="averageResult" class="resultBox">
        Resultado.
      </div>

    </div>
  `;
}


function bindAverage() {

  $("#averageCalc")?.addEventListener(
    "click",
    () => {

      const values =
        $("#averageInput").value
          .split(",")
          .map(Number)
          .filter(Number.isFinite);

      if (!values.length) {

        $("#averageResult").textContent =
          "Introduce números válidos.";

        return;
      }

      const sum =
        values.reduce(
          (a, b) => a + b,
          0
        );

      const average =
        sum / values.length;

      $("#averageResult").innerHTML = `
        Promedio:
        <strong>${formatNumber(average)}</strong>
        <div style="margin-top:8px">
          Cantidad: ${values.length}
        </div>
      `;
    }
  );
}


/* =========================================================
   ÁREAS
   ========================================================= */

function areaHTML() {

  return `
    <div class="toolForm">

      <div class="field">

        <label>Figura</label>

        <select id="areaShape" class="toolSelect">

          <option value="square">
            Cuadrado
          </option>

          <option value="rectangle">
            Rectángulo
          </option>

          <option value="triangle">
            Triángulo
          </option>

          <option value="circle">
            Círculo
          </option>

        </select>

      </div>

      <div
        id="areaFields"
        class="formRow"
      ></div>

      <button
        id="areaCalc"
        class="toolButton primary"
      >
        Calcular
      </button>

      <div
        id="areaResult"
        class="resultBox"
      >
        Resultado.
      </div>

    </div>
  `;
}


function updateAreaFields() {

  const shape =
    $("#areaShape")?.value;

  const container =
    $("#areaFields");

  if (!container) return;

  const configs = {

    square: [
      ["areaA", "Lado"]
    ],

    rectangle: [
      ["areaA", "Largo"],
      ["areaB", "Ancho"]
    ],

    triangle: [
      ["areaA", "Base"],
      ["areaB", "Altura"]
    ],

    circle: [
      ["areaA", "Radio"]
    ]

  };

  container.innerHTML =
    configs[shape]
      .map(([id, label]) => `
        <div class="field">
          <label>${label}</label>
          <input
            id="${id}"
            class="toolInput"
            type="number"
            min="0"
          >
        </div>
      `)
      .join("");
}


function bindArea() {

  $("#areaShape")?.addEventListener(
    "change",
    updateAreaFields
  );

  updateAreaFields();

  $("#areaCalc")?.addEventListener(
    "click",
    () => {

      const shape =
        $("#areaShape").value;

      const a =
        Number($("#areaA")?.value);

      const b =
        Number($("#areaB")?.value);

      if (
        !Number.isFinite(a) ||
        a <= 0 ||
        (
          shape !== "circle" &&
          shape !== "square" &&
          (!Number.isFinite(b) || b <= 0)
        )
      ) {

        $("#areaResult").textContent =
          "Completa los valores.";

        return;
      }

      let area = 0;
      let perimeter = 0;

      if (shape === "square") {

        area = a * a;
        perimeter = a * 4;
      }

      if (shape === "rectangle") {

        area = a * b;
        perimeter = 2 * (a + b);
      }

      if (shape === "triangle") {

        area = a * b / 2;

        perimeter =
          "No calculado";
      }

      if (shape === "circle") {

        area = Math.PI * a * a;

        perimeter =
          2 * Math.PI * a;
      }

      $("#areaResult").innerHTML = `
        Área:
        <strong>${formatNumber(area)}</strong>

        <div style="margin-top:8px">
          Perímetro:
          ${typeof perimeter === "number"
            ? formatNumber(perimeter)
            : perimeter}
        </div>
      `;
    }
  );
}


/* =========================================================
   BINARIO
   ========================================================= */

function binaryHTML() {

  return `
    <div class="toolForm">

      <div class="field">

        <label>Modo</label>

        <select id="binaryMode" class="toolSelect">
          <option value="decimal">
            Decimal → Binario
          </option>

          <option value="binary">
            Binario → Decimal
          </option>
        </select>

      </div>

      <div class="field">

        <label>Número</label>

        <input
          id="binaryInput"
          class="toolInput"
          inputmode="numeric"
        >

      </div>

      <button
        id="binaryCalc"
        class="toolButton primary"
      >
        Convertir
      </button>

      <div
        id="binaryResult"
        class="resultBox"
      >
        Resultado.
      </div>

    </div>
  `;
}


function bindBinary() {

  $("#binaryCalc")?.addEventListener(
    "click",
    () => {

      const mode =
        $("#binaryMode").value;

      const value =
        $("#binaryInput").value.trim();

      if (mode === "decimal") {

        const number =
          Number(value);

        if (
          !Number.isInteger(number) ||
          number < 0
        ) {

          $("#binaryResult").textContent =
            "Introduce un entero positivo.";

          return;
        }

        $("#binaryResult").innerHTML =
          `<strong>${number.toString(2)}</strong>`;
      }

      else {

        if (!/^[01]+$/.test(value)) {

          $("#binaryResult").textContent =
            "Un número binario solo puede contener 0 y 1.";

          return;
        }

        $("#binaryResult").innerHTML =
          `<strong>${parseInt(value, 2)}</strong>`;
      }
    }
  );
}


/* =========================================================
   CONVERSORES
   ========================================================= */

function converterHTML(type, title, units) {

  const options =
    Object.keys(units)
      .map(unit =>
        `<option value="${unit}">
          ${unit}
        </option>`
      )
      .join("");

  return `
    <div class="toolForm">

      <div class="field">
        <label>Valor</label>
        <input
          id="convertValue"
          class="toolInput"
          type="number"
        >
      </div>

      <div class="formRow">

        <div class="field">
          <label>Desde</label>

          <select id="convertFrom" class="toolSelect">
            ${options}
          </select>
        </div>

        <div class="field">
          <label>Hacia</label>

          <select id="convertTo" class="toolSelect">
            ${options}
          </select>
        </div>

      </div>

      <button
        id="convertButton"
        class="toolButton primary"
      >
        Convertir
      </button>

      <div
        id="convertResult"
        class="resultBox"
      >
        Resultado.
      </div>

    </div>
  `;
}


function bindConverter(type) {

  const units =
    type === "length"
      ? {
          metro: 1,
          kilometro: 1000,
          centimetro: 0.01,
          milimetro: 0.001,
          pulgada: 0.0254,
          pie: 0.3048
        }

      : type === "weight"
        ? {
            kilogramo: 1,
            gramo: 0.001,
            tonelada: 1000,
            libra: 0.45359237,
            onza: 0.0283495
          }

        : {
            litro: 1,
            mililitro: 0.001,
            metroCubico: 1000,
            galon: 3.78541
          };

  $("#convertButton")?.addEventListener(
    "click",
    () => {

      const value =
        Number($("#convertValue").value);

      const from =
        $("#convertFrom").value;

      const to =
        $("#convertTo").value;

      if (!Number.isFinite(value)) {

        $("#convertResult").textContent =
          "Introduce un valor.";

        return;
      }

      const base =
        value * units[from];

      const result =
        base / units[to];

      $("#convertResult").innerHTML =
        `<strong>${formatNumber(result)}</strong> ${to}`;
    }
  );
}


/* =========================================================
   TEMPERATURA
   ========================================================= */

function temperatureHTML() {

  return `
    <div class="toolForm">

      <div class="field">
        <label>Valor</label>
        <input
          id="tempValue"
          class="toolInput"
          type="number"
        >
      </div>

      <div class="formRow">

        <div class="field">
          <label>Desde</label>

          <select id="tempFrom" class="toolSelect">
            <option value="C">Celsius</option>
            <option value="F">Fahrenheit</option>
            <option value="K">Kelvin</option>
          </select>
        </div>

        <div class="field">
          <label>Hacia</label>

          <select id="tempTo" class="toolSelect">
            <option value="C">Celsius</option>
            <option value="F">Fahrenheit</option>
            <option value="K">Kelvin</option>
          </select>
        </div>

      </div>

      <button
        id="tempCalc"
        class="toolButton primary"
      >
        Convertir
      </button>

      <div
        id="tempResult"
        class="resultBox"
      >
        Resultado.
      </div>

    </div>
  `;
}


function bindTemperature() {

  $("#tempCalc")?.addEventListener(
    "click",
    () => {

      const value =
        Number($("#tempValue").value);

      const from =
        $("#tempFrom").value;

      const to =
        $("#tempTo").value;

      if (!Number.isFinite(value)) {

        $("#tempResult").textContent =
          "Introduce una temperatura.";

        return;
      }

      let celsius;

      if (from === "C") {
        celsius = value;
      }

      if (from === "F") {
        celsius = (value - 32) * 5 / 9;
      }

      if (from === "K") {
        celsius = value - 273.15;
      }

      let result;

      if (to === "C") {
        result = celsius;
      }

      if (to === "F") {
        result = celsius * 9 / 5 + 32;
      }

      if (to === "K") {
        result = celsius + 273.15;
      }

      $("#tempResult").innerHTML =
        `<strong>${formatNumber(result)}</strong> °${to}`;
    }
  );
}


/* =========================================================
   TIEMPO
   ========================================================= */

function timeConvertHTML() {

  return `
    <div class="toolForm">

      <div class="field">
        <label>Segundos</label>

        <input
          id="timeSeconds"
          class="toolInput"
          type="number"
          min="0"
        >
      </div>

      <button
        id="timeConvertButton"
        class="toolButton primary"
      >
        Convertir
      </button>

      <div
        id="timeConvertResult"
        class="resultBox"
      >
        Resultado.
      </div>

    </div>
  `;
}


function bindTimeConvert() {

  $("#timeConvertButton")?.addEventListener(
    "click",
    () => {

      const seconds =
        Number($("#timeSeconds").value);

      if (!Number.isFinite(seconds) || seconds < 0) {

        $("#timeConvertResult").textContent =
          "Introduce segundos válidos.";

        return;
      }

      const hours =
        Math.floor(seconds / 3600);

      const minutes =
        Math.floor((seconds % 3600) / 60);

      const secs =
        Math.floor(seconds % 60);

      $("#timeConvertResult").innerHTML = `
        <strong>
          ${String(hours).padStart(2, "0")}:
          ${String(minutes).padStart(2, "0")}:
          ${String(secs).padStart(2, "0")}
        </strong>
      `;
    }
  );
}


/* =========================================================
   MONEDA
   ========================================================= */

function currencyHTML() {

  return `
    <div class="toolForm">

      <div class="field">
        <label>Cantidad</label>
        <input
          id="currencyAmount"
          class="toolInput"
          type="number"
          min="0"
          placeholder="100"
        >
      </div>

      <div class="formRow">

        <div class="field">

          <label>Desde</label>

          <select id="currencyFrom" class="toolSelect">
            <option value="USD">USD</option>
            <option value="PEN">PEN</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>

        </div>

        <div class="field">

          <label>Hacia</label>

          <select id="currencyTo" class="toolSelect">
            <option value="PEN">PEN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>

        </div>

      </div>

      <button
        id="currencyButton"
        class="toolButton primary"
      >
        Consultar conversión
      </button>

      <div
        id="currencyResult"
        class="resultBox"
      >
        Necesita conexión a Internet.
      </div>

    </div>
  `;
}


async function bindCurrency() {

  $("#currencyButton")?.addEventListener(
    "click",
    async () => {

      const amount =
        Number($("#currencyAmount").value);

      const from =
        $("#currencyFrom").value;

      const to =
        $("#currencyTo").value;

      const result =
        $("#currencyResult");

      if (
        !Number.isFinite(amount) ||
        amount < 0
      ) {

        result.textContent =
          "Introduce una cantidad válida.";

        return;
      }

      if (from === to) {

        result.innerHTML =
          `<strong>${formatNumber(amount)}</strong> ${to}`;

        return;
      }

      result.textContent =
        "Consultando tasa...";

      const controller =
        new AbortController();

      const timeout =
        setTimeout(
          () => controller.abort(),
          7000
        );

      try {

        const response =
          await fetch(
            `https://api.frankfurter.app/latest?amount=${encodeURIComponent(amount)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
            {
              signal:
                controller.signal
            }
          );

        if (!response.ok) {
          throw new Error("API");
        }

        const data =
          await response.json();

        const converted =
          data?.rates?.[to];

        if (!Number.isFinite(converted)) {
          throw new Error("Sin resultado");
        }

        result.innerHTML = `
          <strong>
            ${formatNumber(converted)}
          </strong>
          ${to}

          <div style="margin-top:8px">
            ${formatNumber(amount)} ${from}
          </div>
        `;

      } catch {

        result.textContent =
          "No se pudo consultar la conversión. Comprueba tu conexión.";

      } finally {

        clearTimeout(timeout);
      }
    }
  );
}


/* =========================================================
   FECHAS
   ========================================================= */

function dateDiffHTML() {

  return `
    <div class="toolForm">

      <div class="formRow">

        <div class="field">
          <label>Fecha inicial</label>
          <input id="dateA" class="toolInput" type="date">
        </div>

        <div class="field">
          <label>Fecha final</label>
          <input id="dateB" class="toolInput" type="date">
        </div>

      </div>

      <button
        id="dateDiffButton"
        class="toolButton primary"
      >
        Calcular
      </button>

      <div
        id="dateDiffResult"
        class="resultBox"
      >
        Resultado.
      </div>

    </div>
  `;
}


function bindDateDiff() {

  $("#dateDiffButton")?.addEventListener(
    "click",
    () => {

      const a =
        new Date($("#dateA").value);

      const b =
        new Date($("#dateB").value);

      if (
        Number.isNaN(a.getTime()) ||
        Number.isNaN(b.getTime())
      ) {

        $("#dateDiffResult").textContent =
          "Selecciona ambas fechas.";

        return;
      }

      const milliseconds =
        Math.abs(
          b.getTime() -
          a.getTime()
        );

      const days =
        Math.round(
          milliseconds /
          86400000
        );

      $("#dateDiffResult").innerHTML = `
        <strong>${days}</strong> días
        <div style="margin-top:8px">
          Aproximadamente
          ${formatNumber(days / 7)} semanas.
        </div>
      `;
    }
  );
}


/* =========================================================
   EDAD
   ========================================================= */

function ageHTML() {

  return `
    <div class="toolForm">

      <div class="field">

        <label>Fecha de nacimiento</label>

        <input
          id="birthDate"
          class="toolInput"
          type="date"
        >

      </div>

      <button
        id="ageButton"
        class="toolButton primary"
      >
        Calcular edad
      </button>

      <div
        id="ageResult"
        class="resultBox"
      >
        Resultado.
      </div>

    </div>
  `;
}


function bindAge() {

  $("#ageButton")?.addEventListener(
    "click",
    () => {

      const birth =
        new Date($("#birthDate").value);

      if (Number.isNaN(birth.getTime())) {

        $("#ageResult").textContent =
          "Selecciona una fecha.";

        return;
      }

      const now =
        new Date();

      let age =
        now.getFullYear() -
        birth.getFullYear();

      const month =
        now.getMonth() -
        birth.getMonth();

      if (
        month < 0 ||
        (
          month === 0 &&
          now.getDate() < birth.getDate()
        )
      ) {
        age--;
      }

      if (age < 0) {

        $("#ageResult").textContent =
          "La fecha no puede ser futura.";

        return;
      }

      $("#ageResult").innerHTML =
        `Edad:
        <strong>${age}</strong> años`;
    }
  );
}


/* =========================================================
   TIMER
   ========================================================= */

function timerHTML() {

  return `
    <div class="toolForm">

      <div class="formRow">

        <div class="field">
          <label>Minutos</label>
          <input
            id="timerMinutes"
            class="toolInput"
            type="number"
            min="0"
            value="5"
          >
        </div>

        <div class="field">
          <label>Segundos</label>
          <input
            id="timerSeconds"
            class="toolInput"
            type="number"
            min="0"
            max="59"
            value="0"
          >
        </div>

      </div>

      <div
        id="timerDisplay"
        class="timerDisplay"
      >
        05:00
      </div>

      <div class="toolButtons">

        <button
          id="timerStart"
          class="toolButton primary"
        >
          ▶ Iniciar
        </button>

        <button
          id="timerPause"
          class="toolButton"
        >
          ❚❚ Pausar
        </button>

        <button
          id="timerReset"
          class="toolButton"
        >
          ↻ Reiniciar
        </button>

      </div>

    </div>
  `;
}


let timerInterval = null;


function bindTimer() {

  updateTimerDisplay();

  $("#timerStart")?.addEventListener(
    "click",
    startTimer
  );

  $("#timerPause")?.addEventListener(
    "click",
    pauseTimer
  );

  $("#timerReset")?.addEventListener(
    "click",
    resetTimer
  );
}


function startTimer() {

  if (state.timer.running) return;

  const minutes =
    Number($("#timerMinutes").value) || 0;

  const seconds =
    Number($("#timerSeconds").value) || 0;

  if (
    state.timer.remaining <= 0
  ) {

    state.timer.remaining =
      Math.max(
        0,
        minutes * 60 +
        seconds
      );
  }

  if (state.timer.remaining <= 0) {

    showToast("Configura un tiempo.");

    return;
  }

  state.timer.running = true;

  state.timer.endAt =
    Date.now() +
    state.timer.remaining * 1000;

  saveState();

  clearInterval(timerInterval);

  timerInterval =
    setInterval(
      updateTimerTick,
      250
    );

  updateTimerTick();
}


function pauseTimer() {

  if (!state.timer.running) return;

  state.timer.remaining =
    Math.max(
      0,
      Math.ceil(
        (state.timer.endAt -
          Date.now()) /
        1000
      )
    );

  state.timer.running = false;

  saveState();

  clearInterval(timerInterval);

  updateTimerDisplay();
}


function resetTimer() {

  state.timer.running = false;

  state.timer.remaining = 0;

  state.timer.endAt = 0;

  clearInterval(timerInterval);

  saveState();

  updateTimerDisplay();
}


function updateTimerTick() {

  if (!state.timer.running) return;

  state.timer.remaining =
    Math.max(
      0,
      Math.ceil(
        (state.timer.endAt -
          Date.now()) /
        1000
      )
    );

  updateTimerDisplay();

  if (state.timer.remaining <= 0) {

    state.timer.running = false;

    clearInterval(timerInterval);

    saveState();

    showToast("⏰ ¡Tiempo terminado!");
  }
}


function updateTimerDisplay() {

  const display =
    $("#timerDisplay");

  if (!display) return;

  const total =
    Math.max(
      0,
      state.timer.remaining
    );

  const minutes =
    Math.floor(total / 60);

  const seconds =
    total % 60;

  display.textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


/* =========================================================
   CRONÓMETRO
   ========================================================= */

let stopwatchInterval = null;

let stopwatchLaps = [];


function stopwatchHTML() {

  return `
    <div class="toolForm">

      <div
        id="stopwatchDisplay"
        class="stopwatchDisplay"
      >
        00:00.00
      </div>

      <div class="toolButtons">

        <button
          id="stopwatchStart"
          class="toolButton primary"
        >
          ▶ Iniciar
        </button>

        <button
          id="stopwatchLap"
          class="toolButton"
        >
          ⚑ Vuelta
        </button>

        <button
          id="stopwatchReset"
          class="toolButton"
        >
          ↻ Reiniciar
        </button>

      </div>

      <div
        id="stopwatchLaps"
        class="taskList"
      ></div>

    </div>
  `;
}


function bindStopwatch() {

  updateStopwatchDisplay();

  renderStopwatchLaps();

  $("#stopwatchStart")?.addEventListener(
    "click",
    toggleStopwatch
  );

  $("#stopwatchLap")?.addEventListener(
    "click",
    addStopwatchLap
  );

  $("#stopwatchReset")?.addEventListener(
    "click",
    resetStopwatch
  );
}


function toggleStopwatch() {

  if (state.stopwatch.running) {

    state.stopwatch.elapsed +=
      Date.now() -
      state.stopwatch.startedAt;

    state.stopwatch.running = false;

    clearInterval(stopwatchInterval);

    $("#stopwatchStart").textContent =
      "▶ Continuar";

  } else {

    state.stopwatch.startedAt =
      Date.now();

    state.stopwatch.running = true;

    $("#stopwatchStart").textContent =
      "❚❚ Pausar";

    clearInterval(stopwatchInterval);

    stopwatchInterval =
      setInterval(
        updateStopwatchDisplay,
        50
      );
  }

  saveState();

  updateStopwatchDisplay();
}


function updateStopwatchDisplay() {

  const display =
    $("#stopwatchDisplay");

  if (!display) return;

  let elapsed =
    state.stopwatch.elapsed;

  if (state.stopwatch.running) {

    elapsed +=
      Date.now() -
      state.stopwatch.startedAt;
  }

  const totalSeconds =
    Math.floor(elapsed / 1000);

  const minutes =
    Math.floor(totalSeconds / 60);

  const seconds =
    totalSeconds % 60;

  const hundredths =
    Math.floor(
      (elapsed % 1000) / 10
    );

  display.textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}


function addStopwatchLap() {

  let elapsed =
    state.stopwatch.elapsed;

  if (state.stopwatch.running) {

    elapsed +=
      Date.now() -
      state.stopwatch.startedAt;
  }

  stopwatchLaps.unshift(elapsed);

  renderStopwatchLaps();
}


function renderStopwatchLaps() {

  const container =
    $("#stopwatchLaps");

  if (!container) return;

  container.innerHTML =
    stopwatchLaps.map(
      (time, index) => `
        <div class="listItem">
          <strong>Vuelta ${stopwatchLaps.length - index}</strong>
          <span>
            ${formatStopwatchTime(time)}
          </span>
        </div>
      `
    ).join("");
}


function formatStopwatchTime(milliseconds) {

  const seconds =
    Math.floor(milliseconds / 1000);

  const minutes =
    Math.floor(seconds / 60);

  const secs =
    seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}


function resetStopwatch() {

  state.stopwatch = {
    running: false,
    elapsed: 0,
    startedAt: 0
  };

  stopwatchLaps = [];

  clearInterval(stopwatchInterval);

  saveState();

  updateStopwatchDisplay();

  renderStopwatchLaps();

  if ($("#stopwatchStart")) {
    $("#stopwatchStart").textContent =
      "▶ Iniciar";
  }
}


/* =========================================================
   RELOJ
   ========================================================= */

let clockInterval = null;


function clockHTML() {

  return `
    <div class="toolForm">

      <div
        id="clockDisplay"
        class="clockDisplay"
      >
        --:--:--
      </div>

      <div
        id="clockDate"
        class="resultBox"
      >
        --
      </div>

    </div>
  `;
}


function bindClock() {

  updateClock();

  clearInterval(clockInterval);

  clockInterval =
    setInterval(
      updateClock,
      1000
    );
}


function updateClock() {

  const display =
    $("#clockDisplay");

  const date =
    $("#clockDate");

  if (!display || !date) return;

  const now =
    new Date();

  display.textContent =
    now.toLocaleTimeString(
      "es-PE",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }
    );

  date.textContent =
    now.toLocaleDateString(
      "es-PE",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      }
    );
}


/* =========================================================
   RELOJ MUNDIAL
   ========================================================= */

function worldClockHTML() {

  return `
    <div class="toolForm">

      <div class="resultBox" id="worldClockResult"></div>

    </div>
  `;
}


function bindWorldClock() {

  const zones = [
    ["Lima", "America/Lima"],
    ["Nueva York", "America/New_York"],
    ["Los Ángeles", "America/Los_Angeles"],
    ["Londres", "Europe/London"],
    ["Madrid", "Europe/Madrid"],
    ["Tokio", "Asia/Tokyo"]
  ];

  const container =
    $("#worldClockResult");

  function update() {

    container.innerHTML =
      zones.map(
        ([name, zone]) => {

          let time;

          try {

            time =
              new Intl.DateTimeFormat(
                "es-PE",
                {
                  timeZone: zone,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit"
                }
              ).format(
                new Date()
              );

          } catch {

            time = "--";
          }

          return `
            <div
              style="
                display:flex;
                justify-content:space-between;
                gap:15px;
                padding:10px 0;
                border-bottom:1px solid var(--border);
              "
            >
              <span>${name}</span>
              <strong>${time}</strong>
            </div>
          `;
        }
      ).join("");
  }

  update();

  setInterval(
    update,
    1000
  );
}


/* =========================================================
   CUENTA REGRESIVA
   ========================================================= */

let countdownInterval = null;


function countdownHTML() {

  return `
    <div class="toolForm">

      <div class="field">

        <label>Fecha y hora objetivo</label>

        <input
          id="countdownDate"
          class="toolInput"
          type="datetime-local"
        >

      </div>

      <button
        id="countdownStart"
        class="toolButton primary"
      >
        Iniciar
      </button>

      <div
        id="countdownResult"
        class="resultBox"
      >
        Selecciona una fecha.
      </div>

    </div>
  `;
}


function bindCountdown() {

  $("#countdownStart")?.addEventListener(
    "click",
    () => {

      const value =
        $("#countdownDate").value;

      if (!value) {

        $("#countdownResult").textContent =
          "Selecciona una fecha.";

        return;
      }

      const target =
        new Date(value).getTime();

      clearInterval(countdownInterval);

      function update() {

        const difference =
          target -
          Date.now();

        if (difference <= 0) {

          $("#countdownResult").innerHTML =
            "<strong>¡Llegó el momento!</strong>";

          clearInterval(countdownInterval);

          return;
        }

        const seconds =
          Math.floor(
            difference / 1000
          );

        const days =
          Math.floor(
            seconds / 86400
          );

        const hours =
          Math.floor(
            (seconds % 86400) / 3600
          );

        const minutes =
          Math.floor(
            (seconds % 3600) / 60
          );

        const secs =
          seconds % 60;

        $("#countdownResult").innerHTML = `
          <strong>
            ${days}d ${hours}h ${minutes}m ${secs}s
          </strong>
        `;
      }

      update();

      countdownInterval =
        setInterval(
          update,
          1000
        );
    }
  );
}


/* =========================================================
   TEXTO
   ========================================================= */

function textHTML() {

  return `
    <div class="toolForm">

      <div class="field">

        <label>Texto</label>

        <textarea
          id="textInput"
          class="toolTextarea"
          placeholder="Escribe o pega tu texto..."
        ></textarea>

      </div>

      <div
        id="textResult"
        class="resultBox"
      >
        Escribe algo para analizarlo.
      </div>

    </div>
  `;
}


function bindText() {

  $("#textInput")?.addEventListener(
    "input",
    () => {

      const text =
        $("#textInput").value;

      const characters =
        text.length;

      const charactersNoSpaces =
        text.replace(/\s/g, "").length;

      const words =
        text.trim()
          ? text.trim().split(/\s+/).length
          : 0;

      const lines =
        text
          ? text.split(/\r?\n/).length
          : 0;

      const readingMinutes =
        words / 200;

      $("#textResult").innerHTML = `
        <div>Caracteres: <strong>${characters}</strong></div>
        <div>Sin espacios: <strong>${charactersNoSpaces}</strong></div>
        <div>Palabras: <strong>${words}</strong></div>
        <div>Líneas: <strong>${lines}</strong></div>
        <div style="margin-top:8px">
          Lectura aproximada:
          ${formatNumber(readingMinutes, 2)} min
        </div>
      `;
    }
  );
}


/* =========================================================
   MAYÚSCULAS
   ========================================================= */

function caseHTML() {

  return `
    <div class="toolForm">

      <textarea
        id="caseInput"
        class="toolTextarea"
        placeholder="Escribe tu texto..."
      ></textarea>

      <div class="toolButtons">

        <button
          id="upperButton"
          class="toolButton primary"
        >
          MAYÚSCULAS
        </button>

        <button
          id="lowerButton"
          class="toolButton"
        >
          minúsculas
        </button>

        <button
          id="titleButton"
          class="toolButton"
        >
          Título
        </button>

        <button
          id="copyCase"
          class="toolButton"
        >
          Copiar
        </button>

      </div>

      <textarea
        id="caseResult"
        class="toolTextarea"
        readonly
        placeholder="Resultado..."
      ></textarea>

    </div>
  `;
}


function bindCase() {

  const input =
    $("#caseInput");

  const result =
    $("#caseResult");

  $("#upperButton")?.addEventListener(
    "click",
    () => {
      result.value =
        input.value.toUpperCase();
    }
  );

  $("#lowerButton")?.addEventListener(
    "click",
    () => {
      result.value =
        input.value.toLowerCase();
    }
  );

  $("#titleButton")?.addEventListener(
    "click",
    () => {

      result.value =
        input.value
          .toLowerCase()
          .replace(
            /(^|\s)\S/g,
            char => char.toUpperCase()
          );
    }
  );

  $("#copyCase")?.addEventListener(
    "click",
    async () => {

      try {

        await navigator.clipboard.writeText(
          result.value
        );

        showToast("Texto copiado.");

      } catch {

        showToast("No se pudo copiar.");
      }
    }
  );
}


/* =========================================================
   NOTAS
   ========================================================= */

function notesHTML() {

  return `
    <div class="toolForm">

      <textarea
        id="notesInput"
        class="toolTextarea"
        placeholder="Escribe tus notas..."
      ></textarea>

      <div class="toolButtons">

        <button
          id="saveNotes"
          class="toolButton primary"
        >
          Guardar
        </button>

        <button
          id="clearNotes"
          class="toolButton"
        >
          Limpiar
        </button>

      </div>

      <div class="toolHint">
        Las notas se guardan en este navegador.
      </div>

    </div>
  `;
}


function bindNotes() {

  $("#notesInput").value =
    state.notes || "";

  $("#saveNotes")?.addEventListener(
    "click",
    () => {

      state.notes =
        $("#notesInput").value;

      saveState();

      showToast("Notas guardadas.");
    }
  );

  $("#clearNotes")?.addEventListener(
    "click",
    () => {

      $("#notesInput").value = "";

      state.notes = "";

      saveState();

      showToast("Notas limpiadas.");
    }
  );
}


/* =========================================================
   TAREAS
   ========================================================= */

function tasksHTML() {

  return `
    <div class="toolForm">

      <div class="formRow">

        <div class="field">

          <label>Nueva tarea</label>

          <input
            id="taskInput"
            class="toolInput"
            placeholder="Ej. Estudiar"
          >

        </div>

        <div class="field">

          <label>Prioridad</label>

          <select
            id="taskPriority"
            class="toolSelect"
          >
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="baja">Baja</option>
          </select>

        </div>

      </div>

      <button
        id="addTask"
        class="toolButton primary"
      >
        + Agregar tarea
      </button>

      <div
        id="taskList"
        class="taskList"
      ></div>

    </div>
  `;
}


function bindTasks() {

  renderTasks();

  $("#addTask")?.addEventListener(
    "click",
    () => {

      const input =
        $("#taskInput");

      const text =
        input.value.trim();

      if (!text) {

        showToast("Escribe una tarea.");

        return;
      }

      state.tasks.push({
        id: Date.now(),
        text,
        priority:
          $("#taskPriority").value,
        completed: false
      });

      input.value = "";

      saveState();

      renderTasks();
    }
  );
}


function renderTasks() {

  const container =
    $("#taskList");

  if (!container) return;

  if (!state.tasks.length) {

    container.innerHTML =
      `<div class="toolHint">No hay tareas.</div>`;

    return;
  }

  container.innerHTML =
    state.tasks.map(task => `
      <div class="taskItem ${task.completed ? "completed" : ""}">

        <input
          type="checkbox"
          data-task-check="${task.id}"
          ${task.completed ? "checked" : ""}
        >

        <span style="flex:1">
          ${escapeHtml(task.text)}
          <small style="display:block;color:var(--muted2)">
            Prioridad: ${escapeHtml(task.priority)}
          </small>
        </span>

        <button
          class="toolButton"
          data-task-delete="${task.id}"
          type="button"
        >
          ×
        </button>

      </div>
    `).join("");
}


/* =========================================================
   LISTA DE COMPRAS
   ========================================================= */

function shoppingListHTML() {

  return `
    <div class="toolForm">

      <div class="formRow">

        <input
          id="shoppingInput"
          class="toolInput"
          placeholder="Producto"
        >

        <button
          id="addShopping"
          class="toolButton primary"
        >
          + Agregar
        </button>

      </div>

      <div
        id="shoppingList"
        class="shoppingList"
      ></div>

    </div>
  `;
}


function bindShoppingList() {

  renderShoppingList();

  $("#addShopping")?.addEventListener(
    "click",
    addShoppingItem
  );

  $("#shoppingInput")?.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {
        addShoppingItem();
      }
    }
  );
}


function addShoppingItem() {

  const input =
    $("#shoppingInput");

  const text =
    input.value.trim();

  if (!text) return;

  state.shopping.push({
    id: Date.now(),
    text,
    checked: false
  });

  input.value = "";

  saveState();

  renderShoppingList();
}


function renderShoppingList() {

  const container =
    $("#shoppingList");

  if (!container) return;

  container.innerHTML =
    state.shopping.map(item => `
      <div class="listItem">

        <input
          type="checkbox"
          data-shop-check="${item.id}"
          ${item.checked ? "checked" : ""}
        >

        <span
          style="
            flex:1;
            ${item.checked ? "text-decoration:line-through;opacity:.55" : ""}
          "
        >
          ${escapeHtml(item.text)}
        </span>

        <button
          class="toolButton"
          data-shop-delete="${item.id}"
        >
          ×
        </button>

      </div>
    `).join("");
}


/* =========================================================
   BÚSQUEDA DE PRODUCTOS
   ========================================================= */

function shoppingHTML() {

  return `
    <div class="toolForm">

      <div class="field">

        <label>Producto</label>

        <input
          id="shoppingSearch"
          class="toolInput"
          placeholder="Ej. audífonos"
        >

      </div>

      <button
        id="shoppingSearchButton"
        class="toolButton primary"
      >
        Buscar productos
      </button>

      <div
        id="shoppingLinks"
        class="resultBox"
      >
        Las búsquedas se abrirán en sitios externos.
      </div>

      <div class="toolHint">
        ÚtilHub no realiza la compra automáticamente.
      </div>

    </div>
  `;
}


function bindShopping() {

  $("#shoppingSearchButton")?.addEventListener(
    "click",
    () => {

      const query =
        $("#shoppingSearch").value.trim();

      if (!query) return;

      const encoded =
        encodeURIComponent(query);

      $("#shoppingLinks").innerHTML = `
        <div class="toolButtons">

          <a
            class="toolButton primary"
            target="_blank"
            rel="noopener"
            href="https://www.google.com/search?tbm=shop&q=${encoded}"
          >
            Google Shopping
          </a>

          <a
            class="toolButton"
            target="_blank"
            rel="noopener"
            href="https://listado.mercadolibre.com.pe/${encoded}"
          >
            Mercado Libre
          </a>

        </div>
      `;
    }
  );
}


/* =========================================================
   COMIDA
   ========================================================= */

function foodHTML() {

  return `
    <div class="toolForm">

      <div class="field">

        <label>¿Qué quieres buscar?</label>

        <input
          id="foodSearch"
          class="toolInput"
          placeholder="Ej. pizza, hamburguesa..."
        >

      </div>

      <button
        id="foodSearchButton"
        class="toolButton primary"
      >
        Buscar comida
      </button>

      <div
        id="foodLinks"
        class="resultBox"
      >
        La búsqueda se realiza en sitios externos.
      </div>

      <div class="toolHint">
        ÚtilHub no realiza pedidos automáticamente.
      </div>

    </div>
  `;
}


function bindFood() {

  $("#foodSearchButton")?.addEventListener(
    "click",
    () => {

      const query =
        $("#foodSearch").value.trim();

      if (!query) return;

      const encoded =
        encodeURIComponent(query);

      $("#foodLinks").innerHTML = `
        <div class="toolButtons">

          <a
            class="toolButton primary"
            target="_blank"
            rel="noopener"
            href="https://www.google.com/search?q=${encoded}+comida"
          >
            Buscar en Google
          </a>

          <a
            class="toolButton"
            target="_blank"
            rel="noopener"
            href="https://www.google.com/maps/search/${encoded}"
          >
            Buscar en Maps
          </a>

        </div>
      `;
    }
  );
}


/* =========================================================
   CONTRASEÑA
   ========================================================= */

function passwordHTML() {

  return `
    <div class="toolForm">

      <div class="field">

        <label>Longitud</label>

        <input
          id="passwordLength"
          class="toolInput"
          type="number"
          min="8"
          max="128"
          value="16"
        >

      </div>

      <div class="field">

        <label>
          <input
            id="passwordNumbers"
            type="checkbox"
            checked
          >
          Números
        </label>

        <label>
          <input
            id="passwordSymbols"
            type="checkbox"
            checked
          >
          Símbolos
        </label>

      </div>

      <button
        id="passwordGenerate"
        class="toolButton primary"
      >
        Generar
      </button>

      <div
        id="passwordResult"
        class="resultBox"
      >
        Pulsa generar.
      </div>

      <button
        id="passwordCopy"
        class="toolButton"
      >
        Copiar
      </button>

    </div>
  `;
}


function secureRandom(max) {

  if (
    window.crypto &&
    crypto.getRandomValues
  ) {

    const array =
      new Uint32Array(1);

    crypto.getRandomValues(array);

    return array[0] % max;
  }

  return Math.floor(
    Math.random() * max
  );
}


function generatePassword(length, numbers, symbols) {

  const letters =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

  const nums =
    "23456789";

  const syms =
    "!@#$%^&*_-+=?";

  let chars =
    letters;

  if (numbers) chars += nums;

  if (symbols) chars += syms;

  let result = "";

  for (let i = 0; i < length; i++) {

    result +=
      chars[
        secureRandom(chars.length)
      ];
  }

  return result;
}


function bindPassword() {

  $("#passwordGenerate")?.addEventListener(
    "click",
    () => {

      const length =
        clamp(
          Number($("#passwordLength").value) || 16,
          8,
          128
        );

      const password =
        generatePassword(
          length,
          $("#passwordNumbers").checked,
          $("#passwordSymbols").checked
        );

      $("#passwordResult").textContent =
        password;
    }
  );

  $("#passwordCopy")?.addEventListener(
    "click",
    async () => {

      const value =
        $("#passwordResult").textContent;

      if (!value) return;

      try {

        await navigator.clipboard.writeText(
          value
        );

        showToast("Contraseña copiada.");

      } catch {

        showToast("No se pudo copiar.");
      }
    }
  );
}


/* =========================================================
   RANDOM
   ========================================================= */

function randomHTML() {

  return `
    <div class="toolForm">

      <div class="formRow">

        <div class="field">
          <label>Mínimo</label>
          <input
            id="randomMin"
            class="toolInput"
            type="number"
            value="1"
          >
        </div>

        <div class="field">
          <label>Máximo</label>
          <input
            id="randomMax"
            class="toolInput"
            type="number"
            value="100"
          >
        </div>

      </div>

      <button
        id="randomButton"
        class="toolButton primary"
      >
        Generar número
      </button>

      <div
        id="randomResult"
        class="resultBox"
      >
        Resultado.
      </div>

    </div>
  `;
}


function bindRandom() {

  $("#randomButton")?.addEventListener(
    "click",
    () => {

      const min =
        Math.ceil(
          Number($("#randomMin").value)
        );

      const max =
        Math.floor(
          Number($("#randomMax").value)
        );

      if (
        !Number.isFinite(min) ||
        !Number.isFinite(max) ||
        min > max
      ) {

        $("#randomResult").textContent =
          "Rango inválido.";

        return;
      }

      $("#randomResult").innerHTML =
        `<strong>${randomInt(min, max)}</strong>`;
    }
  );
}


/* =========================================================
   QR
   ========================================================= */

function qrHTML() {

  return `
    <div class="toolForm">

      <div class="field">

        <label>Texto o enlace</label>

        <textarea
          id="qrInput"
          class="toolTextarea"
          placeholder="https://ejemplo.com"
        ></textarea>

      </div>

      <button
        id="qrGenerate"
        class="toolButton primary"
      >
        Generar QR
      </button>

      <div
        id="qrResult"
        class="resultBox"
        style="text-align:center"
      >
        Introduce contenido.
      </div>

    </div>
  `;
}


function bindQR() {

  $("#qrGenerate")?.addEventListener(
    "click",
    () => {

      const text =
        $("#qrInput").value.trim();

      if (!text) {

        $("#qrResult").textContent =
          "Introduce un texto o enlace.";

        return;
      }

      const url =
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;

      $("#qrResult").innerHTML = `
        <img
          src="${url}"
          alt="Código QR"
          width="300"
          height="300"
          style="
            max-width:100%;
            height:auto;
            border-radius:12px;
            background:white;
            padding:10px;
          "
        >

        <div style="margin-top:12px">
          <a
            class="toolButton"
            target="_blank"
            rel="noopener"
            href="${url}"
          >
            Abrir QR
          </a>
        </div>
      `;
    }
  );
}


/* =========================================================
   DICCIONARIO
   ========================================================= */

function dictionaryHTML() {

  return `
    <div class="toolForm">

      <div class="field">

        <label>Palabra</label>

        <input
          id="dictionaryInput"
          class="toolInput"
          placeholder="Ej. universo"
        >

      </div>

      <button
        id="dictionarySearch"
        class="toolButton primary"
      >
        Buscar definición
      </button>

      <div
        id="dictionaryResult"
        class="resultBox"
      >
        Introduce una palabra.
      </div>

      <div
        id="dictionaryRecent"
        class="taskList"
      ></div>

    </div>
  `;
}


async function bindDictionary() {

  renderDictionaryRecent();

  $("#dictionarySearch")?.addEventListener(
    "click",
    searchDictionary
  );

  $("#dictionaryInput")?.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {
        searchDictionary();
      }
    }
  );
}


async function searchDictionary() {

  const word =
    $("#dictionaryInput").value.trim();

  const result =
    $("#dictionaryResult");

  if (!word) {

    result.textContent =
      "Escribe una palabra.";

    return;
  }

  result.textContent =
    "Buscando...";

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      8000
    );

  try {

    const response =
      await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/es/${encodeURIComponent(word)}`,
        {
          signal:
            controller.signal
        }
      );

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("JSON");
    }

    if (!response.ok) {

      result.textContent =
        data?.title ||
        "No encontramos esa palabra.";

      return;
    }

    const entry =
      data?.[0];

    if (!entry) {

      result.textContent =
        "No encontramos resultados.";

      return;
    }

    const meanings =
      Array.isArray(entry.meanings)
        ? entry.meanings
        : [];

    let html = "";

    for (const meaning of meanings) {

      const definitions =
        Array.isArray(
          meaning.definitions
        )
          ? meaning.definitions
          : [];

      html += `
        <div style="margin-bottom:15px">

          <strong>
            ${escapeHtml(
              meaning.partOfSpeech ||
              "Significado"
            )}
          </strong>
      `;

      for (
        const definition of
        definitions.slice(0, 5)
      ) {

        html += `
          <div
            style="
              margin-top:8px;
              padding:9px;
              border-bottom:1px solid var(--border);
            "
          >
            ${escapeHtml(
              definition.definition ||
              ""
            )}

            ${
              definition.example
                ? `
                  <div
                    style="
                      margin-top:5px;
                      color:var(--muted);
                    "
                  >
                    Ejemplo:
                    ${escapeHtml(
                      definition.example
                    )}
                  </div>
                `
                : ""
            }
          </div>
        `;
      }

      html += `</div>`;
    }

    result.innerHTML =
      html ||
      "No encontramos definiciones.";

    state.dictionaryRecent =
      [
        word,
        ...state.dictionaryRecent.filter(
          item => item !== word
        )
      ].slice(0, 8);

    saveState();

    renderDictionaryRecent();

  } catch {

    result.textContent =
      "No se pudo conectar con el diccionario.";

  } finally {

    clearTimeout(timeout);
  }
}


function renderDictionaryRecent() {

  const container =
    $("#dictionaryRecent");

  if (!container) return;

  if (!state.dictionaryRecent.length) {

    container.innerHTML = "";

    return;
  }

  container.innerHTML = `
    <div class="toolHint">
      Búsquedas recientes
    </div>

    ${state.dictionaryRecent.map(
      word => `
        <button
          class="toolButton"
          data-dictionary-word="${escapeHtml(word)}"
          type="button"
        >
          ${escapeHtml(word)}
        </button>
      `
    ).join("")}
  `;
}


/* =========================================================
   ESTUDIO
   ========================================================= */

function studyHTML() {

  return `
    <div class="toolForm">

      <div class="formRow">

        <div class="field">

          <label>Materia</label>

          <input
            id="studySubject"
            class="toolInput"
            placeholder="Matemática"
          >

        </div>

        <div class="field">

          <label>Minutos</label>

          <input
            id="studyMinutes"
            class="toolInput"
            type="number"
            min="1"
            value="25"
          >

        </div>

      </div>

      <button
        id="studyStart"
        class="toolButton primary"
      >
        Empezar sesión
      </button>

      <div
        id="studyResult"
        class="resultBox"
      >
        Organiza una sesión de estudio.
      </div>

    </div>
  `;
}


function bindStudy() {

  $("#studyStart")?.addEventListener(
    "click",
    () => {

      const subject =
        $("#studySubject").value.trim() ||
        "Estudio";

      const minutes =
        Number($("#studyMinutes").value);

      if (
        !Number.isFinite(minutes) ||
        minutes <= 0
      ) {

        $("#studyResult").textContent =
          "Introduce minutos válidos.";

        return;
      }

      $("#studyResult").innerHTML = `
        <strong>
          ${escapeHtml(subject)}
        </strong>

        <div style="margin-top:8px">
          Sesión preparada:
          ${formatNumber(minutes)} minutos.
        </div>

        <div style="margin-top:8px">
          Consejo: trabaja durante la sesión
          y haz una pausa al terminar.
        </div>
      `;
    }
  );
}


/* =========================================================
   OBJETIVOS
   ========================================================= */

function goalsHTML() {

  return `
    <div class="toolForm">

      <div class="field">

        <label>Objetivo</label>

        <input
          id="goalInput"
          class="toolInput"
          placeholder="Ej. Leer 20 páginas"
        >

      </div>

      <button
        id="goalAdd"
        class="toolButton primary"
      >
        Guardar objetivo
      </button>

      <div
        id="goalResult"
        class="resultBox"
      >
        Tu objetivo aparecerá aquí.
      </div>

    </div>
  `;
}


function bindGoals() {

  $("#goalAdd")?.addEventListener(
    "click",
    () => {

      const goal =
        $("#goalInput").value.trim();

      if (!goal) {

        showToast("Escribe un objetivo.");

        return;
      }

      $("#goalResult").innerHTML = `
        <strong>🎯 Objetivo guardado</strong>

        <div style="margin-top:8px">
          ${escapeHtml(goal)}
        </div>
      `;

      $("#goalInput").value = "";
    }
  );
}


/* =========================================================
   FOCUS
   ========================================================= */

function focusHTML() {

  return `
    <div class="toolForm">

      <div class="resultBox">

        <strong>
          🧠 Modo concentración
        </strong>

        <div style="margin-top:10px">
          Reduce elementos visuales para ayudarte
          a mantener la atención.
        </div>

      </div>

      <button
        id="focusEnable"
        class="toolButton primary"
      >
        Activar concentración
      </button>

    </div>
  `;
}


function bindFocus() {

  $("#focusEnable")?.addEventListener(
    "click",
    () => {

      toggleFocus();

      closeTool();
    }
  );
}


/* =========================================================
   BIND TOOL
   ========================================================= */

function bindTool(id) {

  const binders = {

    calculator: bindCalculator,
    percentage: bindPercentage,
    discount: bindDiscount,
    rule3: bindRule3,
    fractions: bindFractions,
    average: bindAverage,
    area: bindArea,
    binary: bindBinary,

    length: () =>
      bindConverter("length"),

    weight: () =>
      bindConverter("weight"),

    volume: () =>
      bindConverter("volume"),

    temperature: bindTemperature,

    timeconvert: bindTimeConvert,

    currency: bindCurrency,

    datediff: bindDateDiff,

    age: bindAge,

    timer: bindTimer,

    stopwatch: bindStopwatch,

    clock: bindClock,

    worldclock: bindWorldClock,

    countdown: bindCountdown,

    text: bindText,

    case: bindCase,

    notes: bindNotes,

    tasks: bindTasks,

    "shopping-list":
      bindShoppingList,

    shopping:
      bindShopping,

    food:
      bindFood,

    password:
      bindPassword,

    random:
      bindRandom,

    qr:
      bindQR,

    dictionary:
      bindDictionary,

    study:
      bindStudy,

    goals:
      bindGoals,

    focus:
      bindFocus
  };

  try {

    if (binders[id]) {
      binders[id]();
    }

  } catch (error) {

    console.error(
      `Error en herramienta ${id}:`,
      error
    );
  }
}


/* =========================================================
   TASK EVENT DELEGATION
   ========================================================= */

document.addEventListener(
  "change",
  event => {

    const taskCheck =
      event.target.closest(
        "[data-task-check]"
      );

    if (taskCheck) {

      const id =
        Number(
          taskCheck.dataset.taskCheck
        );

      const task =
        state.tasks.find(
          item => item.id === id
        );

      if (task) {

        task.completed =
          taskCheck.checked;

        saveState();

        renderTasks();
      }

      return;
    }


    const shopCheck =
      event.target.closest(
        "[data-shop-check]"
      );

    if (shopCheck) {

      const id =
        Number(
          shopCheck.dataset.shopCheck
        );

      const item =
        state.shopping.find(
          product => product.id === id
        );

      if (item) {

        item.checked =
          shopCheck.checked;

        saveState();

        renderShoppingList();
      }
    }
  }
);


document.addEventListener(
  "click",
  event => {

    const deleteTask =
      event.target.closest(
        "[data-task-delete]"
      );

    if (deleteTask) {

      const id =
        Number(
          deleteTask.dataset.taskDelete
        );

      state.tasks =
        state.tasks.filter(
          task => task.id !== id
        );

      saveState();

      renderTasks();

      return;
    }


    const deleteShop =
      event.target.closest(
        "[data-shop-delete]"
      );

    if (deleteShop) {

      const id =
        Number(
          deleteShop.dataset.shopDelete
        );

      state.shopping =
        state.shopping.filter(
          item => item.id !== id
        );

      saveState();

      renderShoppingList();

      return;
    }


    const dictionaryWord =
      event.target.closest(
        "[data-dictionary-word]"
      );

    if (dictionaryWord) {

      const input =
        $("#dictionaryInput");

      if (input) {

        input.value =
          dictionaryWord.dataset.dictionaryWord;

        searchDictionary();
      }
    }
  }
);


/* =========================================================
   TEMA
   ========================================================= */

function applyTheme() {

  document.body.classList.toggle(
    "light",
    state.theme === "light"
  );

  document.body.dataset.theme =
    state.theme;

  const button =
    $("#themeBtn");

  if (button) {
    button.textContent =
      state.theme === "light"
        ? "☀"
        : "◐";
  }
}


function toggleTheme() {

  state.theme =
    state.theme === "dark"
      ? "light"
      : "dark";

  applyTheme();

  saveState();
}


/* =========================================================
   MOTION
   ========================================================= */

function applyMotion() {

  const status =
    $("#novaStatusText");

  const dot =
    $("#novaStatus");

  if (state.motion) {

    if (status) {
      status.textContent =
        "NOVA ACTIVO";
    }

    if (dot) {
      dot.style.background =
        "var(--success)";
    }

  } else {

    if (status) {
      status.textContent =
        "NOVA PAUSADO";
    }

    if (dot) {
      dot.style.background =
        "var(--muted2)";
    }
  }
}


function toggleMotion() {

  state.motion =
    !state.motion;

  applyMotion();

  saveState();

  showToast(
    state.motion
      ? "Animaciones activadas."
      : "Animaciones pausadas."
  );
}


/* =========================================================
   FOCUS
   ========================================================= */

function applyFocus() {

  document.body.classList.toggle(
    "focusMode",
    state.focus
  );

  const button =
    $("#focusBtn");

  if (button) {
    button.textContent =
      state.focus
        ? "✕"
        : "⛶";
  }
}


function toggleFocus() {

  state.focus =
    !state.focus;

  applyFocus();

  saveState();
}


/* =========================================================
   EXPORTAR / IMPORTAR
   ========================================================= */

function exportData() {

  const data =
    JSON.stringify(
      state,
      null,
      2
    );

  const blob =
    new Blob(
      [data],
      {
        type:
          "application/json"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    "utilhub-v20-backup.json";

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);

  showToast("Datos exportados.");
}


function importData(file) {

  const reader =
    new FileReader();

  reader.onload =
    () => {

      try {

        const imported =
          JSON.parse(
            reader.result
          );

        state =
          mergeState(
            cloneDefaultState(),
            imported
          );

        state.version = 20;

        saveState();

        applyTheme();
        applyMotion();
        applyFocus();

        renderTools();
        renderQuickTools();

        showToast(
          "Datos importados correctamente."
        );

      } catch {

        showToast(
          "El archivo no es válido."
        );
      }
    };

  reader.readAsText(file);
}


/* =========================================================
   NOVA FLOW
   ========================================================= */

const canvas =
  $("#nova");

const ctx =
  canvas?.getContext("2d");

let canvasWidth = 0;
let canvasHeight = 0;
let dpr = 1;

let novaTime = 0;

let lastFrame =
  performance.now();

let fpsValue = 60;

let mouseX = 0;
let mouseY = 0;

let targetMouseX = 0;
let targetMouseY = 0;

let novaParticles = [];

let novaAutoTimer = null;


/* =========================================================
   CANVAS RESIZE
   ========================================================= */

function resizeCanvas() {

  if (!canvas || !ctx) return;

  dpr =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );

  canvasWidth =
    window.innerWidth;

  canvasHeight =
    window.innerHeight;

  canvas.width =
    Math.floor(
      canvasWidth * dpr
    );

  canvas.height =
    Math.floor(
      canvasHeight * dpr
    );

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );

  createNovaParticles();
}


/* =========================================================
   PARTICLES
   ========================================================= */

function getParticleCount() {

  let count =
    Number(state.novaParticles) || 100;

  if (state.performance === "high") {
    count *= 1.35;
  }

  if (state.performance === "performance") {
    count *= 0.45;
  }

  if (window.innerWidth < 600) {
    count *= 0.70;
  }

  return Math.max(
    20,
    Math.floor(count)
  );
}


function createNovaParticles() {

  const count =
    getParticleCount();

  novaParticles =
    Array.from(
      {
        length: count
      },
      () => ({
        x: random(0, canvasWidth),
        y: random(0, canvasHeight),

        vx: random(-0.6, 0.6),
        vy: random(-0.6, 0.6),

        size: random(0.5, 2.8),

        alpha: random(0.25, 0.95),

        phase: random(0, Math.PI * 2),

        hue: random(0, 360)
      })
    );
}


/* =========================================================
   CANVAS HELPERS
   ========================================================= */

function clearNova(alpha = 0.20) {

  ctx.fillStyle =
    `rgba(3,7,18,${alpha})`;

  ctx.fillRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );
}


function circle(
  x,
  y,
  radius,
  fill,
  alpha = 1
) {

  ctx.globalAlpha =
    alpha;

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    fill;

  ctx.fill();

  ctx.globalAlpha = 1;
}


function line(
  x1,
  y1,
  x2,
  y2,
  stroke,
  width = 1,
  alpha = 1
) {

  ctx.globalAlpha =
    alpha;

  ctx.strokeStyle =
    stroke;

  ctx.lineWidth =
    width;

  ctx.beginPath();

  ctx.moveTo(x1, y1);

  ctx.lineTo(x2, y2);

  ctx.stroke();

  ctx.globalAlpha = 1;
}


function glowCircle(
  x,
  y,
  radius,
  color,
  alpha = 0.35
) {

  const gradient =
    ctx.createRadialGradient(
      x,
      y,
      0,
      x,
      y,
      radius
    );

  gradient.addColorStop(
    0,
    `${color}${Math.floor(alpha * 255)
      .toString(16)
      .padStart(2, "0")}`
  );

  gradient.addColorStop(
    1,
    `${color}00`
  );

  ctx.fillStyle =
    gradient;

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius,
    0,
    Math.PI * 2
  );

  ctx.fill();
}


/* =========================================================
   NOVA 1 — COSMIC
   ========================================================= */

function drawCosmic(t) {

  clearNova(0.16);

  const cx =
    canvasWidth / 2 +
    Math.sin(t * 0.0003) * 80;

  const cy =
    canvasHeight / 2 +
    Math.cos(t * 0.00025) * 60;

  glowCircle(
    cx,
    cy,
    260,
    "#67e8f9",
    0.18
  );

  novaParticles.forEach((p, i) => {

    const angle =
      Math.atan2(
        p.y - cy,
        p.x - cx
      );

    const distance =
      Math.hypot(
        p.x - cx,
        p.y - cy
      );

    const a =
      angle +
      0.0003 * state.novaSpeed;

    p.x =
      cx +
      Math.cos(a) *
      distance;

    p.y =
      cy +
      Math.sin(a) *
      distance;

    circle(
      p.x,
      p.y,
      p.size,
      i % 3 === 0
        ? "#67e8f9"
        : "#a78bfa",
      p.alpha * state.novaIntensity
    );
  });
}


/* =========================================================
   NOVA 2 — AURORA
   ========================================================= */

function drawAurora(t) {

  clearNova(0.12);

  for (
    let wave = 0;
    wave < 7;
    wave++
  ) {

    ctx.beginPath();

    for (
      let x = 0;
      x <= canvasWidth;
      x += 12
    ) {

      const y =
        canvasHeight * 0.45 +
        Math.sin(
          x * 0.006 +
          t * 0.0007 +
          wave
        ) * (40 + wave * 8) +
        wave * 25;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      wave % 2 === 0
        ? "#67e8f9"
        : "#a78bfa";

    ctx.globalAlpha =
      0.18 *
      state.novaIntensity;

    ctx.lineWidth =
      18 - wave;

    ctx.stroke();

    ctx.globalAlpha = 1;
  }
}


/* =========================================================
   NOVA 3 — PULSE
   ========================================================= */

function drawPulse(t) {

  clearNova(0.18);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  const pulse =
    (Math.sin(
      t * 0.003
    ) + 1) / 2;

  for (
    let i = 0;
    i < 10;
    i++
  ) {

    const radius =
      pulse * 500 +
      i * 50;

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      radius,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      i % 2
        ? "#8b5cf6"
        : "#67e8f9";

    ctx.globalAlpha =
      Math.max(
        0,
        0.22 -
        i * 0.018
      ) *
      state.novaIntensity;

    ctx.lineWidth = 2;

    ctx.stroke();
  }

  ctx.globalAlpha = 1;

  glowCircle(
    cx,
    cy,
    120 + pulse * 80,
    "#67e8f9",
    0.2
  );
}


/* =========================================================
   NOVA 4 — MATRIX
   ========================================================= */

function drawMatrix(t) {

  clearNova(0.20);

  const columns =
    Math.ceil(canvasWidth / 18);

  ctx.font =
    "12px monospace";

  for (
    let i = 0;
    i < columns;
    i++
  ) {

    const x =
      i * 18;

    const y =
      ((t * 0.12 * state.novaSpeed) +
        i * 97) %
      (canvasHeight + 500) -
      500;

    const chars =
      "01アイウエオ<>[]{}";

    for (
      let j = 0;
      j < 18;
      j++
    ) {

      const char =
        chars[
          randomInt(
            0,
            chars.length - 1
          )
        ];

      ctx.fillStyle =
        j === 0
          ? "#d1fae5"
          : "#34d399";

      ctx.globalAlpha =
        (1 - j / 20) *
        state.novaIntensity *
        0.75;

      ctx.fillText(
        char,
        x,
        y + j * 16
      );
    }
  }

  ctx.globalAlpha = 1;
}


/* =========================================================
   NOVA 5 — NEBULA
   ========================================================= */

function drawNebula(t) {

  clearNova(0.10);

  for (
    let i = 0;
    i < 9;
    i++
  ) {

    const x =
      canvasWidth *
      (
        0.15 +
        i * 0.1
      ) +
      Math.sin(
        t * 0.0003 + i
      ) * 80;

    const y =
      canvasHeight *
      (
        0.25 +
        (i % 4) * 0.17
      );

    glowCircle(
      x,
      y,
      180 + Math.sin(t * 0.001 + i) * 60,
      i % 2
        ? "#8b5cf6"
        : "#ec4899",
      0.10 * state.novaIntensity
    );
  }

  novaParticles.forEach(p => {

    p.x +=
      Math.sin(
        p.y * 0.002 +
        t * 0.0005
      ) * 0.25;

    p.y -=
      0.15 *
      state.novaSpeed;

    if (p.y < -10) {
      p.y = canvasHeight + 10;
    }

    circle(
      p.x,
      p.y,
      p.size,
      "#c4b5fd",
      p.alpha * 0.55
    );
  });
}


/* =========================================================
   NOVA 6 — WAVES
   ========================================================= */

function drawWaves(t) {

  clearNova(0.13);

  for (
    let wave = 0;
    wave < 8;
    wave++
  ) {

    ctx.beginPath();

    for (
      let x = 0;
      x <= canvasWidth;
      x += 8
    ) {

      const y =
        canvasHeight / 2 +
        Math.sin(
          x * 0.009 +
          t * 0.002 +
          wave * 0.6
        ) *
        (25 + wave * 9);

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      wave % 2
        ? "#8b5cf6"
        : "#67e8f9";

    ctx.globalAlpha =
      0.18 *
      state.novaIntensity;

    ctx.lineWidth = 2;

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}


/* =========================================================
   NOVA 7 — STARFIELD
   ========================================================= */

function drawStarfield(t) {

  clearNova(0.18);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  novaParticles.forEach(p => {

    const dx =
      p.x - cx;

    const dy =
      p.y - cy;

    const factor =
      1 +
      0.0008 *
      state.novaSpeed *
      (t % 1000);

    const x =
      cx + dx * factor;

    const y =
      cy + dy * factor;

    circle(
      x,
      y,
      p.size *
      (1 + factor * 0.5),
      "#ffffff",
      p.alpha *
      state.novaIntensity
    );
  });
}


/* =========================================================
   NOVA 8 — VORTEX
   ========================================================= */

function drawVortex(t) {

  clearNova(0.15);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  for (
    let i = 0;
    i < 650;
    i += 5
  ) {

    const ratio =
      i / 650;

    const angle =
      i * 0.12 +
      t * 0.001 *
      state.novaSpeed;

    const radius =
      ratio *
      Math.min(
        canvasWidth,
        canvasHeight
      ) *
      0.55;

    const x =
      cx +
      Math.cos(angle) *
      radius;

    const y =
      cy +
      Math.sin(angle) *
      radius;

    circle(
      x,
      y,
      1.2,
      ratio < 0.5
        ? "#67e8f9"
        : "#8b5cf6",
      (1 - ratio) *
      0.75 *
      state.novaIntensity
    );
  }
}


/* =========================================================
   NOVA 9 — FIREFLY
   ========================================================= */

function drawFirefly(t) {

  clearNova(0.10);

  novaParticles.forEach(p => {

    p.x +=
      Math.sin(
        t * 0.001 +
        p.phase
      ) * 0.45;

    p.y +=
      Math.cos(
        t * 0.0007 +
        p.phase
      ) * 0.35;

    if (p.x < 0) p.x = canvasWidth;
    if (p.x > canvasWidth) p.x = 0;

    if (p.y < 0) p.y = canvasHeight;
    if (p.y > canvasHeight) p.y = 0;

    const glow =
      (Math.sin(
        t * 0.004 +
        p.phase
      ) + 1) / 2;

    glowCircle(
      p.x,
      p.y,
      20,
      "#fef08a",
      0.08 *
      glow *
      state.novaIntensity
    );

    circle(
      p.x,
      p.y,
      p.size + glow * 1.5,
      "#fde68a",
      p.alpha * glow
    );
  });
}


/* =========================================================
   NOVA 10 — RAIN
   ========================================================= */

function drawRain(t) {

  clearNova(0.18);

  novaParticles.forEach(p => {

    p.y +=
      (4 + p.size * 2) *
      state.novaSpeed;

    if (p.y > canvasHeight) {

      p.y = -20;

      p.x =
        random(
          0,
          canvasWidth
        );
    }

    line(
      p.x,
      p.y,
      p.x - 2,
      p.y + 18,
      "#67e8f9",
      p.size,
      p.alpha *
      state.novaIntensity *
      0.45
    );
  });
}


/* =========================================================
   NOVA 11 — GRID
   ========================================================= */

function drawGrid(t) {

  clearNova(0.20);

  const spacing = 45;

  const offset =
    (t * 0.03 * state.novaSpeed) %
    spacing;

  for (
    let x = -spacing;
    x < canvasWidth + spacing;
    x += spacing
  ) {

    line(
      x + offset,
      0,
      x + offset,
      canvasHeight,
      "#67e8f9",
      1,
      0.12 * state.novaIntensity
    );
  }

  for (
    let y = -spacing;
    y < canvasHeight + spacing;
    y += spacing
  ) {

    line(
      0,
      y + offset,
      canvasWidth,
      y + offset,
      "#8b5cf6",
      1,
      0.12 * state.novaIntensity
    );
  }
}


/* =========================================================
   NOVA 12 — SPIRAL
   ========================================================= */

function drawSpiral(t) {

  clearNova(0.13);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  ctx.beginPath();

  for (
    let i = 0;
    i < 1000;
    i += 3
  ) {

    const angle =
      i * 0.055 +
      t * 0.001 *
      state.novaSpeed;

    const radius =
      i * 0.28;

    const x =
      cx +
      Math.cos(angle) *
      radius;

    const y =
      cy +
      Math.sin(angle) *
      radius;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.strokeStyle =
    "#67e8f9";

  ctx.globalAlpha =
    0.35 *
    state.novaIntensity;

  ctx.lineWidth = 2;

  ctx.stroke();

  ctx.globalAlpha = 1;
}


/* =========================================================
   NOVA 13 — ORBIT
   ========================================================= */

function drawOrbit(t) {

  clearNova(0.16);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  for (
    let ring = 0;
    ring < 6;
    ring++
  ) {

    const radius =
      70 + ring * 60;

    ctx.beginPath();

    ctx.ellipse(
      cx,
      cy,
      radius,
      radius * 0.45,
      ring * 0.5,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      ring % 2
        ? "#8b5cf6"
        : "#67e8f9";

    ctx.globalAlpha =
      0.18 *
      state.novaIntensity;

    ctx.stroke();

    const angle =
      t * 0.001 *
      state.novaSpeed +
      ring;

    const x =
      cx +
      Math.cos(angle) *
      radius;

    const y =
      cy +
      Math.sin(angle) *
      radius *
      0.45;

    circle(
      x,
      y,
      4,
      "#ffffff",
      0.9
    );
  }

  ctx.globalAlpha = 1;
}


/* =========================================================
   NOVA 14 — PLASMA
   ========================================================= */

function drawPlasma(t) {

  clearNova(0.10);

  for (
    let i = 0;
    i < 12;
    i++
  ) {

    ctx.beginPath();

    for (
      let x = 0;
      x <= canvasWidth;
      x += 10
    ) {

      const y =
        canvasHeight / 2 +
        Math.sin(
          x * 0.008 +
          t * 0.001 +
          i
        ) *
        (
          60 +
          Math.sin(
            t * 0.0005 +
            i
          ) *
          35
        );

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      i % 2
        ? "#ec4899"
        : "#8b5cf6";

    ctx.globalAlpha =
      0.15 *
      state.novaIntensity;

    ctx.lineWidth =
      2 + i * 0.2;

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}


/* =========================================================
   NOVA 15 — DNA
   ========================================================= */

function drawDNA(t) {

  clearNova(0.15);

  const center =
    canvasWidth / 2;

  const height =
    canvasHeight * 0.9;

  const top =
    canvasHeight * 0.05;

  for (
    let y = top;
    y < top + height;
    y += 9
  ) {

    const phase =
      y * 0.025 +
      t * 0.001 *
      state.novaSpeed;

    const x1 =
      center +
      Math.sin(phase) *
      140;

    const x2 =
      center -
      Math.sin(phase) *
      140;

    circle(
      x1,
      y,
      2.2,
      "#67e8f9",
      0.7
    );

    circle(
      x2,
      y,
      2.2,
      "#ec4899",
      0.7
    );

    line(
      x1,
      y,
      x2,
      y,
      "#a78bfa",
      1,
      0.18
    );
  }
}


/* =========================================================
   NOVA 16 — SNOW
   ========================================================= */

function drawSnow(t) {

  clearNova(0.08);

  novaParticles.forEach(p => {

    p.y +=
      (0.5 + p.size * 0.7) *
      state.novaSpeed;

    p.x +=
      Math.sin(
        t * 0.001 +
        p.phase
      ) * 0.5;

    if (p.y > canvasHeight + 10) {

      p.y = -10;

      p.x =
        random(
          0,
          canvasWidth
        );
    }

    circle(
      p.x,
      p.y,
      p.size * 1.4,
      "#e0f2fe",
      p.alpha *
      state.novaIntensity *
      0.75
    );
  });
}


/* =========================================================
   NOVA 17 — LIGHTNING
   ========================================================= */

function drawLightning(t) {

  clearNova(0.18);

  if (
    Math.floor(t / 700) % 4 === 0
  ) {

    for (
      let branch = 0;
      branch < 4;
      branch++
    ) {

      ctx.beginPath();

      let x =
        random(
          canvasWidth * 0.2,
          canvasWidth * 0.8
        );

      let y = 0;

      ctx.moveTo(x, y);

      while (
        y < canvasHeight
      ) {

        x += random(-35, 35);

        y += random(20, 50);

        ctx.lineTo(x, y);
      }

      ctx.strokeStyle =
        "#a5f3fc";

      ctx.lineWidth =
        1.5;

      ctx.globalAlpha =
        0.65 *
        state.novaIntensity;

      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }
}


/* =========================================================
   NOVA 18 — GALAXY
   ========================================================= */

function drawGalaxy(t) {

  clearNova(0.12);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  glowCircle(
    cx,
    cy,
    160,
    "#8b5cf6",
    0.16
  );

  for (
    let i = 0;
    i < 900;
    i += 4
  ) {

    const radius =
      Math.sqrt(i) * 10;

    const angle =
      i * 0.09 +
      t * 0.0003;

    const spread =
      Math.sin(i * 0.8) * 30;

    const x =
      cx +
      Math.cos(angle) *
      (radius + spread);

    const y =
      cy +
      Math.sin(angle) *
      (radius + spread) *
      0.42;

    circle(
      x,
      y,
      1.3,
      i % 2
        ? "#67e8f9"
        : "#c4b5fd",
      0.55 *
      state.novaIntensity
    );
  }
}


/* =========================================================
   NOVA 19 — COMET
   ========================================================= */

function drawComet(t) {

  clearNova(0.12);

  const speed =
    0.3 *
    state.novaSpeed;

  for (
    let i = 0;
    i < novaParticles.length;
    i++
  ) {

    const p =
      novaParticles[i];

    p.x -=
      speed *
      (2 + p.size);

    p.y +=
      speed *
      0.25;

    if (
      p.x < -100 ||
      p.y > canvasHeight + 100
    ) {

      p.x =
        canvasWidth +
        random(0, 200);

      p.y =
        random(0, canvasHeight);
    }

    line(
      p.x,
      p.y,
      p.x + 35,
      p.y - 10,
      "#67e8f9",
      p.size,
      0.35 *
      state.novaIntensity
    );

    circle(
      p.x,
      p.y,
      p.size * 1.5,
      "#ffffff",
      p.alpha
    );
  }
}


/* =========================================================
   NOVA 20 — QUANTUM
   ========================================================= */

function drawQuantum(t) {

  clearNova(0.14);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  for (
    let i = 0;
    i < 120;
    i++
  ) {

    const phase =
      i * 0.31 +
      t * 0.002 *
      state.novaSpeed;

    const radius =
      80 +
      Math.sin(
        phase * 1.7
      ) *
      150 +
      i;

    const x =
      cx +
      Math.cos(phase) *
      radius;

    const y =
      cy +
      Math.sin(phase * 1.3) *
      radius *
      0.55;

    circle(
      x,
      y,
      1.5,
      i % 2
        ? "#67e8f9"
        : "#c084fc",
      0.45 *
      state.novaIntensity
    );
  }
}


/* =========================================================
   NOVA 21 — METEOR STORM
   ========================================================= */

function drawMeteor(t) {

  clearNova(0.15);

  novaParticles.forEach(p => {

    p.x +=
      (5 + p.size * 2) *
      state.novaSpeed;

    p.y +=
      (2 + p.size) *
      state.novaSpeed;

    if (
      p.x > canvasWidth + 100 ||
      p.y > canvasHeight + 100
    ) {

      p.x =
        random(-300, 0);

      p.y =
        random(0, canvasHeight * 0.7);
    }

    line(
      p.x,
      p.y,
      p.x - 55,
      p.y - 25,
      "#c4b5fd",
      p.size,
      0.45 *
      state.novaIntensity
    );

    circle(
      p.x,
      p.y,
      p.size * 1.8,
      "#ffffff",
      0.8
    );
  });
}


/* =========================================================
   NOVA 22 — BLACK HOLE
   ========================================================= */

function drawBlackHole(t) {

  clearNova(0.10);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  glowCircle(
    cx,
    cy,
    220,
    "#8b5cf6",
    0.12
  );

  for (
    let ring = 0;
    ring < 10;
    ring++
  ) {

    ctx.beginPath();

    ctx.ellipse(
      cx,
      cy,
      70 + ring * 22,
      25 + ring * 8,
      t * 0.0003 + ring * 0.2,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      ring % 2
        ? "#8b5cf6"
        : "#67e8f9";

    ctx.globalAlpha =
      0.18 *
      state.novaIntensity;

    ctx.stroke();
  }

  circle(
    cx,
    cy,
    55,
    "#02030a",
    1
  );

  ctx.globalAlpha = 1;
}


/* =========================================================
   NOVA 23 — SOLAR FLARE
   ========================================================= */

function drawSolar(t) {

  clearNova(0.11);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  const radius =
    85 +
    Math.sin(
      t * 0.002
    ) * 12;

  glowCircle(
    cx,
    cy,
    260,
    "#fbbf24",
    0.14
  );

  circle(
    cx,
    cy,
    radius,
    "#fbbf24",
    0.85
  );

  for (
    let i = 0;
    i < 35;
    i++
  ) {

    const angle =
      i * 0.7 +
      t * 0.001;

    const length =
      110 +
      Math.sin(
        t * 0.003 +
        i
      ) *
      50;

    line(
      cx +
        Math.cos(angle) *
        radius,

      cy +
        Math.sin(angle) *
        radius,

      cx +
        Math.cos(angle) *
        (radius + length),

      cy +
        Math.sin(angle) *
        (radius + length),

      "#fde68a",
      2,
      0.35 *
      state.novaIntensity
    );
  }
}


/* =========================================================
   NOVA 24 — DIGITAL OCEAN
   ========================================================= */

function drawDigitalOcean(t) {

  clearNova(0.13);

  const horizon =
    canvasHeight * 0.42;

  for (
    let y = horizon;
    y < canvasHeight;
    y += 22
  ) {

    const depth =
      (y - horizon) /
      (canvasHeight - horizon);

    ctx.beginPath();

    for (
      let x = 0;
      x <= canvasWidth;
      x += 10
    ) {

      const yy =
        y +
        Math.sin(
          x * 0.012 +
          t * 0.002 +
          y * 0.01
        ) *
        (5 + depth * 20);

      if (x === 0) {
        ctx.moveTo(x, yy);
      } else {
        ctx.lineTo(x, yy);
      }
    }

    ctx.strokeStyle =
      "#67e8f9";

    ctx.globalAlpha =
      0.16 *
      state.novaIntensity *
      (1 - depth * 0.5);

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}


/* =========================================================
   NOVA 25 — PARTICLE RAIN
   ========================================================= */

function drawParticleRain(t) {

  clearNova(0.12);

  novaParticles.forEach(p => {

    p.y +=
      (1 + p.size * 1.8) *
      state.novaSpeed;

    p.x +=
      Math.sin(
        t * 0.001 +
        p.phase
      ) * 0.4;

    if (p.y > canvasHeight + 10) {

      p.y = -10;

      p.x =
        random(
          0,
          canvasWidth
        );
    }

    circle(
      p.x,
      p.y,
      p.size,
      "#67e8f9",
      p.alpha *
      state.novaIntensity
    );
  });
}


/* =========================================================
   NOVA 26 — CRYSTAL
   ========================================================= */

function drawCrystal(t) {

  clearNova(0.13);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  for (
    let i = 0;
    i < 18;
    i++
  ) {

    const angle =
      i * Math.PI / 9 +
      t * 0.0003;

    const radius =
      80 +
      Math.sin(
        t * 0.002 +
        i
      ) *
      50;

    const x =
      cx +
      Math.cos(angle) *
      radius;

    const y =
      cy +
      Math.sin(angle) *
      radius;

    ctx.beginPath();

    ctx.moveTo(x, y - 18);
    ctx.lineTo(x + 13, y);
    ctx.lineTo(x, y + 18);
    ctx.lineTo(x - 13, y);
    ctx.closePath();

    ctx.strokeStyle =
      i % 2
        ? "#67e8f9"
        : "#c084fc";

    ctx.globalAlpha =
      0.3 *
      state.novaIntensity;

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}


/* =========================================================
   NOVA 27 — FRACTAL
   ========================================================= */

function drawFractal(t) {

  clearNova(0.13);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  function branch(
    x,
    y,
    length,
    angle,
    depth
  ) {

    if (depth <= 0) return;

    const x2 =
      x +
      Math.cos(angle) *
      length;

    const y2 =
      y +
      Math.sin(angle) *
      length;

    line(
      x,
      y,
      x2,
      y2,
      depth % 2
        ? "#67e8f9"
        : "#8b5cf6",
      Math.max(1, depth * 0.5),
      0.22 *
      state.novaIntensity
    );

    branch(
      x2,
      y2,
      length * 0.68,
      angle - 0.45 +
        Math.sin(t * 0.001) * 0.1,
      depth - 1
    );

    branch(
      x2,
      y2,
      length * 0.68,
      angle + 0.45 +
        Math.cos(t * 0.001) * 0.1,
      depth - 1
    );
  }

  branch(
    cx,
    canvasHeight,
    Math.min(
      canvasWidth,
      canvasHeight
    ) * 0.22,
    -Math.PI / 2,
    8
  );
}


/* =========================================================
   NOVA 28 — GRAVITY
   ========================================================= */

function drawGravity(t) {

  clearNova(0.12);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  novaParticles.forEach(p => {

    const dx =
      cx - p.x;

    const dy =
      cy - p.y;

    const distance =
      Math.max(
        40,
        Math.hypot(dx, dy)
      );

    const force =
      0.08 /
      distance *
      30 *
      state.novaSpeed;

    p.vx +=
      dx * force * 0.001;

    p.vy +=
      dy * force * 0.001;

    p.vx *= 0.998;
    p.vy *= 0.998;

    p.x += p.vx;
    p.y += p.vy;

    if (
      p.x < -100 ||
      p.x > canvasWidth + 100 ||
      p.y < -100 ||
      p.y > canvasHeight + 100
    ) {

      p.x =
        random(0, canvasWidth);

      p.y =
        random(0, canvasHeight);

      p.vx =
        random(-0.5, 0.5);

      p.vy =
        random(-0.5, 0.5);
    }

    circle(
      p.x,
      p.y,
      p.size,
      "#c4b5fd",
      p.alpha *
      state.novaIntensity
    );
  });

  glowCircle(
    cx,
    cy,
    130,
    "#8b5cf6",
    0.12
  );
}


/* =========================================================
   NOVA 29 — ELECTRIC
   ========================================================= */

function drawElectric(t) {

  clearNova(0.18);

  const rows =
    10;

  for (
    let row = 0;
    row < rows;
    row++
  ) {

    ctx.beginPath();

    let x = 0;

    const base =
      canvasHeight *
      (row + 1) /
      (rows + 1);

    ctx.moveTo(
      x,
      base
    );

    while (
      x < canvasWidth
    ) {

      x +=
        random(15, 45);

      const y =
        base +
        random(-25, 25);

      ctx.lineTo(
        x,
        y
      );
    }

    ctx.strokeStyle =
      row % 2
        ? "#67e8f9"
        : "#a78bfa";

    ctx.globalAlpha =
      0.24 *
      state.novaIntensity;

    ctx.lineWidth = 1.5;

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}


/* =========================================================
   NOVA 30 — CYBER TUNNEL
   ========================================================= */

function drawCyberTunnel(t) {

  clearNova(0.18);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  for (
    let i = 0;
    i < 25;
    i++
  ) {

    const z =
      (
        (i * 120 +
          t *
          0.25 *
          state.novaSpeed)
        % 1800
      );

    const scale =
      400 / (z + 1);

    const size =
      30 * scale;

    ctx.strokeStyle =
      i % 2
        ? "#67e8f9"
        : "#8b5cf6";

    ctx.globalAlpha =
      0.18 *
      state.novaIntensity;

    ctx.strokeRect(
      cx - size,
      cy - size,
      size * 2,
      size * 2
    );
  }

  ctx.globalAlpha = 1;
}


/* =========================================================
   NOVA 31 — MAGIC DUST
   ========================================================= */

function drawMagicDust(t) {

  clearNova(0.10);

  novaParticles.forEach(p => {

    p.x +=
      Math.sin(
        t * 0.001 +
        p.phase
      ) * 0.5;

    p.y +=
      Math.cos(
        t * 0.0012 +
        p.phase
      ) * 0.35;

    circle(
      p.x,
      p.y,
      p.size,
      p.hue % 2
        ? "#f0abfc"
        : "#67e8f9",
      p.alpha *
      state.novaIntensity *
      0.8
    );
  });
}


/* =========================================================
   NOVA 32 — STELLAR BURST
   ========================================================= */

function drawStellarBurst(t) {

  clearNova(0.16);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  const rays = 100;

  for (
    let i = 0;
    i < rays;
    i++
  ) {

    const angle =
      i / rays *
      Math.PI *
      2;

    const pulse =
      (
        Math.sin(
          t * 0.003 +
          i
        ) + 1
      ) / 2;

    const inner =
      25 +
      pulse * 30;

    const outer =
      120 +
      pulse * 320;

    line(
      cx +
        Math.cos(angle) *
        inner,

      cy +
        Math.sin(angle) *
        inner,

      cx +
        Math.cos(angle) *
        outer,

      cy +
        Math.sin(angle) *
        outer,

      "#fef3c7",
      1,
      0.22 *
      state.novaIntensity *
      pulse
    );
  }

  glowCircle(
    cx,
    cy,
    100,
    "#fbbf24",
    0.14
  );
}


/* =========================================================
   NOVA 33 — MOONLIGHT
   ========================================================= */

function drawMoonlight(t) {

  clearNova(0.12);

  const cx =
    canvasWidth * 0.5;

  const cy =
    canvasHeight * 0.38;

  glowCircle(
    cx,
    cy,
    170,
    "#c4b5fd",
    0.10
  );

  circle(
    cx,
    cy,
    65,
    "#e0e7ff",
    0.8
  );

  circle(
    cx - 20,
    cy - 12,
    8,
    "#c7d2fe",
    0.45
  );

  circle(
    cx + 18,
    cy + 17,
    12,
    "#c7d2fe",
    0.35
  );

  for (
    let i = 0;
    i < 7;
    i++
  ) {

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      100 + i * 35 +
        Math.sin(
          t * 0.001
        ) * 8,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      "#c4b5fd";

    ctx.globalAlpha =
      0.08 *
      state.novaIntensity;

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}


/* =========================================================
   NOVA 34 — DIMENSION
   ========================================================= */

function drawDimension(t) {

  clearNova(0.15);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  for (
    let i = 0;
    i < 12;
    i++
  ) {

    const size =
      50 +
      i * 30 +
      Math.sin(
        t * 0.001 +
        i
      ) * 25;

    ctx.save();

    ctx.translate(
      cx,
      cy
    );

    ctx.rotate(
      t * 0.0003 +
      i * 0.15
    );

    ctx.strokeStyle =
      i % 2
        ? "#8b5cf6"
        : "#67e8f9";

    ctx.globalAlpha =
      0.13 *
      state.novaIntensity;

    ctx.strokeRect(
      -size,
      -size,
      size * 2,
      size * 2
    );

    ctx.restore();
  }

  ctx.globalAlpha = 1;
}


/* =========================================================
   NOVA 35 — TECH PULSE
   ========================================================= */

function drawTechPulse(t) {

  clearNova(0.17);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  const grid =
    70;

  const pulse =
    (
      Math.sin(
        t * 0.003
      ) + 1
    ) / 2;

  for (
    let x = 0;
    x < canvasWidth;
    x += grid
  ) {

    for (
      let y = 0;
      y < canvasHeight;
      y += grid
    ) {

      const distance =
        Math.hypot(
          x - cx,
          y - cy
        );

      const glow =
        Math.max(
          0,
          1 -
          (
            distance /
            Math.max(
              canvasWidth,
              canvasHeight
            )
          )
        );

      circle(
        x,
        y,
        2 +
          pulse *
          glow *
          5,
        "#67e8f9",
        0.35 *
        glow *
        state.novaIntensity
      );
    }
  }
}


/* =========================================================
   NOVA 36 — METEOR GALAXY
   ========================================================= */

function drawMeteorGalaxy(t) {

  clearNova(0.12);

  drawGalaxy(t);

  for (
    let i = 0;
    i < 18;
    i++
  ) {

    const angle =
      i * 0.7 +
      t * 0.0007;

    const radius =
      150 +
      (i * 90) %
      500;

    const x =
      canvasWidth / 2 +
      Math.cos(angle) *
      radius;

    const y =
      canvasHeight / 2 +
      Math.sin(angle) *
      radius *
      0.5;

    line(
      x,
      y,
      x -
        Math.cos(angle) * 55,
      y -
        Math.sin(angle) * 30,
      "#ffffff",
      1.5,
      0.35 *
      state.novaIntensity
    );
  }
}


/* =========================================================
   NOVA 37 — RAINBOW FLOW
   ========================================================= */

function drawRainbowFlow(t) {

  clearNova(0.11);

  for (
    let i = 0;
    i < 12;
    i++
  ) {

    ctx.beginPath();

    for (
      let x = 0;
      x <= canvasWidth;
      x += 8
    ) {

      const y =
        canvasHeight / 2 +
        Math.sin(
          x * 0.007 +
          t * 0.001 +
          i * 0.4
        ) *
        (30 + i * 8);

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      `hsl(${i * 30 + t * 0.03}, 90%, 65%)`;

    ctx.globalAlpha =
      0.15 *
      state.novaIntensity;

    ctx.lineWidth = 3;

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}


/* =========================================================
   NOVA 38 — ENERGY CORE
   ========================================================= */

function drawEnergyCore(t) {

  clearNova(0.12);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  const pulse =
    (
      Math.sin(
        t * 0.003
      ) + 1
    ) / 2;

  glowCircle(
    cx,
    cy,
    240 + pulse * 100,
    "#67e8f9",
    0.12
  );

  circle(
    cx,
    cy,
    45 + pulse * 15,
    "#67e8f9",
    0.8
  );

  for (
    let i = 0;
    i < 8;
    i++
  ) {

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      80 + i * 35,
      t * 0.0005 +
        i,
      t * 0.0005 +
        i +
        Math.PI * 1.5
    );

    ctx.strokeStyle =
      i % 2
        ? "#8b5cf6"
        : "#67e8f9";

    ctx.globalAlpha =
      0.20 *
      state.novaIntensity;

    ctx.lineWidth =
      2;

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}


/* =========================================================
   NOVA 39 — TIME WARP
   ========================================================= */

function drawTimeWarp(t) {

  clearNova(0.17);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  for (
    let i = 0;
    i < 100;
    i++
  ) {

    const angle =
      i * 0.4 +
      t * 0.002;

    const radius =
      (
        i * 20 +
        t * 0.25 *
        state.novaSpeed
      ) %
      800;

    const x =
      cx +
      Math.cos(angle) *
      radius;

    const y =
      cy +
      Math.sin(angle) *
      radius;

    line(
      x,
      y,
      x -
        Math.cos(angle) * 35,
      y -
        Math.sin(angle) * 35,
      "#67e8f9",
      1.5,
      0.22 *
      state.novaIntensity
    );
  }
}


/* =========================================================
   NOVA 40 — INFINITY
   ========================================================= */

function drawInfinity(t) {

  clearNova(0.13);

  const cx =
    canvasWidth / 2;

  const cy =
    canvasHeight / 2;

  ctx.beginPath();

  for (
    let i = 0;
    i <= 700;
    i += 2
  ) {

    const u =
      i / 700 *
      Math.PI *
      4;

    const scale =
      Math.min(
        canvasWidth,
        canvasHeight
      ) * 0.25;

    const x =
      cx +
      Math.sin(u) *
      scale;

    const y =
      cy +
      Math.sin(u * 2) *
      scale *
      0.5;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.strokeStyle =
    "#67e8f9";

  ctx.globalAlpha =
    0.45 *
    state.novaIntensity;

  ctx.lineWidth = 3;

  ctx.stroke();

  ctx.globalAlpha = 1;
}


/* =========================================================
   MAPA DE ANIMACIONES
   ========================================================= */

const novaModes = {

  cosmic: drawCosmic,
  aurora: drawAurora,
  pulse: drawPulse,
  matrix: drawMatrix,
  nebula: drawNebula,
  waves: drawWaves,
  starfield: drawStarfield,
  vortex: drawVortex,
  firefly: drawFirefly,
  rain: drawRain,
  grid: drawGrid,
  spiral: drawSpiral,
  orbit: drawOrbit,
  plasma: drawPlasma,
  dna: drawDNA,
  snow: drawSnow,
  lightning: drawLightning,
  galaxy: drawGalaxy,
  comet: drawComet,
  quantum: drawQuantum,

  meteor: drawMeteor,
  blackhole: drawBlackHole,
  solar: drawSolar,
  digitalOcean: drawDigitalOcean,
  particleRain: drawParticleRain,
  crystal: drawCrystal,
  fractal: drawFractal,
  gravity: drawGravity,
  electric: drawElectric,
  cyberTunnel: drawCyberTunnel,
  magicDust: drawMagicDust,
  stellarBurst: drawStellarBurst,
  moonlight: drawMoonlight,
  dimension: drawDimension,
  techPulse: drawTechPulse,
  meteorGalaxy: drawMeteorGalaxy,
  rainbowFlow: drawRainbowFlow,
  energyCore: drawEnergyCore,
  timeWarp: drawTimeWarp,
  infinity: drawInfinity
};


/* =========================================================
   NOVA MODE
   ========================================================= */

function setNovaMode(mode) {

  if (!novaModes[mode]) return;

  state.novaMode =
    mode;

  $$(".novaMode").forEach(
    button => {

      button.classList.toggle(
        "active",
        button.dataset.mode === mode
      );
    }
  );

  const button =
    $(`.novaMode[data-mode="${mode}"]`);

  const label =
    button
      ? button.textContent.trim()
      : mode;

  if ($("#novaModeName")) {
    $("#novaModeName").textContent =
      label;
  }

  saveState();
}


/* =========================================================
   NOVA AUTO
   ========================================================= */

function toggleNovaAuto() {

  state.novaAuto =
    !state.novaAuto;

  const button =
    $("#novaAutoBtn");

  clearInterval(
    novaAutoTimer
  );

  if (state.novaAuto) {

    button.textContent =
      "■ Detener";

    novaAutoTimer =
      setInterval(
        nextNovaMode,
        7000
      );

    showToast(
      "NOVA AUTO activado."
    );

  } else {

    button.textContent =
      "▶ Activar";

    showToast(
      "NOVA AUTO detenido."
    );
  }

  saveState();
}


function nextNovaMode() {

  const names =
    Object.keys(novaModes);

  const current =
    names.indexOf(
      state.novaMode
    );

  const next =
    names[
      (current + 1) %
      names.length
    ];

  setNovaMode(next);
}


/* =========================================================
   NOVA ANIMATION LOOP
   ========================================================= */

function animateNova(now) {

  if (!ctx) return;

  const delta =
    now -
    lastFrame;

  lastFrame =
    now;

  novaTime =
    now;

  if (delta > 0) {

    const instantFps =
      1000 / delta;

    fpsValue =
      fpsValue * 0.9 +
      instantFps * 0.1;
  }

  if ($("#fps")) {

    $("#fps").textContent =
      Math.round(
        clamp(
          fpsValue,
          1,
          120
        )
      );
  }


  targetMouseX *= 0.92;
  targetMouseY *= 0.92;

  mouseX +=
    (targetMouseX - mouseX) *
    0.08;

  mouseY +=
    (targetMouseY - mouseY) *
    0.08;


  if (
    state.motion &&
    !document.hidden
  ) {

    const renderer =
      novaModes[state.novaMode] ||
      drawCosmic;

    try {

      renderer(
        now
      );

    } catch (error) {

      console.warn(
        "Error en NOVA:",
        error
      );

      try {
        drawCosmic(now);
      } catch {}
    }

  } else {

    clearNova(0.02);
  }

  requestAnimationFrame(
    animateNova
  );
}


/* =========================================================
   NOVA CONTROLS
   ========================================================= */

function bindNovaControls() {

  $$(".novaMode").forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          setNovaMode(
            button.dataset.mode
          );
        }
      );
    }
  );


  $("#novaIntensity")?.addEventListener(
    "input",
    event => {

      state.novaIntensity =
        Number(
          event.target.value
        );

      saveState();
    }
  );


  $("#novaSpeed")?.addEventListener(
    "input",
    event => {

      state.novaSpeed =
        Number(
          event.target.value
        );

      saveState();
    }
  );


  $("#novaParticles")?.addEventListener(
    "input",
    event => {

      state.novaParticles =
        Number(
          event.target.value
        );

      createNovaParticles();

      saveState();
    }
  );


  $("#performanceSelect")?.addEventListener(
    "change",
    event => {

      state.performance =
        event.target.value;

      createNovaParticles();

      saveState();
    }
  );


  $("#novaAutoBtn")?.addEventListener(
    "click",
    toggleNovaAuto
  );
}


/* =========================================================
   MOUSE
   ========================================================= */

function bindMouse() {

  window.addEventListener(
    "pointermove",
    event => {

      targetMouseX =
        event.clientX;

      targetMouseY =
        event.clientY;

      const cursor =
        $("#novaCursor");

      if (cursor) {

        cursor.style.left =
          `${event.clientX}px`;

        cursor.style.top =
          `${event.clientY}px`;
      }
    },
    {
      passive: true
    }
  );
}


/* =========================================================
   BOTONES GENERALES
   ========================================================= */

function bindGeneralButtons() {

  $("#themeBtn")?.addEventListener(
    "click",
    toggleTheme
  );

  $("#motionBtn")?.addEventListener(
    "click",
    toggleMotion
  );

  $("#focusBtn")?.addEventListener(
    "click",
    toggleFocus
  );


  $("#exploreBtn")?.addEventListener(
    "click",
    () => {

      document.querySelector(
        ".toolsSection"
      )?.scrollIntoView({
        behavior: "smooth"
      });
    }
  );


  $("#novaBtn")?.addEventListener(
    "click",
    () => {

      document.querySelector(
        "#novaSection"
      )?.scrollIntoView({
        behavior: "smooth"
      });
    }
  );


  $("#clearRecentBtn")?.addEventListener(
    "click",
    () => {

      state.recent = [];

      saveState();

      renderQuickTools();

      showToast(
        "Historial reciente limpiado."
      );
    }
  );


  $("#exportBtn")?.addEventListener(
    "click",
    exportData
  );


  $("#importBtn")?.addEventListener(
    "click",
    () => {
      $("#importFile")?.click();
    }
  );


  $("#importFile")?.addEventListener(
    "change",
    event => {

      const file =
        event.target.files?.[0];

      if (file) {
        importData(file);
      }

      event.target.value = "";
    }
  );
}


/* =========================================================
   EVENTOS DINÁMICOS
   ========================================================= */

function bindDynamicEvents() {

  document.addEventListener(
    "click",
    event => {

      const openButton =
        event.target.closest(
          "[data-open]"
        );

      if (openButton) {

        const id =
          openButton.dataset.open;

        openTool(id);

        return;
      }


      const favoriteButton =
        event.target.closest(
          "[data-favorite]"
        );

      if (favoriteButton) {

        toggleFavorite(
          favoriteButton.dataset.favorite
        );

        return;
      }


      const closeToolButton =
        event.target.closest(
          "[data-close-tool]"
        );

      if (closeToolButton) {

        closeTool();

        return;
      }
    }
  );


  $("#closeTool")?.addEventListener(
    "click",
    closeTool
  );


  $(".toolPanelBackdrop")?.addEventListener(
    "click",
    closeTool
  );


  $("#toolSearch")?.addEventListener(
    "input",
    renderTools
  );


  $$(".categoryBtn").forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          activeCategory =
            button.dataset.category;

          $$(".categoryBtn").forEach(
            item => {
              item.classList.toggle(
                "active",
                item === button
              );
            }
          );

          renderTools();
        }
      );
    }
  );
}


/* =========================================================
   MODAL
   ========================================================= */

function closeModal() {

  $("#modal")?.classList.remove(
    "open"
  );

  $("#modal")?.setAttribute(
    "aria-hidden",
    "true"
  );
}


function bindModal() {

  $$("[data-close-modal]").forEach(
    element => {

      element.addEventListener(
        "click",
        closeModal
      );
    }
  );
}


/* =========================================================
   ESCAPE
   ========================================================= */

function bindEscape() {

  document.addEventListener(
    "keydown",
    event => {

      if (event.key !== "Escape") {
        return;
      }

      closeTool();
      closeModal();
    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {

        event.preventDefault();

        $("#toolSearch")?.focus();
      }
    }
  );
}


/* =========================================================
   CONEXIÓN
   ========================================================= */

function updateConnectionStatus() {

  const element =
    $("#connectionStatus");

  if (!element) return;

  if (navigator.onLine) {

    element.textContent =
      "● Conectado";

    element.style.color =
      "var(--success)";

  } else {

    element.textContent =
      "● Sin conexión";

    element.style.color =
      "var(--warning)";
  }
}


/* =========================================================
   SERVICE WORKER
   ========================================================= */

async function registerServiceWorker() {

  if (
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  try {

    const registration =
      await navigator.serviceWorker.register(
        "./sw.js"
      );

    registration.update();

  } catch (error) {

    console.warn(
      "Service Worker no disponible:",
      error
    );
  }
}


/* =========================================================
   UTILIDADES
   ========================================================= */

function formatNumber(
  number,
  decimals = 6
) {

  if (!Number.isFinite(number)) {
    return "—";
  }

  return Number(
    number.toFixed(decimals)
  ).toLocaleString(
    "es-PE"
  );
}


function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   APLICAR CONTROLES
   ========================================================= */

function applyNovaSettings() {

  if ($("#novaIntensity")) {

    $("#novaIntensity").value =
      state.novaIntensity;
  }

  if ($("#novaSpeed")) {

    $("#novaSpeed").value =
      state.novaSpeed;
  }

  if ($("#novaParticles")) {

    $("#novaParticles").value =
      state.novaParticles;
  }

  if ($("#performanceSelect")) {

    $("#performanceSelect").value =
      state.performance;
  }

  setNovaMode(
    state.novaMode
  );

  if (
    state.novaAuto
  ) {

    $("#novaAutoBtn").textContent =
      "■ Detener";

    clearInterval(
      novaAutoTimer
    );

    novaAutoTimer =
      setInterval(
        nextNovaMode,
        7000
      );
  }
}


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

function init() {

  try {

    applyTheme();

    applyMotion();

    applyFocus();

    updateStats();

    renderTools();

    renderQuickTools();

    bindGeneralButtons();

    bindDynamicEvents();

    bindModal();

    bindEscape();

    bindNovaControls();

    bindMouse();

    updateConnectionStatus();

    window.addEventListener(
      "online",
      updateConnectionStatus
    );

    window.addEventListener(
      "offline",
      updateConnectionStatus
    );


    resizeCanvas();

    window.addEventListener(
      "resize",
      resizeCanvas
    );


    applyNovaSettings();

    requestAnimationFrame(
      animateNova
    );


    registerServiceWorker();


    if (
      state.timer.running &&
      state.timer.endAt > Date.now()
    ) {

      timerInterval =
        setInterval(
          updateTimerTick,
          250
        );
    }

    else if (
      state.timer.running
    ) {

      state.timer.running = false;

      state.timer.remaining = 0;

      saveState();
    }


  } catch (error) {

    console.error(
      "Error al iniciar ÚtilHub V20:",
      error
    );
  }
}


/* =========================================================
   START
   ========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

} else {

  init();
}
