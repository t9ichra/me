const modal = document.getElementById('settingsModal');
const btn = document.getElementById('settingsButton');
const span = document.getElementsByClassName('close')[0];
const form = document.getElementById('settingsForm');

btn.onclick = function() {
    modal.style.display = "block";
}

span.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

form.onsubmit = function(event) {
    event.preventDefault();
    const formData = new FormData(form);
    const settings = Object.fromEntries(formData);
    console.log('Settings saved:', settings);
    alert('Settings saved successfully!');
    modal.style.display = "none";
}