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
// Ajuste de escala inicial
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

// --- ANIMACIÓN ---
const seqText = document.getElementById('seq');

function animate() {
    requestAnimationFrame(animate);
    
    // Rotación suave del maíz
    corn.rotation.y += 0.01;
    corn.rotation.x = Math.sin(Date.now() * 0.0005) * 0.15;
    
    // Simulación de datos genéticos
    if (seqText) {
        seqText.innerText = Math.random().toFixed(4);
    }
    
    renderer.render(scene, camera);
}

// --- LÓGICA DE DATOS DINÁMICOS (OPTIMIZACIÓN Y SEÑAL) ---
function updateYieldData() {
    const yieldElement = document.getElementById('yield-value');
    const signalElement = document.getElementById('signal-value');
    
    if (yieldElement) {
        yieldElement.classList.add('data-updating'); // Llama a la animación de brillo en CSS
        
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

// --- SISTEMA DE CARGA (SISTEMA DE REVELADO) ---
const loaderWrapper = document.getElementById('loader-wrapper');
const loaderPath = document.querySelector('.loader-path');
const percentText = document.getElementById('percent');

function revealLabels() {
    setTimeout(() => {
        for(let i = 1; i <= 4; i++) {
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
            updateYieldData(); // Iniciar los datos dinámicos después de cargar
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

    // Ajuste dinámico de escala del maíz según pantalla
    if (width < 480) { // Móviles Verticales (Samsung/iPhone)
        corn.scale.set(0.55, 0.55, 0.55);
        corn.position.x = 0;
    } else if (height < 500) { // Móviles Horizontales
        corn.scale.set(0.42, 0.42, 0.42);
        corn.position.x = -0.5; // Lo movemos un poco a la izquierda para el HUD
    } else { // Escritorio o Pro Max Grande
        corn.scale.set(0.65, 0.65, 0.65);
        corn.position.x = 0;
    }
}

window.addEventListener('resize', updateSize);
updateSize(); // Ejecutar al inicio para ajustar según el dispositivo actual
