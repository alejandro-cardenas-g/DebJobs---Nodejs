const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const Usuarios = mongoose.model('Usuario');

passport.use(new LocalStrategy({

    usernameField: 'email',
    passwordField: 'password'

}, async(email, password, done)=>{

    const usuario = await Usuarios.findOne({email: email});
    if(!usuario) return done(null, false, {
        message: 'Este usuario no existe'
    });
    //El usuario existe, ahora verifica la password
    
    const verificarPassword = usuario.compararPass(password);

    if(!verificarPassword){
        return done(null, false, {
            message: 'La contraseña es incorrecta'
        });
    }

    //Todo correcto

    return done(null, usuario);

}));

passport.serializeUser((usuario, done)=> done(null, usuario._id));
passport.deserializeUser(async(id,done)=>{
    const usuario = await Usuarios.findById(id).exec();
    return done(null, usuario);
});

module.exports = passport;