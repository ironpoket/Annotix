const express = require("express");
const app = express();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const session = require("express-session");
//let Client = require("ssh2-sftp-client");
const _ = require("lodash");

require("colors");
const moment = require("moment");
const createError = require("http-errors");

const fs = require("fs");
const path = require("path");

const { Sequelize, DataTypes } = require("sequelize");
const { Console } = require("console");
const { QueryTypes } = require("sequelize");
const { endianness } = require("os");
const { json } = require("body-parser");
const { get } = require("http");
const { ok } = require("assert");
// Variabili globali
const phrasesmap_it = {};
const phrasesmap_en = {};
var phrasemap = {};
var phrases = {};
var phrases_en = {};
var maxsentence = 5;
let nsentence = 67;
// Variabili per le iterazioni utente
var name = "";
var age = "";
var gender = "";
var complete = false;
var niteration = 1;
var numeriusciti = [];
var id;
var n = 0;
// Definisci la rotta per il processo di login
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Definisci la sessione
app.use(
  session({
    secret: "111",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: Infinity },
  })
);

app.use((req, res, next) => {
  // Verifica se la sessione è attiva (se l'utente è autenticato)
  if (req.session && req.session.user) {
    // Se l'utente è autenticato, rendi disponibili i dati globalmente
    res.locals.name = req.session.name;
    res.locals.id = req.session.id;
    res.locals.uniquecode = req.session.uniquecode;
    res.locals.user = req.session.user;
    res.locals.complete = req.session.complete;
    res.locals.niteration = req.session.niteration;
    res.locals.numeriusciti = req.session.numeriusciti;
    res.locals.n = req.session.n;
    res.locals.phrasemap = req.session.phrasemap;
    res.locals.lang = req.session.lang;
    res.locals.currentfile = req.session.currentfile;
  }
  // Continua con la catena di middleware
  next();
});

app.use(express.static("public"));

var lock = {
  recogito: 0,
  firepad: 0,
};

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  if (req.session.user) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Errore durante la distruzione della sessione:", err);
      } else {
        //console.log("Sessione distrutta");
      }
    });
  }
  //resetvar();
  res.render("intro", { pagetitle: "intro" });
});

app.get("/en", (req, res) => {
  //console.log("lingua cambiata in inglese");
  //console.log(phrasemap);
  //console.log(phrasemap[2]);
  res.render("intro_en", { pagetitle: "intro_en" });
});

app.get("/guide", (req, res) => {
  if (lang == "en") {
    res.render("guide_en", { pagetitle: "Guide", name: name });
  } else {
    res.render("guide", { pagetitle: "Guide", name: name });
  }
});

// Leggere il file JSON
fs.readFile("frasi.json", "utf8", (err, data) => {
  // frasi in italiano
  if (err) {
    console.error("Errore nella lettura del file:", err);
    return;
  }
  phrases = JSON.parse(data);
  for (let index = 0; index < Object.keys(phrases.frasi).length; index++) {
    phrasesmap_it[phrases.frasi[index].key] = phrases.frasi[index].frase;
  }
  // Puoi ora utilizzare l'oggetto JSON come desideri
});

fs.readFile("frasi_en.json", "utf8", (err, data) => {
  // frasi in inglese
  if (err) {
    console.error("Errore nella lettura del file:", err);
    return;
  }
  phrases_en = JSON.parse(data);
  for (let index = 0; index < Object.keys(phrases_en.frasi).length; index++) {
    phrasesmap_en[phrases_en.frasi[index].key] = phrases_en.frasi[index].frase;
  }
  // Puoi ora utilizzare l'oggetto JSON come desideri
});

const INFO_FILE_PATH = path.join(__dirname, "info.json");
const TAG_FILE_PATH = path.join(__dirname, "Tag.json");

let { fileName } = require(INFO_FILE_PATH);
require("ejs");

//let data = require(`./version/${fileName}.json`);
require("dotenv").config();

let tag = require(TAG_FILE_PATH);

let namefile = undefined;

var data = undefined;

var currentfile;

var lang = "it";

app.post("/get_userinfo", (req, res) => {
  let lang = req.body.lang;
  req.session.lang = lang;
  name = req.body.name;
  req.session.name = name;
  age = req.body.age;
  gender = req.body.gender;
  //console.log(req.body);
  //console.log(res.locals.lang);
  if (lang == "it") {
    req.session.phrasemap = phrasesmap_it;
  } else {
    req.session.phrasemap = phrasesmap_en;
  }
  let namefile = Math.random().toString(36);
  let orginalPath = "./version/example.json";
  let newPath = "./private/" + namefile + ".json";
  let i = 0;
  do {
    if (fs.existsSync(newPath)) {
      //console.log("Il file esiste.");
      namefile = Math.random().toString(36);
      newPath = "./private/" + namefile + ".json";
      i = 1;
    } else {
      i = 0;
    }
  } while (i != 0);
  let id = namefile;
  req.session.uniquecode = id;
  fs.copyFile(orginalPath, newPath, (err) => {
    if (err) throw err;
    return;
  });
  req.session.user = [{ name: name, age: age, gender: gender, id: id }];
  req.session.currentfile = newPath;
  req.session.complete = false;
  req.session.niteration = 1;
  req.session.numeriusciti = [];
  req.session.n = 1;
  //console.log(req.session.user);
  //data = require(`./private/${fileName}.json`);
  res.redirect("/recogito");
});

app.get("/recogito", (req, res) => {
  if (res.locals.id == undefined || res.locals.n == nsentence) {
    res.redirect("/");
    return;
  }
  req.session.n++;
  let index = getphrase(res.locals.numeriusciti);
  let frase = res.locals.phrasemap[index];
  //console.log(frase);
  req.session.numeriusciti.push(index);
  //console.log(res.locals.numeriusciti);
  if (res.locals.lang == "it") {
    res.render("index", {
      name: res.locals.name,
      complete: res.locals.complete,
      pagetitle: "recogito",
      frase: frase,
    });
  } else {
    res.render("index_en", {
      name: res.locals.name,
      complete: res.locals.complete,
      pagetitle: "recogito",
      frase: frase,
    });
  }
});

app.get("/example", (req, res) => {
  res.render("example", { pagetitle: "example" });
});

app.get("/example_en", (req, res) => {
  res.render("example_en", { pagetitle: "example" });
});

app.get("/end", (req, res) => {
  res.render("end", { pagetitle: "end" });
});

app.get("/end_en", (req, res) => {
  res.render("end_en", { pagetitle: "end" });
});

app.post("/usersugestion", (req, res) => {
  //console.log(req.body);
  let sentence = req.body.sugestion;
  let user = res.locals.user;
  let mail = req.body.email;
  let jsonData = JSON.stringify({
    user: user,
    mail: mail,
    sugestion: sentence,
  });
  //console.log(jsonData);
  //console.log(res.locals.uniquecode);
  let namefile = res.locals.uniquecode + "sugestion.json";
  fs.writeFileSync("./private/" + namefile, jsonData);
  res.redirect("/");
});

function resetvar() {
  complete = false;
  niteration = 1;
  arraysentecences = [];
  numeriusciti = [];
  n = 0;
}

function generatefilename() {
  let filenote = "./private/" + Math.random().toString(36) + ".json";
  let i = 0;
  do {
    if (fs.existsSync(filenote)) {
      //console.log("Il file esiste.");
      filenote = "./private/" + Math.random().toString(36) + ".json";
      i = 1;
    } else {
      i = 0;
    }
  } while (i != 0);
  return filenote;
}

function getphrase(numeriusciti) {
  let index;
  do {
    index = Math.floor(Math.random() * nsentence) + 1;
  } while (numeriusciti.includes(index));
  return index;
}

app.post("/useriteration", (req, res) => {
  //console.log(req.body);
  let sentence = req.body.sentence;
  let isdiscriminatory = req.body.isdiscriminatory;
  let category = req.body.categoria;
  //console.log(res.locals.user);
  //console.log(sentence, isdiscriminatory, category);
  if (isdiscriminatory == "false") {
    category = isdiscriminatory;
  }
  let user = res.locals.user;
  //console.log(req.session);
  let jsonsentence = generateJSONannotation(user, sentence, category);
  //console.log(jsonsentence, res.locals.niteration);
  let path = generatefilename();
  //console.log(path);
  //console.log(res.locals.currentfile);
  if (res.locals.niteration == 1) {
    path = res.locals.currentfile;
    delete req.session.currentfile;
  }
  req.session.niteration++;
  fs.writeFileSync(path, jsonsentence);
  if (res.locals.niteration == maxsentence) {
    req.session.complete = true;
  }

  if (res.locals.niteration == 10) {
    if (res.locals.lang == "it") {
      res.redirect("/end");
    } else {
      res.redirect("/end_en");
    }
  } else {
    res.redirect("/recogito");
  }
});

app.post("/usermail", (req, res) => {
  let email = req.body.email;
  let user = req.body.name;
  let jsonData = JSON.stringify({ user: user, email: email });
  //console.log(jsonData);
  let namefile = res.locals.uniquecode + "email.json";
  fs.writeFileSync("./private/" + namefile, jsonData);
  res.redirect("/");
});

function generateJSONannotation(user, text, bodyValue) {
  const jsonData = {
    user,
    annotation: [
      {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        type: "Annotation",
        body: [
          {
            type: "TextualBody",
            purpose: "tagging",
            value: bodyValue,
          },
        ],
      },
    ],
    prevtext: text,
    text: `<p>${text}</p>`,
  };
  const jsonString = JSON.stringify(jsonData, null, 2);
  return jsonString;
}

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

app.listen(process.env.PORT);
//console.log(`Server in ascolto su http://localhost:${process.env.PORT}`);
