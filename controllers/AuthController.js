const passport = require('passport');
const mongoose = require('mongoose');
//Importar el modelo
const Vacante = mongoose.model('Vacante');
const Usuario = mongoose.model('Usuario');
const crypto = require('crypto');

const enviarEmail = require('../handlers/email');

exports.autenticarUsuario = passport.authenticate('local',{

    successRedirect: '/administracion',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos campos son obligatorios'

});

//Revisar si el usuario está autenticado o no

exports.verificarUsuario = (req,res,next)=>{

    if(req.isAuthenticated()){
        return next();
    }

    //redireccionar

    res.redirect('/iniciar-sesion');

}

exports.mostrarPanel = async(req,res) =>{

    //Consultar el usuario autenticado

    const vacantes = await Vacante.find({autor: req.user._id}).lean();

    console.log(vacantes);

    res.render('administracion', {
        nombrePagina: 'Panel de administración',
        tagLine: 'Crea y administra tus vacantes desde aquí',
        vacantes,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    });

}

exports.cerrarSesion = (req,res) =>{
    req.logout();
    req.flash('correcto', 'Has cerrado sesión correctamente');
    res.redirect('/iniciar-sesion');
}

exports.formularioReestablecerPassword = (req,res) =>{

    res.render('reestablecer-password', {
        nombrePagina: 'Reestablece tu contraseña',
        tagLine: 'Si ya tienes una cuenta pero olvidaste tu password, coloca tu correo'
    });

}

exports.enviarToken = async(req,res) =>{

    const usuario = await Usuario.findOne({email: req.body.email});

    if(!usuario){
        req.flash('error', 'No se ha registrado una cuenta con este correo');
        return res.redirect('/iniciar-sesion');
    }

    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expira = Date.now() + 3600000; //3600000 es una hora o 3600 segundos

    await usuario.save();

    const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`;

    //Enviar notificación al email

    await enviarEmail.enviar({

        usuario,
        subject: 'Password Reset',
        resetUrl,
        archivo: 'reset'
    });

    //

    req.flash('correcto', 'Revisa tu email para cambiar tu contraseña');
    res.redirect('/iniciar-sesion');

}

exports.reestablecerPassword = async(req,res) =>{

    const usuario = await Usuario.findOne({
        token: req.params.token,
        expira: {
            $gt : Date.now()
        }
    }).lean();

    if(!usuario){

        req.flash('error', 'El token ya no es valido, intenta de nuevo');
        return res.redirect('/reestablecer-password');

    }

    res.render('nuevo-password', {
        nombrePagina: 'Nueva contraseña',
        token: req.params.token
    });

}

exports.guardarPassword = async(req,res) =>{

    const usuario = await Usuario.findOne({
        token: req.params.token,
        expira: {
            $gt : Date.now()
        }
    });

    if(!usuario){

        req.flash('error', 'El token ya no es valido, intenta de nuevo');
        return res.redirect('/reestablecer-password');

    }

    if(req.body.password){
        usuario.password = req.body.password;
        usuario.token = undefined;
        usuario.expira = undefined;

        await usuario.save();
        req.flash('correcto', 'La Contraseña ha sido modificada correctamente');
        res.redirect('/iniciar-sesion');

    }else{
        req.flash('error', 'El campo contraseña debe ser llenado');
        return res.redirect(`/reestablecer-password/${req.params.token}`);
    }

}