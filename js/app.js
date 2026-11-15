


// ======================================
// 1. VARIABLES Y ALMACENAMIENTO TEMPORAL
// ======================================

let mediciones = JSON.parse(
    localStorage.getItem("mediciones")
) || [];
// ======================================
// 2. SELECCIONAR ELEMENTOS HTML
// ======================================

const formulario = document.getElementById("glucose-form");
console.log("Formulario encontrado:", formulario);
const campoGlucosa = document.getElementById("glucose-value");

const campoFecha = document.getElementById("glucose-date");

const campoHora = document.getElementById("glucose-time");

const campoContexto = document.getElementById("glucose-context");


const filtroContexto = document.getElementById("filter-context");

const filtroFechaInicio = document.getElementById("filter-start");

const filtroFechaFin = document.getElementById("filter-end");

const botonLimpiar = document.getElementById("clear-filters");

// ======================================
// 3. ESCUCHAR EL ENVÍO DEL FORMULARIO
// ======================================

formulario.addEventListener("submit", function(event) {

    console.log("Se presionó el botón Guardar");

    event.preventDefault();

    // Capturar los datos
    const glucosa = Number(campoGlucosa.value);

    const fecha = campoFecha.value;

    const hora = campoHora.value;

    const contexto = campoContexto.value;


    // Validación básica
    if (!Number.isFinite(glucosa) || glucosa <= 0) {
        alert("Introduce una medición válida.");
        return;
    }


    // Crear un objeto
    const nuevaMedicion = {
        glucosa: glucosa,
        fecha: fecha,
        hora: hora,
        contexto: contexto
    };



    // Agregar al array
    mediciones.push(nuevaMedicion);

    // Guardar permanentemente en el navegador
    guardarMediciones();

    // Actualizar dashboard
    actualizarVista();



    // Limpiar formulario
    formulario.reset();

    alert("Medición registrada correctamente.");

});


// ======================================
// 4. ACTUALIZAR INDICADORES
// ======================================


function actualizarDashboard() {

    const datos = obtenerMedicionesFiltradas();

    if (datos.length === 0) {

        document.getElementById("last-glucose").textContent = "--";

        document.getElementById("average-glucose").textContent = "--";

        document.getElementById("min-glucose").textContent = "--";

        document.getElementById("max-glucose").textContent = "--";

        document.getElementById("std-glucose").textContent = "--";

        document.getElementById("measurement-count").textContent = "0";

        return;
    }

    const valores = datos.map(m => m.glucosa);

    const promedio = calcularPromedio(valores);

    const minimo = Math.min(...valores);

    const maximo = Math.max(...valores);

    const desviacion = calcularDesviacion(valores);

    const ordenadas = [...datos].sort((a, b) =>
        new Date(`${a.fecha}T${a.hora}`) -
        new Date(`${b.fecha}T${b.hora}`)
    );

    const ultimaMedicion = ordenadas[ordenadas.length - 1];

    document.getElementById("last-glucose").textContent =
        ultimaMedicion.glucosa + " mg/dL";

    document.getElementById("average-glucose").textContent =
        promedio.toFixed(1) + " mg/dL";

    document.getElementById("min-glucose").textContent =
        minimo + " mg/dL";

    document.getElementById("max-glucose").textContent =
        maximo + " mg/dL";

    document.getElementById("std-glucose").textContent =
        desviacion.toFixed(1) + " mg/dL";

    document.getElementById("measurement-count").textContent =
        datos.length;

}



// ======================================
// 5. CALCULAR PROMEDIO
// ======================================

function calcularPromedio(valores) {

    const suma = valores.reduce((total, valor) => total + valor, 0);

    return suma / valores.length;

}

function calcularDesviacion(valores) {

    const promedio = calcularPromedio(valores);

    const sumaCuadrados = valores.reduce((total, valor) => {
        return total + Math.pow(valor - promedio, 2);
    }, 0);

    return Math.sqrt(sumaCuadrados / valores.length);

}


// ======================================
// 6. ACTUALIZAR HISTORIAL
// ======================================


function actualizarHistorial() {

    const historial = document.getElementById("glucose-history");

    historial.innerHTML = "";

    const datos = obtenerMedicionesFiltradas();

    datos.forEach(function(medicion) {

        const indice = mediciones.indexOf(medicion);

        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${medicion.fecha} ${medicion.hora}</td>
            <td>${medicion.glucosa} mg/dL</td>
            <td>${medicion.contexto}</td>
            <td>
            <button
                class="edit-button"
                onclick="editarMedicion(${indice})">
                Editar
            </button>
            <button
                class="delete-button"
                onclick="eliminarMedicion(${indice})">
                Eliminar
        </button>
            </td>
        `;

        historial.appendChild(fila);

    });

}

function eliminarMedicion(indice) {

    const confirmar = confirm(
        "¿Estás seguro de eliminar esta medición?"
    );

    if (!confirmar) {
        return;
    }

    mediciones.splice(indice, 1);

    guardarMediciones();

    actualizarVista();

}

function editarMedicion(indice) {

    const medicion = mediciones[indice];

    const nuevoValor = prompt(
        "Introduce el nuevo valor de glucosa:",
        medicion.glucosa
    );

    if (nuevoValor === null) {
        return;
    }

    const glucosa = Number(nuevoValor);

    if (!Number.isFinite(glucosa) || glucosa <= 0) {
        alert("Introduce un valor válido.");
        return;
    }

    medicion.glucosa = glucosa;

    guardarMediciones();

    actualizarVista();

}

// ======================================
// 7. FILTRAR MEDICIONES
// ======================================

function obtenerMedicionesFiltradas() {

    const contexto = filtroContexto.value;

    const fechaInicio = filtroFechaInicio.value;

    const fechaFin = filtroFechaFin.value;

    const resultado = mediciones.filter(function(m) {

        // Filtrar contexto
        const coincideContexto =
            contexto === "Todos" ||
            m.contexto === contexto;

        // Filtrar fecha inicial
        const coincideInicio =
            !fechaInicio || m.fecha >= fechaInicio;

        // Filtrar fecha final
        const coincideFin =
            !fechaFin || m.fecha <= fechaFin;

        return coincideContexto &&
               coincideInicio &&
               coincideFin;

    });

    return resultado;
}
function guardarMediciones() {

    localStorage.setItem(
        "mediciones",
        JSON.stringify(mediciones)
    );

}


function actualizarGrafica() {

    // 1. Obtener mediciones filtradas
    const medicionesFiltradas = obtenerMedicionesFiltradas();

    // 2. Ordenar cronológicamente
    const medicionesOrdenadas = [...medicionesFiltradas].sort(
        (a, b) => {
            const fechaA = new Date(`${a.fecha}T${a.hora}`);
            const fechaB = new Date(`${b.fecha}T${b.hora}`);

            return fechaA - fechaB;
        }
    );

    // 3. Extraer fechas
    const fechas = medicionesOrdenadas.map(
        m => `${m.fecha} ${m.hora}`
    );

    // 4. Extraer valores
    const valores = medicionesOrdenadas.map(
        m => m.glucosa
    );

    // 5. Preparar serie de Plotly
    const serieGrafica = [{
    x: fechas,
    y: valores,
    type: "scatter",

    // Mostrar línea, puntos y etiquetas
    mode: "lines+markers+text",

    name: "Glucosa",

    // // Valores que aparecerán permanentemente
    // text: valores.map(valor => `${valor} mg/dL`),

    // Posición de las etiquetas
    // textposition: "top center",

    // // Estilo de las etiquetas
    // textfont: {
    //     size: 11,
    //     color: "#263445"
    // },

    line: {
        color: "#3478B8",
        width: 3
    },

    marker: {
        size: 4
    }
}];
const zonaObjetivo = [
    {
        type: "rect",
        xref: "paper",
        x0: 0,
        x1: 1,
        yref: "y",
        y0: 70,
        y1: 130,
        fillcolor: "rgba(34, 197, 94, 0.12)",
        line: {
            width: 0
        },
        layer: "below"
    }
];
    // 6. Configuración visual
    const layout = {

        title: "Tendencia de glucosa",

        xaxis: {
            title: "Fecha y hora"
        },

        yaxis: {
            title: "Glucosa (mg/dL)",
            rangemode: "tozero",
            dtick: 25
        },

        paper_bgcolor: "#FFFFFF",
        plot_bgcolor: "#FFFFFF",

        margin: {
            t: 50,
            r: 25,
            b: 60,
            l: 60
        },
        shapes: zonaObjetivo,
        autosize: true
    };

    // 7. Dibujar gráfica
    Plotly.react(
        "glucose-chart",
        serieGrafica,
        layout,
        { responsive: true }
    );

}


// Actualizar cuando cambie el contexto
filtroContexto.addEventListener("change", actualizarVista);

// Actualizar cuando cambien las fechas
filtroFechaInicio.addEventListener("change", actualizarVista);

filtroFechaFin.addEventListener("change", actualizarVista);


// Limpiar filtros
botonLimpiar.addEventListener("click", function() {

    filtroContexto.value = "Todos";

    filtroFechaInicio.value = "";

    filtroFechaFin.value = "";

    actualizarVista();

});


// Actualizar todos los componentes
function actualizarVista() {

    actualizarDashboard();

    actualizarHistorial();

    actualizarGrafica();

}


// Cargar información al iniciar la aplicación
actualizarVista();
