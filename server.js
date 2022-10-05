const express = require('express');
const koa = require('koa');
const serve = require('koa-static');
//const views = require('koa-view');
const koaBody = require('koa-body');
const hbs = require('koa-views-handlebars');
//const passport = require('./src/passport');
//const session = require('express-session');
//const session = require('cookie-session');
//const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const minimist = require("minimist");
const advancedOptions = {useNewUrlParser: true, useUnifiedTopology: true};
const router = require('./src/routes');
const {options_mdb} = require('./options/mariaDB.js');
const {options} = require('./options/SQLite3.js');
const createTables = require('./src/config.js')
const {engine} = require('express-handlebars');
const { Server: HttpServer } = require('http');       
const { Server: SocketServer } = require('socket.io');
/* const IO = require('koa-socket-2');
const io = new IO(); */

const cluster = require('cluster');
const os = require('os');
const numberCPUs = os.cpus().length;

let producto = [];
let messages = [];

const app = new koa();
app.use(koaBody());
// body parser
const bodyParser = require('koa-bodyparser')
app.use(bodyParser())

// Sessions
const session = require('koa-session')
app.keys = ['secret']
app.use(session({}, app))

const passport = require('koa-passport')
app.use(passport.initialize())
app.use(passport.session())
//const app = express();
//app.use(express.urlencoded({extended: true}));
//app.use(express.static('public')); 
app.use(serve('./public'));
//app.use(cookieParser());

//Necesario para que funcione passport
/* const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));  */

let modulo = require('./contenedor/dao/contenedorDao.js');
let contenedor_prod = new modulo.Contenedor('productos', options_mdb);
let contenedor_mnsjs = new modulo.Contenedor('mensajes', options);

const httpServer = new HttpServer(app);             
const socketServer = new SocketServer(httpServer);  

// Attach the socket to the application
//io.attach( app );
 
// Socket is now available as app.io if you prefer

const argv = minimist(process.argv.slice(2), {alias: {"p": "port", 'm': 'modo'}, default: {'port':8080, 'modo': 'FORK'}})

let credencial = {};

//-------------- MODO FORK O CLUSTER ------------------
const processId = process.pid;
const isMaster = cluster.isMaster;
const PORT = process.env.PORT || 8080;

//console.log(`Proceso: ${processId} - isMaster: ${isMaster}`);

/* if (argv.modo == 'CLUSTER') {
    if (cluster.isMaster) {
        for (let i = 0; i < numberCPUs; i++) {
            cluster.fork()
        }
    } else {
        httpServer.listen(PORT, () => {
            console.log(`Escuchando en el puerto ${httpServer.address().port} en modo ${argv.modo}`);
        });
        httpServer.on("error", (error) => console.error(error, "error de conexión"));
    }
}
if (argv.modo == 'FORK') {
    httpServer.listen(PORT, () => {
        console.log(`Escuchando en el puerto ${httpServer.address().port} en modo ${argv.modo}`);
    });
    httpServer.on("error", (error) => console.error(error, "error de conexión"));
} */

//------------------ SET SESSION -----------------------
/*
app.use(session({

   
    secret: 'clave',
    resave: true,
    cookie: {
        maxAge: 600000
      },
    saveUninitialized: true
  }));

app.use(passport.initialize());
app.use(passport.session());
*/
//------------------ SET HANDLEBARS -----------------------


/* app.set('view engine', 'hbs');
app.set('views', './views');

app.engine(
    'hbs',
    engine({
        extname: '.hbs'
    })
); */
/* app.use(views(('./views'), {
    extension: 'hbs'
})); */
app.use(hbs(__dirname + '/public/views', {
    partialsDirs: __dirname + '/public/views'
  }));

app.use(router.routes());


//----------------------------------------------------------------

socketServer.on('connection', (socket) => {

    async function init(){
        await createTables();
        messages = await contenedor_mnsjs.getAll();
        producto = await contenedor_prod.getAll();
        socket.emit('new_event', producto, messages, credencial);      
    }
    init();

    socket.on('nuevo_prod', (ctx) => {

        async function ejecutarSaveShow(argObj) {
            await contenedor_prod.save(argObj);
            const result = await contenedor_prod.getAll();
            producto = result;
            socketServer.sockets.emit('new_event', producto, messages, credencial);
        }
        ejecutarSaveShow(ctx);
    });
    socket.on('new_message', (ctx) => {
        async function ejecutarSaveShowMnsjs(mnsj) {
            await contenedor_mnsjs.save(mnsj);
            const result = await contenedor_mnsjs.getAll();
            messages = result;
            socketServer.sockets.emit('new_event', producto, messages, credencial);
        }
        ejecutarSaveShowMnsjs(ctx);
    });
});

app.listen(8080, () => {
    console.log('Escuchando!');
  });
