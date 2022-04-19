const emailConfig = require('../config/email');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const util = require('util');
const path = require('path');

let transport = nodemailer.createTransport({

    host: emailConfig.host,
    port: emailConfig.port,
    auth:{
        user: emailConfig.user,
        pass: emailConfig.pass
    }
});
/*
transport.use('compile', hbs({
    viewEngine: 'handlebars',
    viewPath : __dirname + '/../views/emails',
    extName: '.handlebars'
}));*/


exports.enviar = async(opciones) =>{
    
    const opcionesemail = {
        from: 'devJobs <noreply@devjobs.com',
        to: opciones.usuario.email,
        subject: opciones.subject,
        template: opciones.archivo, //Nombre del archivo para renderizar en el correo
        context: {
            resetUrl: opciones.resetUrl,

        }
    };
    console.log(__dirname + '/../views/emails');
    transport.use('compile', hbs({

        viewEngine:{
            extName: 'handlebars',
            partialsDir: path.join(__dirname,'..','views/emails'),
            layoutsDir: path.join(__dirname,'..','views/emails'),
            defaultLayout: opciones.archivo + '.handlebars' //Nombre del archivo para renderizar en el correo
        },
        viewPath: path.join(__dirname,'..','views/emails'),
        extName: '.handlebars'
    
    }));
    
    const sendMail = util.promisify(transport.sendMail, transport);
    
    return sendMail.call(transport, opcionesemail);

}