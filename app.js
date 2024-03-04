const express = require("express");
const app = express();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const session = require("express-session");
const bcrypt = require("bcrypt");

require("colors");
const moment = require("moment");
const createError = require("http-errors");

const fs = require("fs");
const path = require("path");

// Connect to Database
const { Sequelize, DataTypes } = require("sequelize");
const { Console } = require("console");
const { QueryTypes } = require("sequelize");

// Collegamento al database MariaDB
const sequelize = new Sequelize("editor", "root", "", {
  host: "localhost",
  dialect: "mariadb",
});

// Funzione per generare l'hash della password
async function generaHashPassword(password) {
  const saltRounds = 2; // Numero di salti da applicare (più alto è il numero, più è sicuro ma richiede più tempo)
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

var username = null;

// Voci che devono essere definite ogni volta che si crea un nuovo utente
const User = sequelize.define("User", {
  mail: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  surname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  accademic_fields: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  lastnotetitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

const Annotation = sequelize.define("Annotation", {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  owner: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  notation: {
    type: DataTypes.JSON,
    allowNull: false,
  },
});

sequelize
  .sync()
  .then(() => {
    console.log("Database e modelli sincronizzati con successo");
  })
  .catch((err) => {
    console.error("Errore durante la sincronizzazione del database:", err);
  });

// Definisci la rotta per il processo di login
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Definisci la sessione
app.use(
  session({
    secret: "111",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 60000 },
  })
);

// create session
app.post("/form-login", async (req, res) => {
  const mail = req.body.mail;
  const password = req.body.password;
  console.log(mail, password);
  try {
    const user = await User.findOne({ where: { mail } });
    if (!user) {
      // Utente non trovato
      console.log("Utente non trovato");
      res.json({ auth: false });
      return;
    }
    // Utente trovato, verifica la password
    bcrypt
      .compare(password, user.password)
      .then((match) => {
        if (match) {
          // Utente autenticato con successo
          req.session.username = user.mail;
          req.session.role = user.role;
          req.session.name = user.name;
          req.session.surname = user.surname;
          req.session.age = user.age;
          req.session.accademic_fields = user.accademic_fields;
          req.session.role = user.role;
          req.session.gender = user.gender;
          console.log("Utente autenticato con successo");
          res.json({ auth: true });
        } else {
          console.log("Credenziali errate");
          res.json({ auth: false });
        }
      })
      .catch((err) => {
        console.error("Errore durante la verifica della password:", err);
        res.json({ auth: false });
      });
  } catch (error) {
    console.error("Errore durante la ricerca dell'utente:", error);
    res.json({ auth: false });
  }
});

app.post("/form-update", async (req, res) => {
  const { mail, name, surname, age, accademic_fields, gender, password } =
    req.body;
  now = moment().format("YYYY-MM-DD[T]HH-mm-ss-");
  if (password === undefined) {
    var query = `UPDATE Users SET name = '${name}', surname = '${surname}', age = '${age}', accademic_fields = '${accademic_fields}', gender='${gender}',mail = '${mail}', updatedAt='${now}' WHERE mail = '${req.session.username}'`;
  } else {
    passwordhash = await generaHashPassword(password);
    var query = `UPDATE Users SET name = '${name}', surname = '${surname}', age = '${age}', accademic_fields = '${accademic_fields}', gender='${gender}',mail = '${mail}', updatedAt='${now}', password='${passwordhash}' WHERE mail = '${req.session.username}'`;
  }
  try {
    await sequelize.query(query, {
      type: QueryTypes.UPDATE,
    });
    console.log("Utente aggiornato con successo");
    return res.redirect("/logout");
  } catch (error) {
    console.error("Errore durante l'esecuzione della query:", error);
    return res.status(500).send("Errore durante l'aggiornamento");
  }
});

app.use((req, res, next) => {
  // Verifica se la sessione è attiva (se l'utente è autenticato)
  if (req.session && req.session.username && req.session.name) {
    // Se l'utente è autenticato, rendi disponibili i dati globalmente
    res.locals.username = req.session.username;
    res.locals.name = req.session.name;
    res.locals.role = req.session.role;
    username = req.session.username;
  } else {
    // Altrimenti, imposta i dati a null o a un valore predefinito
    res.locals.username = null;
  }

  // Continua con la catena di middleware
  next();
});

// check email
app.post("/verifica_email", async (req, res) => {
  const { mail } = req.body;
  console.log(mail);
  try {
    const utenteEsistente = await User.findOne({ where: { mail } });
    if (utenteEsistente) {
      res.json({ esiste: true });
    } else {
      res.json({ esiste: false });
    }
  } catch (error) {
    console.error("Errore durante la verifica dell'email nel database:", error);
    res
      .status(500)
      .json({ error: "Errore durante la verifica dell'email nel database" });
  }
});

// Destroy session

app.get("/logout", (req, res) => {
  // Chiudi la sessione distruggendo la variabile di sessione
  req.session.destroy((err) => {
    if (err) {
      console.error("Errore durante la distruzione della sessione:", err);
      res.send("Errore durante la distruzione della sessione");
    } else {
      res.redirect("/recogito");
    }
  });
});

app.post("/form-signup", async (req, res) => {
  const { mail, password, name, surname, age, accademic_field, gender } =
    req.body;
  let passwordhash = await generaHashPassword(password);
  console.log(passwordhash);
  try {
    const query = `SELECT * FROM Users WHERE mail = '${mail}'`;
    const existingUser = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    if (existingUser.length > 0) {
      console.log("Utente già registrato");
      return res.send("User already registered");
    } else {
      const date = moment().format("YYYY-MM-DD[T]HH-mm-ss-");
      const insertQuery = `INSERT INTO Users (mail, password, name, surname, age, gender, academic_fields, role, createdAt)
      VALUES ('${mail}', '${passwordhash}', '${name}', '${surname}', '${age}', '${gender}', '${accademic_field}', 0, '${date}')
      `;

      await sequelize.query(insertQuery, { type: QueryTypes.INSERT });
      /* 
      console.log("Utente registrato con successo");
      const cartellaUtente = `./private/user_annotation/${mail}`;
      fs.mkdirSync(cartellaUtente);
      */
      return res.redirect("/recogito");
    }
  } catch (error) {
    console.error("Errore durante l'esecuzione della query:", error);
    return res.status(500).send("Errore durante la registrazione");
  }
});

const INFO_FILE_PATH = path.join(__dirname, "info.json");
const TAG_FILE_PATH = path.join(__dirname, "Tag.json");

let { fileName } = require(INFO_FILE_PATH);
require("ejs");

let data = require(`./version/${fileName}.json`);
require("dotenv").config();

let tag = require(TAG_FILE_PATH);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

var lock = {
  recogito: 0,
  firepad: 0,
};

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.redirect("/recogito");
});

app.get("/login", (req, res) => {
  if (req.session.username) {
    res.redirect("/recogito");
  } else {
    res.render("login", { session: req.session, pagetitle: "login" });
  }
});

app.get("/update_profile", (req, res) => {
  if (!req.session.username) {
    res.redirect("/login");
    return;
  }
  res.render("update_profile", {
    session: req.session,
    pagetitle: "update_profile",
  });
});

app.get("/signup", (req, res) => {
  if (req.session.username) {
    // Sessione già attiva, reindirizza l'utente alla pagina "recogito"
    res.redirect("/recogito");
    return; // Interrompi l'esecuzione della funzione
  }
  res.render("signup", { pagetitle: "signup" });
});

app.get("/profile", (req, res) => {
  // Controlla se la sessione è attiva
  if (req.session.username) {
    const username = req.session.username;
    res.render("profile", { session: req.session, pagetitle: "profile" });
  } else {
    res.send("Utente non autenticato");
  }
});

app.get("/help", (req, res) => {
  res.render("help");
});

const lockMiddleware = (req, res, next) => {
  const { platform } = req.params;

  if (
    (platform === "recogito" && lock.firepad !== 0) ||
    (platform === "firepad" && lock.recogito !== 0)
  ) {
    return res.status(400).json({
      lock: true,
      message: `Qualcuno sta utilizzando ${
        platform === "recogito" ? "il recogito" : "il firepad"
      }`,
    });
  }

  next();
};

app.get("/recogito", lockMiddleware, (req, res) => {
  lock.recogito++;
  res.render("index");
});

app.get("/firepad", lockMiddleware, (req, res) => {
  lock.firepad++;
  res.render("firepad", {
    apiKey: process.env.APIKEY,
    authDomain: process.env.AUTHDOMAIN,
    databaseUrl: process.env.DATABASEURL,
  });
});

app.get("/data", (req, res) => {
  res.status(200).json(lock);
});

app.get("/exit/:platform", (req, res) => {
  const platforms = ["recogito", "firepad"];
  const { platform } = req.params;

  platforms.splice(platforms.indexOf(platform), 1);

  lock[platform]--;
  res.redirect("/" + platforms);
});

app.get("/text", (req, res) => {
  res.send(data.text);
});

app.get("/diff", (req, res) => {
  res.json({ diff: data.diff });
});

app.get("/tag", (req, res) => {
  res.send(tag);
});

app.get("/diff&annotations", (req, res) => {
  res.json({ diff: data.diff, annotation: data.annotation, text: data.text });
});

app.get("/annotations", (req, res) => {
  res.json(data.annotation);
});

app.post("/text", (req, res) => {
  const { text, version } = req.body;

  data.text = text;
  if (version) {
    saveChanges(version);
  } else {
    saveChanges();
  }
  res.status(200).send();
});

app.post("/annotations", (req, res) => {
  const { annotations } = req.body;

  data.annotation = annotations;
  saveChanges();
});

app.post("/diff", ({ body: { diff, prevtext } }, res) => {
  data.diff = diff;
  data.prevtext = prevtext;

  saveChanges();
});

const saveChanges = (nameFile = fileName) => {
  if (fileName !== nameFile) {
    const { prevtext, text } = data;
    if (text !== prevtext) {
      const time = moment().format("YYYY-MM-DD[T]HH-mm-ss-");
      nameFile = time + nameFile;
      fileName = nameFile;
      console.log("siamo qui", username);
      fs.writeFileSync(INFO_FILE_PATH, JSON.stringify({ fileName: nameFile }));
    }
  }

  fs.writeFileSync(
    path.join(__dirname, "version", fileName + ".json"),
    JSON.stringify(data, null, 2)
  );
};

app.get("/download", (req, res) => {
  const file = path.join(__dirname, "version", fileName + ".json");
  res.download(file, req.body.filename, function (err) {
    if (err) {
      console.log("Errore nell'invio del file: " + file);
    }
  });
});

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("Nessun file caricato.");
  }

  if (!req.file.mimetype.startsWith("text/")) {
    return res
      .status(400)
      .send("Formato file non valido. Carica solo file di testo.");
  }

  try {
    const fileContent = await fs.promises.readFile(req.file.path, "utf-8");

    await fs.promises.unlink(req.file.path);

    res.send(
      `File caricato correttamente. Contenuto del file: \n\n${fileContent}`
    );
  } catch (error) {
    console.error("Errore durante la lettura del file:", error);
    return res
      .status(500)
      .send(
        `Si è verificato un errore durante la lettura del file: ${error.message}`
      );
  }
});

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
console.log(`Server in ascolto su http://localhost:${process.env.PORT}`);
