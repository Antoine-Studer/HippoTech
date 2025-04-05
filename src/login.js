function login() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');
    
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent the form from refreshing the page
        
        // Clear previous error messages
        errorMessage.textContent = '';
        
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
                window.location.href = '/collection.html';
            } else {
                const data = await response.json();
                errorMessage.textContent = data.error || 'Login failed. Please try again.';
            }
        } catch (error) {
            console.error('Error during login:', error);
            errorMessage.textContent = 'An error occurred. Please try again later.';
        }
    });
}
// Call the login function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', login);