// Funzione per verificare se l'email è già presente

function discriminatory() {
  document.getElementById("nextsentence").style = "display: block;";
}

function gotocategory() {
  document.getElementById("yesorno").style = "display: none;";
  document.getElementById("menucategoria").style = "display: block;";
  document.getElementById("precedente").style = "display: block;";
  document.getElementById("nextsentence").style = "display: block;";
}

function yesorno() {
  document.getElementById("menucategoria").style = "display: none;";
  document.getElementById("yesorno").style = "display: block;";
  document.getElementById("precedente").style = "display: none;";
}

function eng() {
  fetch("/changelanguage", {
    method: "post",
  })
    .then(() => {
      console.log("Richiesta inviata con successo. Nessuna risposta attesa.");
    })
    .catch((errore) => {
      console.error("Errore durante l'invio della richiesta:", errore);
    });
}
