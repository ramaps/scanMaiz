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

// NÚCLEO (ESTILO ARC REACTOR)
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

// --- LÓGICA DE INTERACCIÓN AVANZADA (FINGER-SPIN + HUD CONTROL) ---
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let rotationVelocityX = 0; // Velocidad de inercia en eje X
let rotationVelocityY = 0; // Velocidad de inercia en eje Y
const friction = 0.96; // Fricción ligeramente más alta para una inercia más controlada

// Referencias a las etiquetas (traits)
const traits = document.querySelectorAll('.trait-tag');

const startDragging = (e) => { 
    isDragging = true; 
    
    // Guardamos las coordenadas iniciales
    previousMouseX = e.touches ? e.touches[0].clientX : e.clientX;
    previousMouseY = e.touches ? e.touches[0].clientY : e.clientY;

    // --- OCULTAR ETIQUETAS INSTANTÁNEAMENTE ---
    traits.forEach(trait => trait.classList.remove('show'));
};

const handleMove = (e) => {
    if (!isDragging) return;
    
    const currentX = e.touches ? e.touches[0].clientX : e.clientX;
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const deltaX = currentX - previousMouseX;
    const deltaY = currentY - previousMouseY;
    
    // Rotar en X y Y basado en el movimiento del dedo
    rotationVelocityX = deltaX * 0.008; // Sensibilidad del giro horizontal
    rotationVelocityY = deltaY * 0.008; // Sensibilidad del giro vertical

    corn.rotation.y += rotationVelocityX;
    corn.rotation.x += rotationVelocityY;

    previousMouseX = currentX;
    previousMouseY = currentY;
};

const stopDragging = () => { 
    isDragging = false; 
    
    // --- REAPARECER ETIQUETAS AL SOLTAR CON PEQUEÑO RETRASO ---
    // Esto da tiempo a que la inercia del maíz actúe un poco antes de mostrar datos
    setTimeout(() => {
        // Solo las mostramos si no hemos vuelto a tocar la pantalla
        if (!isDragging) {
            revealLabels(); // Llamamos a la misma función del cargador para que aparezcan en cascada
        }
    }, 600); // 600ms de retraso para el "recalibrado" visual
};

// Event Listeners (Soporte Mouse y Touch)
window.addEventListener('mousedown', startDragging);
window.addEventListener('touchstart', startDragging);
window.addEventListener('mousemove', handleMove);
window.addEventListener('touchmove', handleMove);
window.addEventListener('mouseup', stopDragging);
window.addEventListener('touchend', stopDragging);

// --- ANIMACIÓN ---
const seqText = document.getElementById('seq');

function animate() {
    requestAnimationFrame(animate);
    
    if (!isDragging) {
        // 1. Aplicar fricción a las velocidades de inercia
        rotationVelocityX *= friction;
        rotationVelocityY *= friction;
        
        // 2. Combinar rotación automática base (0.005) con la inercia restante en Y
        corn.rotation.y += 0.005 + rotationVelocityX;

        // 3. Suavizar la rotación en X de vuelta al balanceo natural (reestabilización)
        // Usamos una interpolación lineal simple (lerp)
        const targetXBalance = Math.sin(Date.now() * 0.0005) * 0.15; // El movimiento natural
        corn.rotation.x += (targetXBalance + rotationVelocityY - corn.rotation.x) * 0.1;
    }
    // Mientras arrastras (isDragging), el movimiento lo controla handleMove

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
        setTimeout(() => { yieldElement.classList.remove('data-updating'); }, 500);
    }

    if (signalElement) {
        let sig = Math.random() > 0.85 ? "4/5" : "5/5";
        signalElement.innerText = sig;
    }
    setTimeout(updateYieldData, 2000 + Math.random() * 2000);
}

// --- SISTEMA DE CARGA Y REVELADO ---
const loaderWrapper = document.getElementById('loader-wrapper');
const loaderPath = document.querySelector('.loader-path');
const percentText = document.getElementById('percent');

// Modificada para ocultar todas antes de empezar la cascada (por seguridad al reaparecer)
function revealLabels() {
    traits.forEach(trait => trait.classList.remove('show')); // Limpieza inicial
    
    setTimeout(() => {
        for(let i = 1; i <= 4; i++) {
            setTimeout(() => {
                const el = document.getElementById(`t${i}`);
                if (el) el.classList.add('show');
            }, (i - 1) * 400); // Cascada más rápida (400ms entre cada una)
        }
    }, 100); // 100ms de retraso inicial
}

let loadProgress = 0;
const interval = setInterval(() => {
    loadProgress += Math.random() * 4.5; 
    
    if (loadProgress >= 100) {
        loadProgress = 100;
        clearInterval(interval);
        
        setTimeout(() => {
            if (loaderWrapper) loaderWrapper.classList.add('loader-hidden');
            revealLabels(); // Primer revelado después de cargar
            updateYieldData();
            animate();
        }, 800);
    }
    
    const offset = 283 - (loadProgress / 100) * 283;
    if (loaderPath) loaderPath.style.strokeDashoffset = offset;
    if (percentText) percentText.innerText = Math.floor(loadProgress) + "%";
}, 100);

// --- RESPONSIVE INTELIGENTE ---
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
