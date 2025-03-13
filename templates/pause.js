let volume = 50;
const canvas1 = document.getElementById('canvas');
const ctx1 = canvas1.getContext('2d');
const pauseMenu = document.getElementById('pauseMenu');

let isPaused = false;

 function togglePauseMenu() {
    isPaused = !isPaused;
    pauseMenu.style.display = isPaused ? 'block' : 'none';
    
    if (isPaused) {
        // Exit pointer lock when paused
        document.exitPointerLock();
    } else {
        // Request pointer lock when resuming
        canvas1.requestPointerLock();
    }
}





document.getElementById('resumeButton').addEventListener('click', togglePauseMenu);
document.getElementById('closeButton').addEventListener('click', togglePauseMenu);
document.getElementById('leaveGameButton').addEventListener('click', () => {
    window.location.href = 'index.html'; // Redirect path
});



canvas1.addEventListener('click', () => {
    if (!isPaused) {
        canvas1.requestPointerLock();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        togglePauseMenu();
    }
});