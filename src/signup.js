function signup() {
    const signupForm = document.getElementById('signupForm'); 
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const errorMessage = document.getElementById('errorMessage');

    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // Clear any previous error messages
        errorMessage.textContent = '';
        
        const username = usernameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match!';
            return;
        }

        try {
            console.log('Attempting to sign up user:', username);
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                console.log('Signup successful, redirecting to login page');
                alert('Account created successfully! Please log in.');
                window.location.href = '/login.html';
            } else {
                console.error('Signup failed:', data);
                if (data.errors) {
                    errorMessage.textContent = data.errors.map(err => err.msg).join(', ');
                } else if (data.error) {
                    errorMessage.textContent = data.error;
                } else {
                    errorMessage.textContent = data.message || 'Signup failed. Please try again.';
                }
            }
        } catch (error) {
            console.error('Error during signup:', error);
            errorMessage.textContent = 'An error occurred. Please try again later.';
        }
    });
}
// Call the signup function when the DOM is fully loaded    
document.addEventListener('DOMContentLoaded', signup);