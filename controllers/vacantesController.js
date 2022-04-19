const mongoose = require('mongoose');
//Importar el modelo
const Vacante = mongoose.model('Vacante');
//const Vacante = require("../models/Vacantes.js")
const {body, validationResult} = require('express-validator');
const { promise } = require('bcrypt/promises');

const multer = require('multer');
const shortid = require("shortid");

exports.formularioNuevaVacante = (req,res) =>{

    res.render('nueva-vacante', {
        nombrePagina: 'Nueva Vacante',
        tagLine: 'Llena el formulario y crea una vacante',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    });

}

exports.agregarVacante = async(req,res) =>{

    const vacante = new Vacante(req.body);

    //usuario autor

    vacante.autor = req.user._id;

    //Crear arreglo de skills
    vacante.skills = req.body.skills.split(",");
    console.log(vacante);
    //Guardar en la base de datos

    const nuevaVacante = await vacante.save();


    res.redirect(`/vacantes/${nuevaVacante.url}`);
    
}

exports.mostrarVacante = async(req,res,next) => {

    const vacante = await Vacante.findOne({url: req.params.url}).populate('autor').lean();
    
    if(!vacante) return next();

    res.render('vacante',{
        vacante,
        nombrePagina: vacante.titulo,
        barra: true
    });

} 

exports.formularioEditarVacante = async(req,res,next)=>{
    
    const vacante = await Vacante.findOne({url: req.params.url}).lean();
    
    if(!vacante) return next();

    res.render('editar-vacante', {
        vacante,
        nombrePagina: `Editar - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })

}

exports.editarVacante = async(req,res) =>{

    const vacanteActualizada = req.body;
    vacanteActualizada.skills = req.body.skills.split(",");

    const vacante = await Vacante.findOneAndUpdate({url: req.params.url}, 
        vacanteActualizada,
        {
            new: true,
            runValidators: true
        });

        res.redirect(`/vacantes/${vacante.url}`);

}

exports.validarVacante = async(req,res,next) =>{
    console.log(req.body);
    rules = [
        body('titulo').not().isEmpty().escape().withMessage('Agrega un titulo a la vacante'),
        body('empresa').not().isEmpty().escape().withMessage('Agrega una Empresa'),
        body('ubicacion').not().isEmpty().escape().withMessage('Agrega una ubicación'),
        body('contrato').not().isEmpty().escape().withMessage('Selecciona el tipo de contrato'),
        body('skills').not().isEmpty().withMessage('Agrega al menos una habilidad'),
    ];

    await Promise.all(rules.map(validation => validation.run(req)));

    const errores = validationResult(req);
    console.log(errores.errors.length);
    if(errores.errors.length > 0){

        req.flash('error', errores.errors.map(error => error.msg));

        res.render('nueva-vacante',{
            nombrePagina: 'Nueva Vacante',
            tagLine: 'Llena el formulario y crea una vacante',
            cerrarSesion: true,
            nombre: req.user.nombre,
            mensajes: req.flash()
        });

    }else{
        next();
    }




}

exports.eliminarVacante = async(req,res) =>{

    const id = req.params.id;
    
    const vacante = await Vacante.findById(id);

    if(verificarAutor(vacante, req.user)){
        //Todo bien, si es el usuario, si eliminar
        vacante.remove();
        res.status(200).send("Vacante Eliminada correctamente");
    }else{
        // No permitido
        res.status(403).send("Error");
    }



}

const verificarAutor = (vacante = {}, usuario = {}) =>{

    if(vacante.autor.equals(usuario._id)){
        return true;
    }
    return false;

}

//Subir archivos  en pdf

const configuracionMulter = {
    limits: {
        fileSize : 1000000
    },
    storage: fileStorage = multer.diskStorage({
        destination: (req,file, cb) =>{
            cb(null, __dirname+'../../public/uploads/cv')
        },
        filename: (req, file, cb) =>{
            const extension = file.mimetype.split('/')[1];
            const Filename = `${shortid.generate()}-${shortid.generate()}.${extension}`;
            req.session.FileCV = Filename;
            cb(null, Filename);
        }
    }),
    fileFilter(req,file,cb){
        if(file.mimetype === "application/pdf"){
            //El callback se ejecuta como true o false, true cuando la imagen se acepta
            cb(null,true);
        }else{
            cb(new Error('Formato no Válido'),false);
        }
    }
}

const upload = multer(configuracionMulter).single('cv');

exports.subirCV = (req,res,next) =>{
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
            res.redirect('back');
            return;
        }else{
            return next();
        }
        

    });
}

//Almacenar los candidatos en la base de datos

exports.contactar = async(req,res,next)=>{

    const vacante = await Vacante.findOne({url: req.params.url});

    if(!vacante){
        return next();
    }

    var nuevoCandidato = {
        nombre: req.body.nombre,
        email: req.body.email
    }

    if(req.session.FileCV){
        nuevoCandidato.cv = req.session.FileCV;
    }

    delete req.session.FileCV;

    vacante.candidatos.push(nuevoCandidato);
    await vacante.save();

    //Mensaje Flash y redirección

    req.flash('correcto', 'Se envió tu CV correctamente');

    res.redirect('/');

}

exports.mostrarCandidatos = async(req,res,next)=>{

    const vacante = await Vacante.findById(req.params.id).lean(); 

    console.log(vacante.empresa);

    if(vacante.autor != req.user._id.toString()){
        return next();
    }

    if(!vacante){
        return next;
    }

    res.render('candidatos', {
        nombrePagina: `Candidatos Vacante -${vacante.titulo}`,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        candidatos: vacante.candidatos
    });

}

exports.buscarVacantes = async(req,res) =>{

    const vacantes = await Vacante.find({
        $text:{
            $search: req.body.q
        }
    }).lean();

    res.render('home', {
        nombrePagina: `Resultado para la busqueda: ${req.body.q}`,
        barra: true,
        vacantes
    })

}