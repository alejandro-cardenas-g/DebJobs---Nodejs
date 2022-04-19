const mongoose = require('mongoose');
//Importar el modelo
const Usuario = mongoose.model('Usuario');

const multer = require('multer');

const shortid = require('shortid');

const path = require('path');

const {body, validationResult} = require('express-validator');

exports.formularioCrearCuenta = (req,res) =>{
    res.render('crear-cuenta', {
        nombrePagina: 'Crea tu cuenta en devJobs',
        tagLine: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta'
    });
}

const configuracionMulter = {
    limits: {
        fileSize : 1000000
    },
    storage: fileStorage = multer.diskStorage({
        destination: (req,file, cb) =>{
            cb(null, __dirname+'../../public/uploads/perfiles')
        },
        filename: (req, file, cb) =>{
            const extension = file.mimetype.split('/')[1];
            const Filename = `${shortid.generate()}-${shortid.generate()}.${extension}`;
            req.session.File = Filename;
            cb(null, Filename);
        }
    }),
    fileFilter(req,file,cb){
        if(file.mimetype === "image/jpeg" ||  file.mimetype === "image/png"){
            //El callback se ejecuta como true o false, true cuando la imagen se acepta
            cb(null,true);
        }else{
            cb(new Error('Formato no Válido'),false);
        }
    }
}

const upload = multer(configuracionMulter).single('imagen');


exports.subirImagen = (req,res,next) =>{
    upload(req,res, function(error){
        if(error){
            if(error instanceof multer.MulterError){
                if(error.code === "LIMIT_FILE_SIZE"){
                    req.flash('error', 'El archivo excede el tamaño máximo');
                }else{
                    req.flash('error', error.message);
                }
                return next();
            }else{
                req.flash('error',error.message);
            }
            return res.redirect('/administracion');
        }else{
            return next();
        }
        

    });
}

exports.validarRegistro = async(req,res, next) =>{

    /* Para un error
    const validacion = await body('nombre').not().isEmpty().withMessage('El nombre es obligatorio').escape().run(req);
    const errores = validationResult(req);
    */

    const rules = [
        body('nombre').not().isEmpty().trim().escape().withMessage('El nombre es obligatorio'),
        body('email').isEmail().withMessage('El email debe ser válido'),
        body('password').not().isEmpty().withMessage('La contraseña no puede ir vacía'),
        body('confirmar').not().isEmpty().withMessage('Confirmar contraseña no puede ir vacía'),
        body('confirmar').equals(req.body.password).withMessage('Las contraseñas no coinciden')
    ]

    await Promise.all(rules.map(validation => validation.run(req)));

    const errores = validationResult(req);
    
    if(errores.errors.length > 0){
        req.flash('error', errores.errors.map(error=>  error.msg));
        
        res.render('crear-cuenta', {

            nombrePagina: 'Crear tu cuenta en devJobs',
            tagLine: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta',
            mensajes: req.flash()

        });

        return;

    }

    next();

}

exports.crearUsuario = async(req,res,next) =>{

    const usuario = new Usuario(req.body);

    try{
        const nuevoUsuario = await usuario.save();
        res.redirect('/iniciar-sesion');
    }catch(error){
        req.flash('error', error);
        res.redirect('/crear-cuenta');
    }

}

exports.formularioIniciarSesion = (req,res) =>{
    res.render('iniciar-sesion', {
        nombrePagina: 'Iniciar sesión en DevJobs'
    });
}

exports.formularioEditarPerfil = (req,res) =>{
    
    const usuario = {
        nombre: req.user.nombre,
        email: req.user.email,
        imagen: req.user.imagen
    }

    res.render('editar-perfil',{
        nombrePagina: 'Edita tu perfil en DevJobs',
        usuario,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    });
    
}

exports.editarPerfil = async(req,res) =>{

    const usuario = await Usuario.findById(req.user._id);

    usuario.nombre = req.body.nombre;
    usuario.email = req.body.email;

    if(req.body.password){
        usuario.password = req.body.password;
    }
    if(req.session.File){
        usuario.imagen = req.session.File;
        //const FilePath = path.join(__dirname, '../','public/uploads/perfiles',req.session.File);
    }
    delete req.session.File;
    
    await usuario.save();

    req.flash('correcto', 'Cambios guardados correctamente');

    res.redirect('/administracion');

}

exports.validarEditarPerfil = async(req,res,next) =>{

        /* Para un error
    const validacion = await body('nombre').not().isEmpty().withMessage('El nombre es obligatorio').escape().run(req);
    const errores = validationResult(req);
    */

    const rules = [
        body('nombre').not().isEmpty().trim().escape().withMessage('El nombre es obligatorio'),
        body('email').isEmail().withMessage('El email debe ser válido').escape(),
    ]
    if(req.body.password){

        rules.push(body('password').not().isEmpty().escape());

    }

    await Promise.all(rules.map(validation => validation.run(req)));

    const errores = validationResult(req);
    
    if(errores.errors.length > 0){

        const usuario = {
            nombre: req.user.nombre,
            email: req.user.email
        }

        req.flash('error', errores.errors.map(error=>  error.msg));
        
        res.render('editar-perfil',{
            nombrePagina: 'Edita tu perfil en DevJobs',
            usuario,
            cerrarSesion: true,
            nombre: req.user.nombre,
            mensajes: req.flash()
        });

        return;

    }

    next();

}




