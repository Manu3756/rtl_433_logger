  const express = require('express');
  const expressWebSocket = require('express-ws');
  const app = express();
  const { spawn } = require('child_process');
  const ls = spawn('rtl_433',['-G','-F','json']);
  var through2 = require('through2')
  var split2 = require('split2')
  const createCsvWriter = require('csv-writer').createObjectCsvWriter;
  const csvWriter = createCsvWriter({
      path: './logs/'+new Date().toISOString()+'.csv',
      header: [
          {id: 'model', title: 'MODEL'},
          {id: 'sensor', title: 'SENSOR'},
          {id: 'temp', title: 'TEMPERATURE'},
                {id: 'uom', title: 'UNIT'},
          {id: 'hum', title: 'HUMIDITY'}
      ]
  });



     // returns a promise

  expressWebSocket(app, null, {
      // ws options here
      perMessageDeflate: false,
  });
  var stream = through2({ objectMode: true }, function(chunk, enc, callback) {
      var string = chunk.toString()
      try{
      var oData = JSON.parse(string)
      let records = [
          {model: oData.model,  sensor: oData.device || oData.channel, temp:oData.temperature_F || oData.temperature_C,uom:oData.temperature_F ? 'F':'C',hum:oData.humidity},
      ];
      csvWriter.writeRecords(records)
    }catch(e){}
      this.push(chunk.toString())
      callback()
  })

  ls.stdout
      .pipe(split2())
      .pipe(stream)

  app.ws('/rtl/raw', function(ws, req) {
  stream.on('data',data =>{
    try{  ws.send(data)
    }catch(e){
      ws.close()
    }

  })
  });
  fs = require('fs')
  app.get('/logs',function(req,res){
    fs.readdir('./logs', (err, files) => {
    res.end(JSON.stringify(files))
    });

  })

  app.get('/download/:id', function(req, res){
    console.log(req.params.id)
    const file = `${__dirname}/logs/`+req.params.id;
    res.download(file); // Set disposition and send it.
  });

  app.use('/web', express.static('web'));
  app.listen(3000);
