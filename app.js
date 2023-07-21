// const qrcode = require('qrcode-terminal');
const qrcode = require('qrcode');

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require ('fs');
const path = require('path');

const { Client, LocalAuth } = require('whatsapp-web.js');

let client = new Client({
    authStrategy: new LocalAuth({
        dataPath : './session'
    })
});

const listenMessage = () =>{
    client.on('message', (msg) => {
       const {from, to, body} = msg;
       console.log({from, to , body});

        switch(body){
            case 'Hola mundo': 
                sendMessage(from, 'Hello how very much!!')
                break;
            case 'Hola informacion': 
                sendMessage(from, 'Hello how very much!!')
                break;
        }
    });
}

const sendMessage = (to, message) =>{
    client.sendMessage(to, message);
}


const withSession = () => {
  console.log('Iniciando sesión');

  return new Promise((resolve, reject) => {
    let qrCodeData = null;

    const generateQRCode = (qr) => {
      console.log('Escanea el código QR para iniciar sesión:');
      qrCodeData = qr;
      console.log(qrCodeData)
      resolve({ qrCode: qrCodeData });
    };
  
    client.on('authenticated', () => {
        console.log('Inicio de sesión exitoso!');

        listenMessage();
    });

    client.on('ready', async () => {
        console.log('WhatsApp Web está listo!');

        const status = 'Disponible'; // Estado que se va a establecer
        const profileStatus = await client.setStatus(status);
        console.log(`Estado del perfil establecido a: ${profileStatus}`);
    });

    //GENERAR CODIGO QR
    client.on('qr', generateQRCode);

    client.initialize();

    client.on('auth_failure', (msg) => {
      console.error('Error al iniciar sesión, elimina la carpeta "session" y vuelve a escanear el código', msg);
      reject(msg);
    });

    client.on('disconnected', (reason) => {
      console.log(`La sesión de WhatsApp se ha desconectado: ${reason}`);
    });
    });
};

const withOutSession = () =>{
    console.log("No tiene session iniciada")

    client.on('qr', qr => {
        console.log(qr);
        qrcode.generate(qr, {small: true});
    });

}

(fs.existsSync('./session'))? withSession() : withOutSession();


//CONEXION CON EL FRONT
app.use(cors());

app.use(
    bodyParser.json())

app.use(
    bodyParser.urlencoded({extended:true})) 

app.get('/app', (req, res) => {
    res.send({
        'nombre' : "simon"
    });
})

app.get('/qr', async (req, res) => {
    try {
      const result = await withSession();
      const qrCodeData = result.qrCode;
  
      res.send(qrCodeData);
      
    } catch (err) {
      console.error(err);
      res.status(500).send('Error generando el código QR');
    }
  });


const sendWithApi = (req, res) =>{
    const {message, to} = req.body;
    const newNumber = `${to}@c.us`
    console.log(message, to);

    sendMessage(newNumber, message);
    res.send({status: 'Enviado!'})
}

app.post('/app', sendWithApi)

// PUERTO Y URL
const port = 3150;
app.listen(port, ()=>{
    console.log(`Estoy ejecutandome en http://localhost:${port}/app`);
})
