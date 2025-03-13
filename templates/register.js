// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7kzqZas4PZ9CNzxFvLgleAoY2jhsrNDE",
  authDomain: "lost-68f61.firebaseapp.com",
  projectId: "lost-68f61",
  storageBucket: "lost-68f61.appspot.com",
  messagingSenderId: "285107447304",
  appId: "1:285107447304:web:8c813d175ca98ebe3b53bd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Function to display error messages
function showError(formId, message) {
  // Remove any existing error message
  const existingError = document.querySelector(`#${formId} .error-message`);
  if (existingError) {
    existingError.remove();
  }
  
  // Create new error message element
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.innerHTML = message;
  
  // Insert after the submit button
  const submitButton = document.querySelector(`#${formId} button[type="submit"]`);
  submitButton.parentNode.insertAdjacentElement('afterend', errorDiv);
  
  // Add blood drip animation to the error message
  const drip = document.createElement('div');
  drip.className = 'blood-drip error-drip';
  errorDiv.appendChild(drip);
  
  // Shake the form container
  const container = document.querySelector('.container');
  container.classList.add('shake');
  setTimeout(() => {
    container.classList.remove('shake');
  }, 500);
}

// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
  // Login form submission
  const loginForm = document.querySelector('#loginForm form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('loginPassword').value;
      
      // Sign in existing user
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Successfully signed in
          const user = userCredential.user;
          console.log("User signed in:", user);
          
          // Show success message before redirect
          const successMessage = document.createElement('div');
          successMessage.className = 'success-message';
          successMessage.textContent = "Welcome back to the darkness...";
          
          // Replace the form with the success message
          const formContainer = document.getElementById('loginForm');
          formContainer.innerHTML = '';
          formContainer.appendChild(successMessage);
          
          // Redirect to lobby.html after a brief delay
          setTimeout(() => {
            window.location.href = "lobby.html";
          }, 1500);
        })
        .catch((error) => {
          console.error("Login error:", error.code, error.message);
          
          // Translate Firebase errors to user-friendly messages
          let errorMessage;
          switch(error.code) {
            case 'auth/invalid-email':
              errorMessage = "Your email is malformed. Try again, mortal.";
              break;
            case 'auth/user-not-found':
              errorMessage = "Your soul is not in our registry. Sign up first.";
              break;
            case 'auth/wrong-password':
              errorMessage = "Incorrect dark secret. Try again if you dare.";
              break;
            case 'auth/too-many-requests':
              errorMessage = "Too many failed attempts. Your device is cursed for a while.";
              break;
            default:
              errorMessage = "A dark force prevents your entry: " + error.message;
          }
          
          showError('loginForm', errorMessage);
        });
    });
  }
  
  // Signup form submission
  const signupForm = document.querySelector('#signupForm form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.querySelector('[name="emailSignup"]').value;
      const password = document.getElementById('signupPassword').value;
      
      // Create new user
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Signed up
          const user = userCredential.user;
          console.log("User signed up:", user);
          
          // You can update the user profile to add the name if you want
          // updateProfile(user, { displayName: name });
          
          // Show success message
          const successMessage = document.createElement('div');
          successMessage.className = 'success-message';
          successMessage.textContent = "Your soul has been claimed. You may now enter.";
          
          // Replace the form with success message
          const formContainer = document.getElementById('signupForm');
          formContainer.innerHTML = '';
          formContainer.appendChild(successMessage);
          
          // Switch to login form after delay
          setTimeout(() => {
            toggleForm();
            
            // Add welcoming message
            const welcomeMsg = document.createElement('div');
            welcomeMsg.className = 'welcome-message';
            welcomeMsg.textContent = "Your pact is sealed. Sign in to enter.";
            document.getElementById('loginForm').prepend(welcomeMsg);
            
            // Auto-fill email field
            document.getElementById('email').value = email;
          }, 2000);
        })
        .catch((error) => {
          console.error("Signup error:", error.code, error.message);
          
          // Translate Firebase errors to user-friendly messages
          let errorMessage;
          switch(error.code) {
            case 'auth/email-already-in-use':
              errorMessage = "This soul is already bound to our darkness.";
              break;
            case 'auth/invalid-email':
              errorMessage = "Your email bears a cursed format. Try again.";
              break;
            case 'auth/weak-password':
              errorMessage = "Your dark secret is too weak. Choose something stronger.";
              break;
            default:
              errorMessage = "The ritual was interrupted: " + error.message;
          }
          
          showError('signupForm', errorMessage);
        });
    });
  }

  // Add CSS for the new error/success message styles
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .error-message {
      color: #ff0000;
      text-align: center;
      margin-top: 1rem;
      padding: 0.8rem;
      background: rgba(50, 0, 0, 0.5);
      border: 1px solid #800000;
      position: relative;
      font-family: 'Courier New', monospace;
      animation: flicker 2s infinite;
    }
    
    @keyframes flicker {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
      70% { opacity: 0.9; }
      80% { opacity: 0.8; }
    }
    
    .error-drip {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
    }
    
    .container.shake {
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }
    
    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }
    
    .success-message {
      color: #aa0000;
      text-align: center;
      margin: 2rem auto;
      padding: 1.5rem;
      background: rgba(20, 0, 0, 0.7);
      border: 1px solid #800000;
      font-family: 'Courier New', monospace;
      font-size: 1.5rem;
      animation: pulse 3s infinite;
      text-shadow: 0 0 10px #ff0000;
    }
    
    @keyframes pulse {
      0%, 100% { text-shadow: 0 0 10px #ff0000; }
      50% { text-shadow: 0 0 20px #ff0000, 0 0 30px #ff0000; }
    }
    
    .welcome-message {
      color: #aa0000;
      text-align: center;
      margin-bottom: 1.5rem;
      font-family: 'Courier New', monospace;
      text-shadow: 0 0 8px #ff0000;
    }
  `;
  document.head.appendChild(styleElement);
});

// Add the toggleForm function here for accessibility
function toggleForm() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const container = document.querySelector('.container');
  
  container.classList.add('flip');
  
  setTimeout(() => {
    if (loginForm.style.display !== 'none') {
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
    } else {
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
    }
    container.classList.remove('flip');
  }, 500);
}

// This makes toggleForm available in the global scope for HTML onclick
window.toggleForm = toggleForm;
window.togglePassword = function(inputId) {
  const input = document.getElementById(inputId);
  const button = input.nextElementSibling;
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '👁️‍🗨️';
  } else {
    input.type = 'password';
    button.textContent = '👁️';
  }
};