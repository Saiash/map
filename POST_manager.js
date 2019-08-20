let fs = require('fs');
let db = require('./db');

class POST_manager {
  
  //Отдает в качестве ответа модель в памяти; при необходимости подгружает ее
  static load(data, game, response) {
    //it could be used more then once, and data will be updated by other function
    //no point in calling the file every time
    //if (!game[data.table]) {
      this.db.load(data.table, (result) => {
        game[data.table] = result;
        this.answer(game[data.table], response);
      }, data.conditions); 
    //} else {
      //this.answer(game[data.table], response);
    //}
  }
  
  //получает информацию об изменениях. Изменяет модель в памяти и записывает в базу.
  static save(data, game, response) {
    let changed_data = {};
    //exception for the first save. in other case, object had been loaded before
    game[data.table] = (game[data.table] == undefined) ? {"objects": {}} : game[data.table];     

    Object.keys(data.objects).map((object_id, index) => {
        game[data.table][object_id] = data.objects[object_id];
        changed_data[object_id] = data.objects[object_id];
    });        

    this.db.save(data.table, changed_data); 
    this.answer('Data saved!', response);
  }
  
  static note_load(data, game, response) {
    this.answer('Not actual', response);
  }
  
  static note_save(data, game, response) {
    this.answer('Not actual', response);
  }
  
  static answer(data, response) {
    data = JSON.stringify(data);
    response.write(data);
    response.end();
  }
}

POST_manager.db = db;
module.exports = POST_manager;