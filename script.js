
const container = document.getElementById('canvas-container');


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });


renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);


const obstructedOffsetX = -5
const obstructedOffsetZ = 40

camera.position.set(0, 100, 100);
camera.lookAt(0, 0, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

const observerMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const objectMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });

const observerSize = document.getElementById('observerSize')
const observerSizeValue = document.getElementById('observerSizeValue')

console.log(observerSize.value)
let observerGeometry = new THREE.SphereGeometry(0.5, observerSize.value, observerSize.value);
const objectGeometry = new THREE.SphereGeometry(1, 32, 32);

const observer1 = new THREE.Mesh(observerGeometry, observerMaterial);
const observer2 = new THREE.Mesh(observerGeometry, observerMaterial);
scene.add(observer1);
scene.add(observer2);

const distantObject = new THREE.Mesh(objectGeometry, objectMaterial);
scene.add(distantObject);

const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });

let lines = [];

function calculateParallaxAngle(separation, distance) {
    // tan theta = (s/2) / d, therefore arctan( (s/2)/d ) = theta, our parallax angle!
    const angleRadians = 2 * Math.atan((separation / 2) / distance);
    const angleDegrees = THREE.MathUtils.radToDeg(angleRadians);
    return angleDegrees.toFixed(2);
}

const observerSeparationSlider = document.getElementById('observerSeparation');
const observerSeparationValue = document.getElementById('observerSeparationValue');
const objectDistanceSlider = document.getElementById('objectDistance');
const objectDistanceValue = document.getElementById('objectDistanceValue');
const numStarsSlider = document.getElementById('numStars')
const numStarsValue = document.getElementById('numStarsValue')
const parallaxAngleDisplay = document.getElementById('parallaxAngle');
const obstructedDistance = document.getElementById('obstructedDistance')
const redObjectDistance = document.getElementById('redObjectDistance')

const observerViewRadios = document.getElementsByName('observerView');

let observerSeparation = parseFloat(observerSeparationSlider.value);
let objectDistance = parseFloat(objectDistanceSlider.value);

function updateScene() {
    observerSeparation = parseFloat(observerSeparationSlider.value);
    objectDistance = parseFloat(objectDistanceSlider.value);

    observerSeparationValue.textContent = observerSeparation;
    objectDistanceValue.textContent = objectDistance;
    
    if (observerSize.value != 8) {
        observer1.scale.setScalar(observerSize.value)
    }

    observer1diameter = observerSize.value * 16
    observerSizeValue.textContent = observer1diameter
    observer1.position.set(-observerSeparation / 2, 0, 0);
    observer2.position.set(observerSeparation / 2, 0, 0);

    distantObject.position.set(0, 0, -objectDistance);

    const parallaxAngle = calculateParallaxAngle(observerSeparation, objectDistance);
    parallaxAngleDisplay.textContent = parallaxAngle;

    console.log(observer1.position)
    distanceToObserver1 = Math.sqrt((obstructedOffsetX**2 + obstructedOffsetZ**2))
    theta = observer1diameter / distanceToObserver1
    distanceToObject = 32/theta
    observer1atHome = (observer1.position.x == -2.5) && (observer1.position.y == 0) && (observer1.position.z == 0)
    objectatHome = (distantObject.position.x == 0) && (distantObject.position.y == 0) && (distantObject.position.z == -20)
    if (observer1atHome && objectatHome){
        obstructedDistance.textContent = Math.round(distanceToObject * 100) / 100
        redObjectDistance.textContent = 60.47
    } else {
        obstructedDistance.textContent = 'NA'
        redObjectDistance.textContent = 'NA'
    }
    

    updateLines();

    updateCameraView();
}

function updateLines() {
    lines.forEach(line => scene.remove(line));
    lines = [];

    const geometry1 = new THREE.BufferGeometry().setFromPoints([
        observer1.position,
        distantObject.position
    ]);
    const geometry2 = new THREE.BufferGeometry().setFromPoints([
        observer2.position,
        distantObject.position
    ]);

    const line1 = new THREE.Line(geometry1, lineMaterial);
    const line2 = new THREE.Line(geometry2, lineMaterial);

    scene.add(line1);
    scene.add(line2);
    lines.push(line1, line2);
}

function updateCameraView() {
    let selectedView = document.querySelector('input[name="observerView"]:checked').value;
    let targetPosition = new THREE.Vector3();
    let targetLookAt = new THREE.Vector3();

    if (selectedView === 'observer1') {

        targetPosition.copy(observer1.position);
        targetPosition.z += 0.1;
        targetLookAt.copy(observer1.position);

    } else if (selectedView === 'observer2') {

        targetPosition.copy(observer2.position);
        targetPosition.y += 0;
        targetPosition.z += 0.1;
        targetLookAt.copy(observer2.position);

    } else if (selectedView == 'obstructed'){
        targetPosition.copy(observer1.position)
        newPositionx = targetPosition.x + obstructedOffsetX
        newPositionz = targetPosition.z + obstructedOffsetZ
        targetPosition.x = newPositionx
        targetPosition.z += newPositionz
        distanceToObjectReal = Math.sqrt(((distantObject.position.x - newPositionx)**2 + (distantObject.position.z - newPositionz)**2))
        console.log(distanceToObjectReal)
    } else {
        targetPosition.set(distantObject.position.x, 50, distantObject.position.z+50);
        targetLookAt.copy(distantObject.position);
    }


    new TWEEN.Tween(camera.position)
        .to({ x: targetPosition.x, y: targetPosition.y, z: targetPosition.z }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();


    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.add(camera.position);

    const lookAt = { x: currentLookAt.x, y: currentLookAt.y, z: currentLookAt.z };
    new TWEEN.Tween(lookAt)
        .to({ x: targetLookAt.x, y: targetLookAt.y, z: targetLookAt.z }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(function () {
            camera.lookAt(new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z));
        })
        .start();
}

numStarsSlider.addEventListener('input', addStars)
observerSeparationSlider.addEventListener('input', updateScene);
observerSize.addEventListener('input', updateScene)
objectDistanceSlider.addEventListener('input', updateScene);
observerViewRadios.forEach(radio => {
    radio.addEventListener('change', updateCameraView);
});


updateScene();


function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    renderer.render(scene, camera);
}

animate();


window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

let stars;

function addStars() {
    
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });

    const starVertices = [];
    if (stars) {
        scene.remove(stars)
    }
    for (let i = 0; i < numStarsSlider.value; i++) {
        const x = THREE.MathUtils.randFloatSpread(1000);
        const y = THREE.MathUtils.randFloatSpread(1000);
        const z = THREE.MathUtils.randFloatSpread(1000) - 500;
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    numStarsValue.textContent = numStarsSlider.value;
}


addStars();