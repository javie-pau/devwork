const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const bcrypt = require('bcrypt');

const usuarioSchema = new mongoose.Schema({
    email:{
        type:String,
        unique:true,
        lowercase:true,
        trim: true,
    },
    nombre:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required: true,
        trim: true
    },
    token:String,
    expira:Date,
    imagen:String

});

//Método para hashear los password
usuarioSchema.pre('save', async function(next){
    //Si el password ya esta hasheado
    if(!this.isModified('password')){
        return next(); //deten la ejecución
    }
    //Si no esta hashado 
    const hash = await bcrypt.hash(this.password,12);
    this.password = hash;
    next();
});

//Envia alerta cuando un usuario ya esta registrado 
usuarioSchema.post('save',function(error, doc, next){
    if(error.name ==='MongoError' && error.code === 11000){
        next('Ese correo ya esta registrado');
    }else{
        next(error);
    }
});

//Autenticar Usuarios
usuarioSchema.methods ={
    compararPassword:function(password){
        return bcrypt.compareSync(password, this.password);
    }
}


module.exports = mongoose.model('Usuarios',usuarioSchema);