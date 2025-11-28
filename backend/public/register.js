// register.js — responsável por enviar o cadastro para /api/register

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirm_password");
    const errorBox = document.getElementById("errorBox");

    // Exibir erro de forma bonita no card
    function showError(message) {
        if (!errorBox) {
            alert(message);
            return;
        }
        errorBox.textContent = message;
        errorBox.style.display = "block";
    }

    function clearError() {
        if (errorBox) {
            errorBox.textContent = "";
            errorBox.style.display = "none";
        }
    }

    // Botões 👁 para mostrar/ocultar senha
    document.querySelectorAll(".toggle-visibility").forEach((btn) => {
        const targetId = btn.getAttribute("data-target");
        const input = document.getElementById(targetId);

        if (!input) return;

        btn.addEventListener("click", () => {
            input.type = input.type === "password" ? "text" : "password";
        });
    });

    if (!form) {
        console.error("registerForm não encontrado!");
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearError();

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validações
        if (!name || !email || !password || !confirmPassword) {
            showError("Por favor, preencha todos os campos.");
            return;
        }

        if (password !== confirmPassword) {
            showError("As senhas não coincidem.");
            return;
        }

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                showError(data.error || data.message || "Erro ao criar conta.");
                return;
            }

            // Registro OK → redireciona para login
            window.location.href = "/login.html";

        } catch (err) {
            console.error(err);
            showError("Erro ao conectar com o servidor.");
        }
    });
});
