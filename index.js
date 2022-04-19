require('./config/db'); //Conectar la base de datos
const express = require('express');
const router = require('./routes/index');
const { create } = require('express-handlebars');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const passport = require('./config/passport');
const createError = require('http-errors');

require('dotenv').config({path: 'variables.env'});


//Inicializar servidor

app = express();

//Habilitar bodyparser

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//Habilitar handlebars como template engine

const hbs = create({
    defaultLayout: 'layout',
    helpers: require('./helpers/handlebars.js')
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// Archivos estáticos

app.use(express.static(path.join(__dirname, 'public')));

// Sesiones 

app.use(cookieParser());

app.use(session({
    secret: process.env.SECRET,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.DATABASE
    })
}));

//Inicializar passport

app.use(passport.initialize());
app.use(passport.session());

//Alertas y flash mensajes

app.use(flash());

//Crear nuestro middleware

app.use((req,res, next)=>{
    res.locals.mensajes = req.flash();
    next();
});

//Rutas

app.use('/', router());

//404 Pagina no existente

app.use((req,res,next)=>{
    next(createError(404, 'No encontrado'));
});

//Administración de los errores

app.use((error,req,res, next) =>{
    res.locals.mensaje = error.message;
    const status = error.status || 500;
    res.locals.status = status;
    res.status(status);
    res.render('error');
});

// Vistas

app.set('views', './views');

// Servidor

app.listen(process.env.PORT);