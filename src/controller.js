const {fork} = require('child_process');
const minimist = require("minimist");
const {createReadStream} = require('fs');

const argv = minimist(process.argv.slice(2), {alias: {"p": "port", 'm': 'modo'}, default: {'port':8080, 'modo': 'FORK'}})

module.exports = {
    renderLogin: async ctx => {
       await ctx.render('login');
    },
    renderRegister: async ctx => {
        await ctx.render('register');
    },
    renderLogout: ctx => {

        ctx.session.destroy((err) =>{
            if(!err) res.render('logout', { credencial });
            else res.send({status: 'Logout ERROR', body: err})
        })
    },
    renderAutenticado: async ctx => {
    
        console.log("autenticado correctamente");
        credencial = {name: ctx.request.body.username};
        //ctx.response.body = ctx.render('index.html');
        //serve('index.html');
        ctx.type = 'html';
        ctx.body = createReadStream('./src/index.html');
    },
    renderRegistrado: async ctx => {
    
        console.log("registrado correctamente");
        await ctx.redirect('/')
    },
    randomNumbers: (req, res) => {
        let cantDatos = parseInt(req.query.cant);
        const forked = fork('./utils/randomNumbers.js');
    
        forked.on('message', numbers => {
            res.send(numbers);
        })
        forked.send(cantDatos);
        console.log("random succesful")
    },
    info: (req, res) =>{
        const info = {
            args: argv,
            sistema: process.platform,
            nodeVersion: process.version,
            memory: process.memoryUsage(),
            path: process.cwd(),
            processId: process.pid,
            file: __dirname,
            numberCPUs: numberCPUs
        }
        res.send(info)
    }
}