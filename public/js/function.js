// Funzione per verificare se l'email è già presente
function checkmail() {
  const mail = document.getElementById("mail").value;
  mail = mail.toLowerCase();
  // Effettua una richiesta al server per verificare l'email
  fetch("/verifica_email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mail }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Gestisci la risposta dal server
      if (data.esiste) {
        alert("Mail already exists.");
        document.getElementById("signup-button").disabled = true;
      } else {
        document.getElementById("signup-button").removeAttribute("disabled");
      }
    })
    .catch((error) => {
      console.error("Si è verificato un errore durante la richiesta:", error);
    });
}

function checkmailforupdate() {
  const mail = document.getElementById("mail").value.toLowerCase();
  // Effettua una richiesta al server per verificare l'email
  fetch("/verifica_email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mail }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Gestisci la risposta dal server
      if (data.esiste) {
        alert("Mail already used.");
        document.getElementById("update-button").disabled = true;
      } else {
        document.getElementById("update-button").removeAttribute("disabled");
      }
    })
    .catch((error) => {
      console.error("Si è verificato un errore durante la richiesta:", error);
    });
}

function logincheck() {
  // Raccoglie le informazioni dalla pagina HTML
  var mail = document.getElementById("mail").value;
  mail = mail.toLowerCase();
  var password = document.getElementById("password").value;

  fetch("/form-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mail: mail, password: password }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Errore nella richiesta al server");
      }
      return response.json(); // Parsa la risposta JSON
    })
    .then((data) => {
      if (data.auth === true) {
        window.location.href = "/recogito"; // Reindirizza dopo il login
      } else {
        document.getElementById("errormessage").style.display = "block";
        // Altre operazioni in caso di errore di login
      }
    })
    .catch((error) => {
      console.error("Si è verificato un errore:", error);
      // Gestione degli errori di rete o server
    });
}

function enablepassword() {
  document.getElementById("password").disabled = false;
  document.getElementById("pchange").value = true;
  document.getElementById("pchange").disabled = true;
}
