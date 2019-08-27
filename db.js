let fs = require('fs');

class DataBase {
  
  static save(table, data, callback = () => {}) {
    this.pool[table] = (this.pool[table] === undefined) ? {"inProgress": false, "requests": []} : this.pool[table];
    this.pool[table].requests.push(data);
    if (this.pool[table].inProgress === false) {
      this.prepare_to_save(table, callback)
    }  
  }
  
  static prepare_to_save(table, callback) {
    this.pool[table].inProgress = true;
    let data = {};
    Object.keys(this.pool[table].requests).map((id, index) => {
      if (this.pool[table].requests[id].id) {
        data[this.pool[table].requests[id].id] = this.pool[table].requests[id];
      } else {
        Object.keys(this.pool[table].requests[id]).map((entity_id, index) => {
          let request = this.pool[table].requests[id][entity_id];
          data[entity_id] = request;
        });
      }
    });
    this.pool[table].requests = [];
    this.save_to_file(table, data, () => {
      this.pool[table].inProgress = false;
      if (this.pool[table].requests.length !== 0) {
        this.prepare_to_save(table, callback);
      }
    }); 
  }
  
  static save_to_file(table, data, callback) {
    const path = 'data/'+table+'.db';
    fs.readFile(path, {encoding: 'utf-8'}, (err, existingData) => {
      if (existingData) {
        existingData = JSON.parse(existingData);
        if (existingData.constructor === Object) {
          if (data.id) {
            let real_data = {};
            real_data[data.id] = data;
            data = real_data;
          }
          Object.keys(data).map(function(id, index) {
            if (data[id].id) {
              if (!data[id].delete) {
                existingData[id] = data[id];
              } else {
                delete existingData[id];
              }
            }
          });
          data = existingData; 
        }
      }
      fs.writeFile(path, JSON.stringify(data), callback);
    });
  }
  
  static load(table, callback = () => {}, conditions = []) {
    fs.readFile('data/'+table+'.db', {encoding: 'utf-8'}, (err, data) => {
      data = (data !== undefined) ? JSON.parse(data) : {};
      if (conditions) {
        //format - attr, operator, value
        Object.keys(data).map(id => {
          Object.keys(conditions).map(index => {
            let con = conditions[index];
            let result = true;
            if (data[id]) {
              switch (con[1]) {
                case ">": case 'more':
                  if (data[id][con[0]] < con[2]) {
                    result = false;
                  }
                  break;
                case "=": case "eq":
                  if (data[id][con[0]] != con[2]) {
                    result = false;
                  }
                  break;
                case "!=": case "neq":
                  if (data[id][con[0]] == con[2]) {
                    result = false;
                  }
                  break;
                case "<": case 'less':
                  if (data[id][con[0]] > con[2]) {
                    result = false;
                  }
                  break;
              }
              if (!result) {
                delete data[id];
              }
            }
          });
        });
      }
      callback(data);
    });
  }
  
}

DataBase.pool = {};
module.exports = DataBase;