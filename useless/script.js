const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.fillStyle = 'gray';
ctx.fillRect(0, 0, canvas.width, canvas.height);

console.log("Canvas is set up and ready!");

const carte = [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
];

const tailleCellule = 50;

function dessinerCarte(){
    for(let y = 0 ; y < carte.length; y++){
        for (let x = 0 ; x < carte[y].length; x++){
                if (carte[y][x] === 1) {
                    ctx.fillStyle = "black";
                }else {
                    ctx.fillStyle = "white";
                }

                ctx.fillRect(
                    x * tailleCellule,
                    y * tailleCellule,
                    tailleCellule,
                    tailleCellule
                );

                ctx.strokeStyle = "grey";
                ctx.strokeRect(
                    x * tailleCellule,
                    y * tailleCellule,
                    tailleCellule,
                    tailleCellule
                );
        }
    }
    
}

let joueur = { 
    x: 76, 
    y: 75, 
    angle: 0 
};

function dessinerJoueur(){
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(joueur.x , joueur.y , 10 , 0 , Math.PI * 2);
    ctx.fill();
}

function afficherRayon() {
    const startX = joueur.x / tailleCellule;
    const startY = joueur.y / tailleCellule;

    // Direction simulée (45° diagonalement)
    const dirX = 0.7; 
    const dirY = 0.7;

    let currentX = startX;
    let currentY = startY;

    const maxDistance = 20; // Limite de distance pour le rayon

    for (let i = 0; i < maxDistance; i++) {
        // Calculer la cellule courante
        const cellX = Math.floor(currentX);
        const cellY = Math.floor(currentY);

        // Arrêter si le rayon touche un mur
        if (carte[cellY][cellX] === 1) {
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(
                cellX * tailleCellule + tailleCellule / 2,
                cellY * tailleCellule + tailleCellule / 2,
                10,
                0,
                Math.PI * 2
            );
            ctx.fill();
            break;
        }

        // Visualiser la traversée de cellules
        ctx.fillStyle = "rgba(0, 0, 255, 0.3)";
        ctx.fillRect(
            cellX * tailleCellule,
            cellY * tailleCellule,
            tailleCellule,
            tailleCellule
        );

        // Avancer le rayon
        currentX += dirX * 0.1;
        currentY += dirY * 0.1;
    }
}

function afficherScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    dessinerCarte();
    dessinerJoueur(); 
    afficherRayon();
}

function verifierCollision(){
    const cellX = Math.floor(joueur.x / tailleCellule);
    const cellY = Math.floor(joueur.y / tailleCellule);
    
    if (carte[cellY][cellX] === 1) {
        return true;
    }
    return false;
}

function deplaceJoueur(event){
    const vitesse = 20;
    const oldX = joueur.x;
    const oldY = joueur.y;

    switch(event.key) {
        case "ArrowUp":
            joueur.y -= vitesse;
            break;
        case "ArrowDown":
            joueur.y += vitesse;
            break;
        case "ArrowLeft":
            joueur.x -= vitesse;
            break;
        case "ArrowRight":
            joueur.x += vitesse;
            break;
    }

    if (verifierCollision()) {
        joueur.x = oldX;
        joueur.y = oldY;
    }

    joueur.x = Math.max(10, Math.min(canvas.width - 10, joueur.x));
    joueur.y = Math.max(10, Math.min(canvas.height - 10, joueur.y));
    
    afficherScene();
}

// Définition de la fonction pour tourner le joueur
function tournerJoueur(event) {
    const vitesseRotation = 0.1;

    if (event.key === "ArrowLeft") {
        joueur.angle -= vitesseRotation;
    }

    if (event.key === "ArrowRight") {
        joueur.angle += vitesseRotation;
    }

    // Normalisation de l'angle
    if (joueur.angle < 0) {
        joueur.angle += 2 * Math.PI;
    }
    if (joueur.angle >= 2 * Math.PI) {
        joueur.angle -= 2 * Math.PI;
    }

    afficherScene();
}

// Écoute des événements
window.addEventListener("keydown", deplaceJoueur);
window.addEventListener("keydown", tournerJoueur); 

afficherScene();
