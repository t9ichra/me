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

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();

  window.addEventListener('resize', resizeCanvas);

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
const MAX_RAIN_DROPS = 3000;  
const rainColor = 'rgba(200, 220, 255, 0.7)';

function generateRain() {
    if (rainDrops.length < MAX_RAIN_DROPS && Math.random() < 0.6) {
        rainDrops.push({
            x: Math.random() * canvas.width,
            y: -10, // Start slightly above screen for smooth entry
            speed: 7 + Math.random() * 10, // Faster rain
            length: 10 + Math.random() * 20, // Longer streaks
            thickness: 1 + Math.random() * 2,
            opacity: 0.6 + Math.random() * 0.3,
            terminalY: canvas.height * (0.5 + Math.random() * 0.1) // Rain stops at floor level
        });
    }
}

function renderRain() {
    ctx.save();
    
    // More realistic rain color with subtle blue tint
    const baseRainColor = 'rgba(210, 230, 255, ';
    
    rainDrops.forEach(drop => {
        // Adjust opacity based on depth (simulating distance)
        const finalOpacity = drop.opacity * (0.7 + Math.random() * 0.3);
        ctx.strokeStyle = baseRainColor + finalOpacity + ')';
        ctx.lineWidth = drop.thickness;
        
        ctx.beginPath();
        
        // Angle the rain slightly for more realism
        const rainAngle = 0.15; // Slight angle
        const xOffset = drop.length * Math.sin(rainAngle);
        
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + xOffset, Math.min(drop.y + drop.length, drop.terminalY));
        ctx.stroke();
        
        // Add a small splash if the rain hits the floor
        if (drop.y + drop.length >= drop.terminalY && Math.random() < 0.6) {
            createSplash(drop.x + xOffset, drop.terminalY, drop.speed / 8);
        }
    });
    
    ctx.restore();
}


function animateRain() {
    for (let i = rainDrops.length - 1; i >= 0; i--) {
        const drop = rainDrops[i];
        drop.y += drop.speed;
        
        // Remove drops that go beyond their terminal point (floor level)
        if (drop.y > drop.terminalY + 5) {
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


function createSplash(x, y, size) {
    if (!window.splashes) {
        window.splashes = [];
    }
    
    // Create a new splash
    window.splashes.push({
        x: x,
        y: y,
        size: size,
        opacity: 0.7,
        lifetime: 10 + Math.random() * 10
    });
}

function createRainSplashes() {
    // Manage the existing window splash effects
    if (!window.rainSplashes) {
        window.rainSplashes = [];
    }
    
    // Add new larger splashes occasionally on the floor level only
    const floorLevel = canvas.height * 0.6; // Match this to your floor level
    if (window.rainSplashes.length < 30 && Math.random() < 0.05) {
        window.rainSplashes.push({
            x: Math.random() * canvas.width,
            y: floorLevel + Math.random() * 10, // Only on floor level
            size: 2 + Math.random() * 6,
            opacity: 0.5 + Math.random() * 0.3,
            lifetime: 15 + Math.random() * 30,
            expansionRate: 0.2 + Math.random() * 0.4
        });
    }
    
    // Process small splashes from individual raindrops
    if (window.splashes) {
        ctx.save();
        ctx.fillStyle = 'rgba(200, 220, 255, 0.5)';
        
        for (let i = window.splashes.length - 1; i >= 0; i--) {
            const splash = window.splashes[i];
            
            // Draw splash
            ctx.globalAlpha = splash.opacity;
            ctx.beginPath();
            ctx.arc(splash.x, splash.y, splash.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Fade and expand splash
            splash.lifetime--;
            splash.size += 0.1;
            splash.opacity -= 0.07;
            
            if (splash.lifetime <= 0 || splash.opacity <= 0) {
                window.splashes.splice(i, 1);
            }
        }
        
        ctx.restore();
    }
    
    // Render and update larger floor splashes
    ctx.save();
    ctx.fillStyle = 'rgba(200, 230, 255, 0.4)';
    
    for (let i = window.rainSplashes.length - 1; i >= 0; i--) {
        const splash = window.rainSplashes[i];
        
        // Draw splash with ripple effect
        ctx.globalAlpha = splash.opacity * (splash.lifetime / 40);
        ctx.beginPath();
        ctx.arc(splash.x, splash.y, splash.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw inner highlight
        if (splash.size > 3) {
            ctx.globalAlpha = Math.min(0.5, splash.opacity * 0.7);
            ctx.beginPath();
            ctx.arc(splash.x, splash.y, splash.size * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(225, 240, 255, 0.3)';
            ctx.fill();
        }
        
        // Fade and expand splashes
        splash.lifetime--;
        splash.size += splash.expansionRate;
        splash.opacity -= 0.01;
        
        if (splash.lifetime <= 0 || splash.opacity <= 0) {
            window.rainSplashes.splice(i, 1);
        }
    }
    
    ctx.restore();
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
wallTexture.src = 'image2.png';

const povHandImage = new Image();
povHandImage.src = 'pov.png';



const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
skyGradient.addColorStop(0, '#5b5959'); 
skyGradient.addColorStop(0.7, '#5b5959'); 
skyGradient.addColorStop(1, '#5b5959');   




function createWallLightSpot(x, centerX, radius) {
    // Calculate distance from center of view
    const distance = Math.abs(x - centerX);
    
    // Create a more circular light spot effect with sharper edges
    let intensity = 1 - Math.pow(distance / radius, 2); // Squared falloff for more circular shape
    intensity = Math.max(0, intensity); // Clamp to positive values
    
    // Make the falloff more pronounced for a spotlight effect
    // Higher exponent = sharper edge transition
    intensity = Math.pow(intensity, 3);
    
    return intensity;
}


function render() {
    movePlayer();

    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2); 
     
let gradient = ctx.createLinearGradient(0, canvas.height / 2, 0, canvas.height);

gradient.addColorStop(0, '#464242');      
gradient.addColorStop(1, '#191818');     


ctx.fillStyle = gradient;
ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);


    addKeysToMap();
    checkKeyCollection();
    playRandomHorrorSounds();

    
    const centerX = canvas.width / 2;
    const lightRadius = canvas.width * 0.12;


   for (let x = 0; x < RAYS; x++) {
        const rayAngle = playerAngle + (x / RAYS - 0.5) * FOV;
        const ray = castRay(rayAngle);

        const correctDistance = ray.distance * Math.cos(rayAngle - playerAngle);

        const wallHeight = (canvas.height * 0.5) / correctDistance;
        const wallTop = (canvas.height - wallHeight) / 2;
        const wallBottom = (canvas.height + wallHeight) / 2;

        if (wallTexture.complete) {
            const textureX = Math.floor(ray.wallX * wallTexture.width);
            
            // Calculate base brightness from side and distance
            let brightness = ray.side === 1 ? 0.7 : 1;
            brightness = brightness / (1 + correctDistance * 0.1);
            
            // Get the light spot intensity for this column
            const lightIntensity = createWallLightSpot(x, centerX, lightRadius);
            
            // Add the light spot on top of the regular brightness
            const spotBrightness = Math.min(brightness + lightIntensity * 0.6, 1.0);
            
            ctx.globalAlpha = spotBrightness;
            
            ctx.drawImage(
                wallTexture,
                textureX, 0,
                1, wallTexture.height,
                x, wallTop,
                1, wallBottom - wallTop
            );
            
            ctx.globalAlpha = 1;

            // Draw a more defined circular light spot effect on the wall
            if (lightIntensity > 0.05) {
                // Create a gradient overlay for each column to enhance the circular appearance
                const gradientAlpha = lightIntensity * 0.35; // Slightly stronger glow
                
                // Use a warm light color with gradient transparency
                ctx.fillStyle = `rgba(255, 255, 230, ${gradientAlpha})`;
                ctx.fillRect(x, wallTop, 1, wallBottom - wallTop);
                
                // Add a subtle highlight in the very center for a more realistic light effect
                if (lightIntensity > 0.8) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${(lightIntensity - 0.8) * 0.5})`;
                    ctx.fillRect(x, wallTop, 1, wallBottom - wallTop);
                }
            }
        }
    }
    generateRain();
    animateRain();
    renderRain();
    createRainSplashes();
    simulateLightning();
    renderLightning();

    renderSprites();
    renderKeyCounter();

    if (povHandImage.complete) {
        const handWidth = canvas.width * 0.6; // Adjust size as needed
        const handHeight = handWidth * (povHandImage.height / povHandImage.width);
        const handX = canvas.width - handWidth;
        const handY = canvas.height - handHeight;
        
        ctx.drawImage(povHandImage, handX, handY, handWidth, handHeight);
    }
    
    requestAnimationFrame(render);
}

window.addEventListener('keydown', (e) => cle[e.key] = true);
window.addEventListener('keyup', (e) => cle[e.key] = false);

render();

