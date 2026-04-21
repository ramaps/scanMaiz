import * as THREE from 'three';

// --- CONFIGURACIÓN DE ESCENA ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 1, 6);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-3d').appendChild(renderer.domElement);

// --- GEOMETRÍA DEL MAÍZ ---
const cornShape = new THREE.Shape();
cornShape.moveTo(0, 1);
cornShape.bezierCurveTo(0.6, 1, 0.8, 0.6, 0.8, 0.2);
cornShape.bezierCurveTo(0.8, -0.4, 0.4, -1, 0, -1.1);
cornShape.bezierCurveTo(-0.4, -1, -0.8, -0.4, -0.8, 0.2);
cornShape.bezierCurveTo(-0.8, 0.6, -0.6, 1, 0, 1);

const geometry = new THREE.ExtrudeGeometry(cornShape, {
    depth: 0.4,
    bevelEnabled: true,
    bevelThickness: 0.15
});
geometry.center();

const material = new THREE.MeshPhysicalMaterial({
    color: 0xffaa00,
    emissive: 0xff3300,
    emissiveIntensity: 0.15,
    metalness: 0.2,
    roughness: 0.2,
    transmission: 0.5,
    transparent: true
});

const corn = new THREE.Mesh(geometry, material);
corn.scale.set(0.65, 0.65, 0.65);
scene.add(corn);

// NÚCLEO
const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
);
core.scale.set(1, 1.4, 0.5);
core.position.set(0, -0.6, 0.1);
corn.add(core);

// ILUMINACIÓN
const lightFront = new THREE.DirectionalLight(0xffffff, 3.5);
lightFront.position.set(0, 0, 5);
scene.add(lightFront);

const lightSide = new THREE.PointLight(0x00fbff, 10);
lightSide.position.set(-4, 2, 2);
scene.add(lightSide);

// ========== MANEJO DE ETIQUETAS SIN ROMPER LA TRANSICIÓN ==========
const etiquetas = [];
for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`t${i}`);
    if (el) etiquetas.push(el);
}
let hideTimeout = null;

function ocultarEtiquetasDrag() {
    // Añade una clase temporal que las oculta (no toca la clase .show)
    etiquetas.forEach(el => el.classList.add('drag-hide'));
}

function mostrarEtiquetasDrag() {
    // Quita la clase temporal y recuperan su visibilidad original
    etiquetas.forEach(el => el.classList.remove('drag-hide'));
}

// ========== SISTEMA DE ARRASTRE Y RETORNO ==========
let autoRotateY = 0;            // rotación automática infinita (solo Y)
let extraAngleY = 0;            // giro adicional por arrastre horizontal
let extraAngleX = 0;            // giro adicional por arrastre vertical

let isDragging = false;
let lastMouseX = 0, lastMouseY = 0;
const dragSensitivity = 0.012;   // sensibilidad del arrastre

// Retorno con duración fija
let isReturning = false;
let returnStartTime = 0;
let returnDuration = 2000;       // 2 segundos (cámbialo a tu gusto)
let startAngleY = 0, startAngleX = 0;

function getClientCoords(event) {
    if (event.touches) {
        return { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY };
    }
    return { clientX: event.clientX, clientY: event.clientY };
}

function onDragStart(event) {
    event.preventDefault();
    isDragging = true;
    isReturning = false;
    // Cancelar reaparición pendiente
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
    ocultarEtiquetasDrag();  // desaparecen las etiquetas (con clase .drag-hide)
    const coords = getClientCoords(event);
    lastMouseX = coords.clientX;
    lastMouseY = coords.clientY;
}

function onDragMove(event) {
    if (!isDragging) return;
    event.preventDefault();
    const coords = getClientCoords(event);
    const deltaX = (coords.clientX - lastMouseX) * dragSensitivity;
    const deltaY = (coords.clientY - lastMouseY) * dragSensitivity;
    
    extraAngleY += deltaX;
    extraAngleX += deltaY;
    
    lastMouseX = coords.clientX;
    lastMouseY = coords.clientY;
}

function onDragEnd(event) {
    if (isDragging) {
        isDragging = false;
        // Iniciar retorno a la posición original
        isReturning = true;
        returnStartTime = performance.now();
        startAngleY = extraAngleY;
        startAngleX = extraAngleX;
        
        // Reaparecer etiquetas después de 1 segundo
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
            mostrarEtiquetasDrag();
            hideTimeout = null;
        }, 1000);
    }
}

const canvas = renderer.domElement;
canvas.addEventListener('mousedown', onDragStart);
window.addEventListener('mousemove', onDragMove);
window.addEventListener('mouseup', onDragEnd);
canvas.addEventListener('touchstart', onDragStart);
window.addEventListener('touchmove', onDragMove);
window.addEventListener('touchend', onDragEnd);

// --- ANIMACIÓN ---
const seqText = document.getElementById('seq');

function animate() {
    requestAnimationFrame(animate);
    
    // Rotación automática infinita
    autoRotateY += 0.01;
    
    // Retorno suave con duración fija
    if (!isDragging && isReturning) {
        const now = performance.now();
        const elapsed = now - returnStartTime;
        let t = Math.min(1, elapsed / returnDuration);
        extraAngleY = startAngleY * (1 - t);
        extraAngleX = startAngleX * (1 - t);
        if (t >= 1) {
            extraAngleY = 0;
            extraAngleX = 0;
            isReturning = false;
        }
    }
    
    // Aplicar rotación final
    corn.rotation.y = autoRotateY + extraAngleY;
    corn.rotation.x = extraAngleX + Math.sin(Date.now() * 0.0005) * 0.1;
    
    // Simulación de datos genéticos
    if (seqText) {
        seqText.innerText = Math.random().toFixed(4);
    }
    
    renderer.render(scene, camera);
}

// --- LÓGICA DE DATOS DINÁMICOS ---
function updateYieldData() {
    const yieldElement = document.getElementById('yield-value');
    const signalElement = document.getElementById('signal-value');
    
    if (yieldElement) {
        yieldElement.classList.add('data-updating');
        let baseValue = 24.8;
        let variation = (Math.random() * 0.4 - 0.2);
        yieldElement.innerText = `+${(baseValue + variation).toFixed(1)}%`;
        setTimeout(() => {
            yieldElement.classList.remove('data-updating');
        }, 500);
    }
    
    if (signalElement) {
        let sig = Math.random() > 0.85 ? "4/5" : "5/5";
        signalElement.innerText = sig;
    }
    
    setTimeout(updateYieldData, 2000 + Math.random() * 2000);
}

// --- SISTEMA DE CARGA ---
const loaderWrapper = document.getElementById('loader-wrapper');
const loaderPath = document.querySelector('.loader-path');
const percentText = document.getElementById('percent');

function revealLabels() {
    // Aparecen las etiquetas con la clase .show (efecto de entrada original)
    setTimeout(() => {
        for (let i = 1; i <= 4; i++) {
            setTimeout(() => {
                const el = document.getElementById(`t${i}`);
                if (el) el.classList.add('show');
            }, i * 500);
        }
    }, 500);
}

let loadProgress = 0;
const interval = setInterval(() => {
    loadProgress += Math.random() * 4.5;
    if (loadProgress >= 100) {
        loadProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
            if (loaderWrapper) loaderWrapper.classList.add('loader-hidden');
            revealLabels();
            updateYieldData();
            animate();
        }, 800);
    }
    const offset = 283 - (loadProgress / 100) * 283;
    if (loaderPath) loaderPath.style.strokeDashoffset = offset;
    if (percentText) percentText.innerText = Math.floor(loadProgress) + "%";
}, 100);

// --- RESPONSIVE ---
function updateSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    
    if (width < 480) {
        corn.scale.set(0.55, 0.55, 0.55);
        corn.position.x = 0;
    } else if (height < 500) {
        corn.scale.set(0.42, 0.42, 0.42);
        corn.position.x = -0.5;
    } else {
        corn.scale.set(0.65, 0.65, 0.65);
        corn.position.x = 0;
    }
}

window.addEventListener('resize', updateSize);
updateSize();