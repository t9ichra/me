const map = [
    [1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 1],
    [1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 1, 1, 0, 0, 1],
    [1, 1, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 1, 0, 1, 1, 1],
    [1, 1, 0, 0, 1, 1],
    [1, 1, 0, 0, 1, 1],
    [1, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 1, 1],
    [1, 0, 0, 1, 1, 1],
    [1, 1, 0, 0, 0, 1],
    [1, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1],
    [1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 1, 1]


];



let playerPos = { x: 2, y: 2 };
let playerAngle = 0;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const playerImageFront = new Image();
playerImageFront.src = 'persoFront.png';
const playerImageBack = new Image();
playerImageBack.src = 'persoBack.png';

let cle = {};
const keys = [];
const keyImage = new Image();
keyImage.src = 'key.png';

let ambientSound = new Audio('ambient.mp3');
let rainSound = new Audio('rain.mp3');
let footstepSound = new Audio('footstep.mp3');
let keySound = new Audio('keys.mp3');
let screamSound = new Audio('scream.mp3');
let crySound = new Audio('cry.mp3');
let isFootstepPlaying = false;
let lastFootstepTime = 0;
const FOOTSTEP_COOLDOWN = 400;

function initVolumeControls() {
    const pauseVolumeSlider = document.getElementById('pauseVolumeSlider');
    
    if (pauseVolumeSlider) {

        const initialVolume = pauseVolumeSlider.value / 100;
        ambientSound.volume = initialVolume * 0.3;
        rainSound.volume = initialVolume * 0.4;
        footstepSound.volume = initialVolume * 0.5;
        keySound.volume = initialVolume * 0.7;
        screamSound.volume = initialVolume * 0.6;
        crySound.volume = initialVolume * 0.5;
        
        pauseVolumeSlider.addEventListener('input', function() {
            const volume = this.value / 100; 
            
            ambientSound.volume = volume * 0.3;
            rainSound.volume = volume * 0.4;
            footstepSound.volume = volume * 0.5;
            keySound.volume = volume * 0.7;
            screamSound.volume = volume * 0.6;
            crySound.volume = volume * 0.5;
        });
    }
}

function renderKeyCounter() {
    const keysCollected = keys.filter(key => key.collected).length;
    const totalKeys = keys.length;
    
    if (keysCollected === totalKeys) {

        const glowIntensity = Math.sin(Date.now() * 0.005) * 0.3 + 0.7; 
        
        ctx.fillStyle = `rgba(255, 50, 50, ${glowIntensity})`;
        ctx.font = '24px Fantasy';
        
        ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        ctx.shadowBlur = 15;
        ctx.textAlign = 'right';
        
        ctx.fillText('THE GATE IS OPEN!', canvas.width - 20, 30);
    } else {

        ctx.font = '20px Fantasy';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'right';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        
        ctx.fillText(`Keys: ${keysCollected}/${totalKeys}`, canvas.width - 20, 30);
    }
    
    ctx.shadowBlur = 0;
}

function initAudio() {
    ambientSound.loop = true;
    ambientSound.volume = 0.3;
    
    rainSound.loop = true;
    rainSound.volume = 0.4;
    
    footstepSound.volume = 0.5;
    
    keySound.volume = 0.7;
    
    screamSound.volume = 0.6;
    crySound.volume = 0.5;

    document.addEventListener('click', () => {
        ambientSound.play().catch(e => console.log("Ambient audio play failed:", e));
        rainSound.play().catch(e => console.log("Rain audio play failed:", e));
        console.log("Background sounds started");
    }, { once: true });

    initVolumeControls();
}

function playRandomHorrorSounds() {
    if (Math.random() < 0.0005) {
        if (Math.random() < 0.5) {
            const screamInstance = screamSound.cloneNode();
            screamInstance.play().catch(e => console.log("Scream sound play failed:", e));
        } else {
            const cryInstance = crySound.cloneNode();
            cryInstance.play().catch(e => console.log("Cry sound play failed:", e));
        }
    }
}

function playKeySound() {
    const keyInstance = keySound.cloneNode();
    keyInstance.play().catch(e => console.log("Key sound play failed:", e));
}

function playFootstepSound() {
    const currentTime = Date.now();
    if (currentTime - lastFootstepTime < FOOTSTEP_COOLDOWN || isFootstepPlaying) return;
    
    lastFootstepTime = currentTime;
    isFootstepPlaying = true;
    
    const footstepInstance = footstepSound.cloneNode();
    footstepInstance.volume = 0.5;
    
    footstepInstance.onended = () => {
        isFootstepPlaying = false;
    };
    
    footstepInstance.play().catch(e => {
        console.log("Footstep play failed:", e);
        isFootstepPlaying = false;
    });
}


function addKeysToMap() {
   
    if (keys.length === 0) {
        keys.push(
            { x: 3.5, y: 3.5, collected: false },
            { x: 4.5, y: 8.5, collected: false },
            { x: 1.5, y: 15.5, collected: false }
        );
    }
}

function checkKeyCollection() {
    keys.forEach((key, index) => {

        const dx = playerPos.x - key.x;
        const dy = playerPos.y - key.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 0.5 && !key.collected) {
            key.collected = true;
            console.log(`Key ${index + 1} collected!`);
            playKeySound();
        }
    });
}


const playerImage = new Image();
playerImage.src = 'monster.jpg';
const FOV = Math.PI / 3;
const RAYS = canvas.width;
const MOUSE_SENSITIVITY = 0.002;

const rainDrops = [];
const MAX_RAIN_DROPS = 600;  
const rainColor = 'rgba(200, 220, 255, 0.7)';

function generateRain() {

    if (rainDrops.length < MAX_RAIN_DROPS && Math.random() < 0.2) {
        rainDrops.push({
            x: Math.random() * canvas.width,
            y: 0,
            speed: 5 + Math.random() * 5, 
            length: 8 + Math.random() * 12,
            thickness: 1 + Math.random() * 1.5, 
            opacity: 0.5 + Math.random() * 0.5  
        });
    }
}

function renderRain() {
    ctx.strokeStyle = rainColor;
    ctx.lineWidth = 1;
    
    rainDrops.forEach((drop, index) => {
        ctx.beginPath();
        ctx.globalAlpha = drop.opacity;
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();
    });
    
    ctx.globalAlpha = 1;
}


function animateRain() {
for (let i = rainDrops.length - 1; i >= 0; i--) {
const drop = rainDrops[i];
drop.y += drop.speed;


if (drop.y > canvas.height) {
    rainDrops.splice(i, 1);
}
}
}

class LightningBolt {
constructor() {
this.segments = [];
this.duration = 0;
this.generateBolt();
}

generateBolt() {
this.segments = [];
let startX = Math.random() * canvas.width;
let startY = 0;
let currentX = startX;
let currentY = startY;


while (currentY < canvas.height) {
    const nextX = currentX + (Math.random() * 40 - 20); 
    const nextY = currentY + (20 + Math.random() * 30);  
    
    this.segments.push({
        startX: currentX,
        startY: currentY,
        endX: nextX,
        endY: nextY,
        width: 1 + Math.random() * 2  
    });
    
    currentX = nextX;
    currentY = nextY;
}

this.duration = 15 + Math.floor(Math.random() * 10); 
}

render(ctx) {
ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
ctx.shadowBlur = 20;
ctx.shadowColor = 'rgba(200, 200, 255, 0.7)';

this.segments.forEach(segment => {
    ctx.lineWidth = segment.width;
    ctx.beginPath();
    ctx.moveTo(segment.startX, segment.startY);
    ctx.lineTo(segment.endX, segment.endY);
    ctx.stroke();
});

ctx.shadowBlur = 0;
}
}

let activeLightning = null;
const LIGHTNING_FREQUENCY = 0.01;  

function simulateLightning() {

if (!activeLightning && Math.random() < LIGHTNING_FREQUENCY) {
activeLightning = new LightningBolt();
}


if (activeLightning) {
activeLightning.duration--;

if (activeLightning.duration <= 0) {
    activeLightning = null;
}
}
}

function renderLightning() {
if (activeLightning) {

ctx.fillStyle = `rgba(255, 255, 255, ${0.2 * Math.random()})`;
ctx.fillRect(0, 0, canvas.width, canvas.height);

activeLightning.render(ctx);
}
}

const otherPlayers = [
    { x: 2, y: 2, angle: Math.PI },
    { x: 2, y: 3, angle: Math.PI / 2 },
    { x: 4, y: 4, angle: Math.PI }
];



function renderSprites() {
    const wallDistances = new Array(RAYS).fill(Infinity);
    
    for (let x = 0; x < RAYS; x++) {
        const rayAngle = playerAngle + (x / RAYS - 0.5) * FOV;
        const ray = castRay(rayAngle);
        wallDistances[x] = ray.distance * Math.cos(rayAngle - playerAngle);
    }

    const sprites = [
        ...keys.filter(key => !key.collected).map(key => ({
            type: 'key',
            x: key.x,
            y: key.y,
            image: keyImage,
            scale: 0.7  
        })),
        ...otherPlayers.map(player => ({
            type: 'player',
            x: player.x,
            y: player.y,
            imageFront: playerImageFront,
            imageBack: playerImageBack,
            angle: player.angle,
            scale: 1
        }))
    ];
    
    const spriteDetails = sprites.map(sprite => {
        const dx = sprite.x - playerPos.x;
        const dy = sprite.y - playerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angleToSprite = Math.atan2(dy, dx);

        let relativeAngle = angleToSprite - playerAngle;
        while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
        while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;

        return { 
            sprite, 
            distance, 
            relativeAngle,
            angleToSprite
        };
    })
    .filter(data => {
        return Math.abs(data.relativeAngle) < FOV * 1.5 || data.distance < 1;
    })
    .sort((a, b) => b.distance - a.distance);

    spriteDetails.forEach(({ sprite, distance, relativeAngle, angleToSprite }) => {
        const screenX = (0.5 + relativeAngle / FOV) * canvas.width;
        const spriteHeight = (canvas.height * 0.5) / distance * sprite.scale;
        const spriteWidth = spriteHeight;
        const spriteTop = (canvas.height - spriteHeight) / 2;
        
        const leftBound = Math.max(0, Math.floor(screenX - spriteWidth / 2));
        const rightBound = Math.min(canvas.width, Math.ceil(screenX + spriteWidth / 2));

        if (sprite.type === 'player') {
            const angleDiff = (sprite.angle - angleToSprite + Math.PI * 2) % (Math.PI * 2);
            const currentImage = (angleDiff > Math.PI / 2 && angleDiff < Math.PI * 3/2) ? 
                sprite.imageFront : sprite.imageBack;

            if (currentImage.complete) {
                for (let sx = leftBound; sx < rightBound; sx++) {
                    const textureX = ((sx - (screenX - spriteWidth / 2)) / spriteWidth) * currentImage.width;
                    const columnDistance = distance * Math.cos(
                        playerAngle + (sx / canvas.width - 0.5) * FOV - angleToSprite
                    );

                    if (columnDistance < wallDistances[sx]) {
                        ctx.drawImage(
                            currentImage,
                            textureX, 0,
                            1, currentImage.height,
                            sx, spriteTop,
                            1, spriteHeight
                        );
                    }
                }
            }
        } else {
            for (let sx = leftBound; sx < rightBound; sx++) {
                const textureX = ((sx - (screenX - spriteWidth / 2)) / spriteWidth) * sprite.image.width;
                const columnDistance = distance * Math.cos(
                    playerAngle + (sx / canvas.width - 0.5) * FOV - angleToSprite
                );

                if (columnDistance < wallDistances[sx]) {
                    const animationTime = Date.now() * 0.005;
                    const floatAmplitude = Math.max(0.05 * (1 - distance / 5), 0);
                    const floatOffset = Math.sin(animationTime + sprite.x + sprite.y) * floatAmplitude;

                    ctx.drawImage(
                        sprite.image,
                        textureX, 0,
                        1, sprite.image.height,
                        sx, spriteTop + floatOffset * canvas.height,
                        1, spriteHeight
                    );
                }
            }
        }
    });
}
canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas && !isPaused) {
        document.addEventListener('mousemove', updateCamera);
    } else {
        document.removeEventListener('mousemove', updateCamera);
    }
});

function updateCamera(e) {
    playerAngle += e.movementX * MOUSE_SENSITIVITY;
}

function castRay(rayAngle) {

    rayAngle = rayAngle % (2 * Math.PI);
    if (rayAngle < 0) rayAngle += 2 * Math.PI;

    const right = Math.abs(Math.cos(rayAngle)) > 0.0001 ? Math.cos(rayAngle) > 0 : null;
    const up = Math.abs(Math.sin(rayAngle)) > 0.0001 ? Math.sin(rayAngle) > 0 : null;

    let distToWall = 0;
    let hitWall = false;
    let wallX = 0;

    let mapX = Math.floor(playerPos.x);
    let mapY = Math.floor(playerPos.y);

    const rayDirX = Math.cos(rayAngle);
    const rayDirY = Math.sin(rayAngle);

    const deltaDistX = Math.abs(1 / rayDirX);
    const deltaDistY = Math.abs(1 / rayDirY);

    const stepX = right ? 1 : -1;
    const stepY = up ? 1 : -1;

    let sideDistX = right ? 
        (Math.floor(playerPos.x + 1) - playerPos.x) * deltaDistX :
        (playerPos.x - Math.floor(playerPos.x)) * deltaDistX;
    
    let sideDistY = up ? 
        (Math.floor(playerPos.y + 1) - playerPos.y) * deltaDistY :
        (playerPos.y - Math.floor(playerPos.y)) * deltaDistY;

        const MAX_STEPS = 100;

    // DDA Algorithm
    let side;
    for (let step = 0; step < MAX_STEPS; step++) {
        // Jump to next map square
        if (sideDistX < sideDistY) {
            sideDistX += deltaDistX;
            mapX += stepX;
            side = 0;
        } else {
            sideDistY += deltaDistY;
            mapY += stepY;
            side = 1;
        }

        // Check if ray has hit a wall
        if (map[mapY] && map[mapY][mapX] === 1) {
            if (side === 0) {
                distToWall = (mapX - playerPos.x + (1 - stepX) / 2) / rayDirX;
                wallX = playerPos.y + distToWall * rayDirY;
            } else {
                distToWall = (mapY - playerPos.y + (1 - stepY) / 2) / rayDirY;
                wallX = playerPos.x + distToWall * rayDirX;
            }
            wallX -= Math.floor(wallX);
            break;
        }

       
        if (distToWall > 10) break;
    }

    return {
        distance: distToWall,
        side: side,
        wallX: wallX
    };
}
function movePlayer() {
    const moveSpeed = 0.05;
    const rotSpeed = 0.03;
    let playerMoved = false;

    if (cle['w']) {
        const newX = playerPos.x + Math.cos(playerAngle) * moveSpeed;
        const newY = playerPos.y + Math.sin(playerAngle) * moveSpeed;
        if (map[Math.floor(newY)][Math.floor(newX)] === 0) {
            playerPos.x = newX;
            playerPos.y = newY;
            playerMoved = true;
        }
    }
    if (cle['s']) {
        const newX = playerPos.x - Math.cos(playerAngle) * moveSpeed;
        const newY = playerPos.y - Math.sin(playerAngle) * moveSpeed;
        if (map[Math.floor(newY)][Math.floor(newX)] === 0) {
            playerPos.x = newX;
            playerPos.y = newY;
            playerMoved = true;
        }
    }
    if (cle['a']) playerAngle -= rotSpeed;
    if (cle['d']) playerAngle += rotSpeed;
    
    if (playerMoved) {
        playFootstepSound();
    }
}

initAudio();

const wallTexture = new Image();
wallTexture.src = 'mossy.png';

const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
skyGradient.addColorStop(0, '#808080 '); 
skyGradient.addColorStop(0.7, '#c0c0c0'); 
skyGradient.addColorStop(1, '#dcdcdc');   

function render() {
    movePlayer();

    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);  
    ctx.fillStyle = '#708090';
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);  


    addKeysToMap();
    checkKeyCollection();
    playRandomHorrorSounds();

    generateRain();
    animateRain();
    renderRain();

    simulateLightning();
    renderLightning();


    for (let x = 0; x < RAYS; x++) {
        const rayAngle = playerAngle + (x / RAYS - 0.5) * FOV;
        const ray = castRay(rayAngle);

        const correctDistance = ray.distance * Math.cos(rayAngle - playerAngle);

        const wallHeight = (canvas.height * 0.5) / correctDistance;
        const wallTop = (canvas.height - wallHeight) / 2;
        const wallBottom = (canvas.height + wallHeight) / 2;

        if (wallTexture.complete) {
            const textureX = Math.floor(ray.wallX * wallTexture.width);
            const brightness = ray.side === 1 ? 0.7 : 1;
            ctx.globalAlpha = brightness / (1 + correctDistance * 0.1);
            
            ctx.drawImage(
                wallTexture,
                textureX, 0,
                1, wallTexture.height,
                x, wallTop,
                1, wallBottom - wallTop
            );
            
            ctx.globalAlpha = 1;
        }
    }
    renderSprites();
    renderKeyCounter();
    requestAnimationFrame(render);
}

window.addEventListener('keydown', (e) => cle[e.key] = true);
window.addEventListener('keyup', (e) => cle[e.key] = false);

render();

