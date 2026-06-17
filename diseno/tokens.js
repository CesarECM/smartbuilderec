const inputs = document.querySelectorAll('.token-box');
const button = document.getElementById("submitToken");
const message = document.getElementById("message");


// mover entre inputs
inputs.forEach((input, index) => {

    input.addEventListener('input', (e) => {

        e.target.value = e.target.value.replace(/[^0-9]/g, '');

        if (e.target.value !== '' && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }

    });

    input.addEventListener('keydown', (e) => {

        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
            inputs[index - 1].focus();
        }

    });

});


// obtener token completo
function getToken(){

    let token = "";

    inputs.forEach(input => {
        token += input.value;
    });

    return token;
}


// validar token
button.addEventListener("click", async () => {

    const token = getToken();

    if(token.length !== 6){

        message.style.color = "red";
        message.innerText = "Ingrese el token completo";

        return;
    }

    const response = await fetch("https://smartbuilderec.onrender.com/validate-token",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body: JSON.stringify({
            token: token
        })

    });

    const data = await response.json();

    if(data.status === "valid"){

    message.style.color = "green";
    message.innerText = "Token válido. Redirigiendo...";

    // GUARDAR SESIÓN
    sessionStorage.setItem("loggedIn", "true");

    setTimeout(() => {
        window.location.href = "./index";
    }, 1500);

    }else{

        message.style.color = "red";
        message.innerText = "Token incorrecto";

    }

});