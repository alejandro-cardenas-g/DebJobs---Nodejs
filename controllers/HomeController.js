const mongoose = require('mongoose');
//Importar el modelo
const Vacante = mongoose.model('Vacante');

exports.mostrarTrabajos = async(req,res,next) =>{

    const vacantes = await Vacante.find().lean();
    
    if(!vacantes) return next();
    res.render('home', {
        nombrePagina: 'devJobs',
        tagLine: 'Encuentra y Publica trabajos para desarrolladores Web',
        barra: true,
        boton: true,
        vacantes: vacantes
    });
}