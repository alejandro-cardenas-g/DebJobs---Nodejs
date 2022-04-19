const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slug'); // Para generar url
const shortid = require('shortid');

const vacanteSchema = new mongoose.Schema(
    {
        bufferCommands: false,
        titulo:{
            type: String,
            required: 'El nombre de la vacante es obligatorio',
            trim: true
        },
        empresa:{
            type: String,
            trim: true
        },
        ubicacion:{
            type: String,
            trim: true,
            required: 'la ubicación es obligatoria'
        },
        salario:{
            type: String,
            default: 0
        },
        contrato:{
            type: String,
            trim: true
        },
        descripcion:{
            type: String,
            trim: true
        },
        url:{
            type: String,
            lowercase: true
        },
        skills: [String],
        candidatos: [{
            nombre: String,
            email: String,
            cv: String
        }],
        autor:{
           type: mongoose.Schema.ObjectId,
           ref: 'Usuario',
           required: 'El autor es obligatorio'
        }

    }
)
vacanteSchema.pre('save', function(next){
    const url = slug(this.titulo);
    this.url = `${url}-${shortid.generate()}`

    next();
})

//Crear un indice (Sirve para los buscadores)

vacanteSchema.index({
    titulo: 'text'
});

module.exports = mongoose.model('Vacante', vacanteSchema);