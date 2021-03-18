"use strict"
const http = require("http");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const generator = require('generate-password');
const fileupload = require("express-fileupload");
const nodemailer = require("nodemailer");
let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'perizierilievi@gmail.com',
      pass: 'passwordRilievi02'
    }
});
const cloudinary = require('cloudinary').v2;
const app = express();
const colors = require("colors");
const HEADERS = require("headers");
const PORT = process.env.PORT || 1337;
const DBNAME = "rilievi";
const TTL = 18000; //espresso in secondi (5 ore)
const NO_COOKIES="No cookies found";
const SRVR_LOG = ">>>>>>>> ";
const CONNECTIONSTRING = "mongodb+srv://admin:admin2021@rilieviperizie.q1hjh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const CONNECTIONOPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};
const CLOUDINARY_URL = "cloudinary://292665551975869:n81okLup51k9U6sxkob1IJ24BTI@rilievi-perizie"
cloudinary.config({
    cloud_name: 'rilievi-perizie',
    api_key: '292665551975869',
    api_secret: 'n81okLup51k9U6sxkob1IJ24BTI'
});



let currentUser = "";

let mongo = require("mongodb");
let mongoClient = mongo.MongoClient;
const ObjectId = mongo.ObjectID;

let paginaErrore;
let PRIVATE_KEY;

const server = http.createServer(app);

/* ********************** Starting listening server ********************** */
init();
server.listen(PORT, function () {
    console.log(`${colors.green(`[${new Date().toLocaleTimeString()}]`)}${colors.blue(`${SRVR_LOG}`)}Server listening on port: ${PORT}`);
});

/* ********************** Express listener ********************** */

// 1) 
app.use("*", function (req, res, next) {
    console.log(`${colors.blue(`${SRVR_LOG}`)}Risorsa: ${req.originalUrl.split('?')[0]}.`);
    next();
});

// 2) Pagine per cui serve controllare il token
app.get("/", controllaToken);
app.get("/index.html", controllaToken);

// 3) Route relativa alle risorse statiche
app.use('/', express.static("./static"));

// 4) Route di lettura dei parametri post.
app.use(bodyParser.json({limit: '10mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}))

// 5) Route di log dei parametri.
/*
app.use("/",function(req,res,next){
    if(Object.keys(req.query).length > 0)
    {
        console.log(">>>>>>>> Parametri: " + JSON.stringify(req.query) + ".");
    }
    if(Object.keys(req.body).length > 0)
    {
        console.log(">>>>>>>> Parametri: " + JSON.stringify(req.body) + ".");
    }
    next();
});
*/

// 6) CORS
app.use("/", function (req, res, next) {
    res.setHeader("Access-Controll-Allow-Origin", "*");
    res.setHeader("Access-Controll-Allow-Headers", "*");
    res.setHeader("Access-Controll-Allow-Credientials", true);
    next();
})

// 7) JSON
app.use(express.json({
    limit: '1000mb'
}));
app.set("json spaces", 4);

// 8) File size
app.use("/", fileupload({
    "limits": {
        "fileSize": (10 * 1024 * 1024)
    }
})) // 10Mb

/*********************************** Login ******************************/

app.post("/api/cercaMail/", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database.");
        } else {
            let mail = req.body.email;
            console.log(">>>>>>>>>> " + mail);

            let db = client.db(DBNAME);
            let collection = db.collection('users');

            collection.findOne({
                "email": mail
            }, function (err, data) {
                if (err) {
                    res.status(500).send("Internal Error in Query Execution.");
                } else {
                    if (data) {
                        res.send({
                            "email": "found"
                        });
                    } else {
                        res.send({
                            "email": "not found"
                        });
                    }
                    client.close();
                }
            });
        }
    });
});

app.post('/api/login', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database.");
        } else {
            let db = client.db(DBNAME);
            let collection = db.collection('users');

            let mail = req.body.email;
            let pass = req.body.password;
            let admin = req.body.admin;

            collection.findOne({
                "email": mail
            }, function (err, dbUser) {
                currentUser = dbUser.email;
                console.log(">>>>>>>>>> MAIL:" + currentUser);
                if (err) {
                    res.status(500).send("Internal Error in Query Execution.");
                } else {
                    if (dbUser == null) {
                        res.status(401).send("Incorrect mail or password.");
                    } else {
                        console.log(pass+" - "+dbUser.password);
                        console.log(bcrypt.hashSync(pass, 10));
                        bcrypt.compare(pass, dbUser.password, function (err, ok) {
                            if (err) {
                                res.status(500).send("Internal Error in bcrypt compare.");
                            } else {
                                if (!ok) {
                                    res.status(401).send("Email or password not correct.");
                                } else {
                                    if ((admin && dbUser.admin) || !admin) {
                                        let newToken = createToken(dbUser);
                                        writeCookie(res, newToken);
                                        res.send(dbUser);
                                        client.close();
                                    } else {
                                        res.status(401).send("Access Denied");
                                    }
                                }
                            }
                        });
                    }
                }
            });
        }
    });
});
/********************************** Register **************************************/
app.post("/api/register", function(req, res, next)
{
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function(err, client){
        if (err)
        {
            res.status(503).send("Database connection error.");
        }
        else
        {
            let email = req.body.email;
            let randomPass = generator.generate({"length":10,"numbers":true});
            let cryptedPass=bcrypt.hashSync(randomPass, 10);;

            let db = client.db(DBNAME);
            let collection = db.collection('users');

            collection.insertOne({"email" : email, "password" : cryptedPass},
            function(err,data)
            {
                if (err)
                {
                    res.status(500).send("Internal Error in Query Execution.");
                }
                else
                {
                    let mailOptions = {
                        from: 'perizierilievi@gmail.com',
                        to: email,
                        subject: 'Registration',
                        html: `<h1>CONGRATULATIONS!</h1><p>An admin has just created your account for Rilievi & Perizie! Your password is ${randomPass}. You can change it once you log into the app.</p>`
                    };

                    transporter.sendMail(mailOptions, function(error, info){
                        if(error)
                        {
                            res.send({"ris":"ok"});
                            console.log("Error on sending message:     "+ error);
                        }
                        else
                        {
                            res.send({"ris":"ok"});
                        }
                        client.close();
                    });
                }
            });
        }
    });
});
/********************************** Reports **************************************/
app.post("/api/caricaImmagine/", function(req, res, next){
    let file = `data:image/jpeg;base64,${req.body.file}`;
    
    cloudinary.uploader.upload(file)
    .then((result) => {
      res.send({
        message: "success",
        result,
      });
    }).catch((error) => {
      res.status(500).send({
        message: "failure",
        error,
      });
    });
});

app.post("/api/submitDetails/", function(req, res, next)
{
    let email = req.body.email;
    let coord = req.body.coord;
    let date = req.body.date;
    let notes = req.body.notes;
    let image = req.body.image;

    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function(err, client){
        if (err)
        {
            res.status(503).send("Database connection error.");
        }
        else
        {
            let db = client.db(DBNAME);
            let collection = db.collection('photos');

            collection.insertOne({"email" : email, "coord" : coord, "date" : date, "notes" : notes, "notesAdmin" : "", "image" : image},
            function(err,data)
            {
                if (err)
                {
                    res.status(500).send("Internal Error in Query Execution.");
                }
                else
                {
                    res.send({"ris" : "ok"});
                }
                client.close();
            });
        }
    });
});

app.post("/api/findReports", function(req, res, next){
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) 
        {
            res.status(503).send("Database connection error.");
        } 
        else 
        {
            let db = client.db(DBNAME);
            let collection = db.collection('photos');

            collection.find({ }).toArray(function (err, data) 
            {
                if (err) 
                {
                    res.status(500).send("Internal Error in Query Execution.");
                } 
                else 
                {
                    if(data.length > 0)
                    {
                        res.send({"ris": data});
                    }
                    else
                    {
                        res.send({"ris": "err"});
                    }
                    client.close();
                }
            });
        }
    });
});

app.post("/api/adminComment", function(req, res, next)
{
    let set={};
    let id = ObjectID(req.body.id);
    let comment = req.body.comment;

    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function(err, client){
        if (err)
        {
            res.status(503).send("Database connection error.");
        }
        else
        {
            let db = client.db(DBNAME);
            let collection = db.collection('photos');

            collection.findOne({ "_id" : id }, function (err, dataUser)
            {
                if (err) 
                {
                    res.status(500).send("Internal Error in Query Execution.");
                } 
                else 
                {
                    collection.updateOne({ "_id": id }, { $set: { "notesAdmin" : comment} },
                    function (err, data)
                    {
                        if (err) 
                        {
                            res.status(500).send("Internal server error.");
                        } 
                        else 
                        {
                            res.send(data);
                        }
                        client.close();
                    });
                }
            });
        }
    });
});
/******************************** Token & Cookies ****************************** */
app.post("/api/controllaToken", function (req, res, next) {
    let token = controllaToken(req, res, next);
    res.send(token);
});

app.use("/api", controllaToken);

app.post('/api/logout', function (req, res, next) {
    res.set("Set-Cookie", "token=;max-age=-1;Path=/;httponly=true;Secure=true;SameSite=Lax");
    res.send({
        "ris": "ok"
    });
});

app.use("*", function (req, res, next) {
    res.status(404);
    if (req.originalUrl.startsWith("/api/")) {
        //res.json("Sorry, can't find the resource you are looking for.");
        res.send("Resource not found.");
    } else {
        res.send(paginaErrore);
    }
});

/*
 * If the server generate an error this route is done. Send the http response code 500.
 */
app.use(function (err, req, res, next) {
    console.log(err.stack); //Stack completo (default).
    if (!err.codice) {
        err.codice = 500;
        err.message = "Internal Server Error.";
        //server.close();
    }
    res.status(err.codice);
    res.send(err.message);
});

/* ********************** Functions ********************** */
/*
 * Prepare or make the error displayed page.
 */
function init() {
    fs.readFile("./static/error.html", function (err, data) {
        if (!err) {
            paginaErrore = data.toString();
        } else {
            paginaErrore = '<h1 style="color:red;text-align:center;">- Page or resource not found -</h1><br><a class="btn btn-primary" style="margin:0 auto;" href="/index.html">Home</a>';
        }
    });
    fs.readFile("./keys/privateToken.key", function (err, data) {
        if (!err) {
            PRIVATE_KEY = data.toString();
        } else {
            console.log("The private key is missing");
            server.close();
        }
    });

    app.response.log = function (message) {
        console.log(message);
    }
}

/*
 * Write the data that recive as a parameter after date and hour.
 */
function log(data) {
    console.log(`${colors.cyan("[" + new Date().toLocaleTimeString() + "]")} ${data}`);
}

function controllaToken(req, res, next) {
    let token = readCookie(req);

    if (token == NO_COOKIES) {
        sendError(req, res, 403, "Token mancante");
    } else {
        jwt.verify(token, PRIVATE_KEY, function (err, payload) {
            if (err) {
                sendError(req, res, 403, "Token expired or corrupted");
            } else {
                // ...vet per scomporlo
                setTokenAndCookie(payload, res);
                req.payload = payload;
                next();
            }
        });
    }
}

function sendError(req, res, cod, errMex) {
    if (req.originalUrl.startsWith("/api/")) {
        res.status(cod).send(errMex);
    } else {
        res.sendFile(`${__dirname}/static/login.html`);
    }
}

function setTokenAndCookie(payload, res) {
    let newToken = createToken(payload);
    return writeCookie(res, newToken);
}

function readCookie(req) {
    let valoreCookie = NO_COOKIES;
    if (req.headers.cookie) {
        let cookies = req.headers.cookie.split(";");
        for (let item of cookies) {
            item = item.split("="); //item da chiave=valore --> [chiave, valore]
            if (item[0].includes("token")) {
                valoreCookie = item[1];
                break;
            }
        }
        //Trasforma cookies in un array di json
        //Object.fromEntries(cookies);
    }
    return valoreCookie;
}

//data --> record dell'utente
function createToken(data) {
    //sign() --> si aspetta come parametro un json con i parametri che si vogliono mettere nel token
    let param = {
        "_id": data["_id"],
        "email": data.email,
        "iat": data.iat || Math.floor(Date.now() / 1000),
        "exp": Math.floor(Date.now() / 1000) + TTL
    }
    let token = jwt.sign(param, PRIVATE_KEY);
    return token;
}

function writeCookie(res, token, expires = TTL) {
    //set() --> metodo di express che consente di impostare una o più intestazioni nella risposta HTTP    createCookie(token, expires)
    res.set("Set-Cookie", `token=${token};max-age=${expires};path=/;httponly=true;Secure=true;SameSite=Lax`);
    return `token=${token};max-age=${expires};path=/;httponly=true`;
}
