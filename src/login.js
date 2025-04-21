function login() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');
    
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent the form from refreshing the page
        
        // Clear previous error messages
        errorMessage.textContent = '';
        errorMessage.classList.remove('show');
        
        const email = usernameInput.value; // Using the username input for email
        const password = passwordInput.value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Login successful');
                
                // Store user info in local storage for UI purposes if needed
                localStorage.setItem('username', data.username);
                
                window.location.href = '/collection.html?typer=riders';
            } else {
                const data = await response.json();
                errorMessage.textContent = data.error || 'Login failed. Please try again.';
                errorMessage.classList.add('show');
            }
        } catch (error) {
            console.error('Error during login:', error);
            errorMessage.textContent = 'An error occurred. Please try again later.';
            errorMessage.classList.add('show');
        }
    });
}
// Call the login function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', login);