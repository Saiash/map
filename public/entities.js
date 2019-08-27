var color = {};
color['green'] = {r: 5, g: 188, b: 5};
color['yellow'] = {r: 235, g: 235, b: 0};
color['orange'] = {r: 232, g: 131, b: 0};
color['blue'] = {r: 0, g: 200, b: 200};
color['white'] = {r: 223, g: 223, b: 223};
color['red'] = {r: 188, g: 0, b: 0};
color['black'] = {r: 76, g: 76, b: 76};
color['purple'] = {r: 72, g: 0, b: 255};
color['brown'] = {r: 127, g: 51, b: 0};
color['nocolor'] = {r: 255, g: 255, b: 255}; 

var time = 0;  
 
class entity {   
  
  constructor (data, draw = true) {  
      this.core_fields = ['type', 'x', 'y', 'id', 'color', 'size', 'note'];
      this.core_fields.map((field)=>{
        this[field] = data[field];
      });
      this.image = data.image;
      this.image.crossOrigin = "Anonymous";
      this.image.setAttribute('crossOrigin', '');
    
      this.token = false;
      var image_type = this.type;
      if (data.type.indexOf('__token') != -1) { 
        image_type = data.type.split('__token')[0]; 
        this.token = true;
      }
      
      this.canvas_object = null;
      this.selected = false; 
      this.drawed = false;  
  }
  
  prepare_to_draw() {
      this.width = this.image.width*this.size;
      this.height = this.image.height*this.size;
      if (this.width < 20) {
        this.width = 20;
        var proportion = this.image.width/this.width;
        this.height = this.image.height/proportion;
      }
      this.border = null;
      if (this.canvas_object != null) {  
        this.canvas_object.destroy();
      }
  }
  
  set_canvas_object(obj) {
    if (this.canvas_object != null) {  
      this.canvas_object.destroy();
    }
    this.canvas_object = obj;
    this.canvas_object.on('dragend', (e) => {
      this.x = this.canvas_object.x();
      this.y = this.canvas_object.y();
    });
  }
  
  select(draw = true) {
    this.selected = true; 
    if (draw) {
    }
    $('.game_log_header').html("Selected unit#" + this.id);
    $('.game_log_text').val(this.notes);
  }
  
  deselect() {
    this.selected = false;
    this.border = null;
    this.x = this.canvas_object.x();
    this.y = this.canvas_object.y(); 
  }
  
  //не используется в данный момент
  resize(new_size) {
    this.size = new_size;
    //должна вызываться из контроллера и там же пересылаться в канвас
  }

  coord_x(val) {
    if (val == undefined) {
      return this.x;
    } else {
      this.x = val;
      if (this.border != null) {
        this.border.x(val-5);
      }
      this.canvas_object.x(val);
    }
  }
  
  coord_y(val) {
    if (val == undefined) {
      return this.y;
    } else {
      this.y = val;
      if (this.border != null) {
        this.border.y(val-5);
      }
      this.canvas_object.y(val);
    }
  }

  change_color(color) {
    this.color = color;
  }   
  
  prepare_save_data(note = "") {
    if (note) {
      this.note = note;
    }
    let save_data = {};
    this.core_fields.map((field) => {
      save_data[field] = this[field];
    });
    return save_data;
  }
}

var rgbToHex = function (rgb) {   
  var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
       hex = "0" + hex;
  }
  return hex;
};  

class entity_manager {
  
  constructor (canvas_manager) {
    this.canvas_manager = canvas_manager;
    this.id = 0;
    this.list = {};
    this.selected = {};
  }
  
  set_images_collection(obj) {
    this.images = obj;
  }
  
  create_object (data, draw = true) {
    data.image = this.images[data.type];
    if (!data.id || data.id <= this.id) {
        data.id = this.id++;
    } else {
        if (data.id > this.id) {
          this.id = data.id;
        }
    }
    this.list[data.id] = new entity(data);
    if (draw) {
      this.draw_object(data.id);
      this.canvas_manager.redraw();
    }
  }
  
  draw_object(ID) {
    this.list[ID].prepare_to_draw();
    this.list[ID].set_canvas_object(this.canvas_manager.draw_object(this.list[ID]));
    this.game.log_message("Новый объект","Создан объект #"+this.id+", "+this.type+": "+this.x+":"+this.y);
  } 
  
  click(entity) {
    (entity.selected) ? this.deselect(entity.id) : this.select(entity.id);
  }
  
  select(id, draw = true) {
    let entity = this.list[id];
    entity.select();
    this.game.log_message("Выбран объект", "#" + entity.id);
    this.selected[entity.id] = entity;
    this.game.set_selector_value('entity_id', 'val', entity.id);
    this.game.set_selector_value('game_log_text', 'val', entity.note);
    this.canvas_manager.select(entity, draw);
  } 
  
  deselect(id, draw = true) {
    let entity = this.list[id];
    entity.deselect();
    this.canvas_manager.deselect(entity, draw);
    delete this.selected[entity.id];
  } 
  
  delete_entity (id) {
    this.canvas_manager.delete(this.list[id].canvas_object);
    delete this.list[id];
    delete this.selected[id];
  }
  
  delete_selected() {
    Object.keys(this.selected).map(id => {
      this.delete_entity(id);
    });
    this.canvas_manager.redraw();
  }
  
  delete_all() {
    delete this.list;
    this.list = {};
    delete this.selected;
    this.selected = {};
    this.canvas_manager.delete_all();
    this.id = 0;
  }
  
  prepare_save_data(entity_id = 0, note = "") {
    let save_data = {};
    if (!entity_id) {
      Object.keys(this.list).map(id => {
        save_data[id] = this.list[id].prepare_save_data();
      });
    } else {
      save_data[entity_id] = this.list[entity_id].prepare_save_data(note);
    }
    return save_data;
  }
   
  deselect_all() {
    Object.keys(this.selected).map(id => {
      this.deselect(id, false);
    });
    this.canvas_manager.redraw();
  }
  
  select_all(coords) {
    this.deselect_all();
    Object.keys(this.list).map(id => {
        if (this.list[id].x > coords['x1'] && this.list[id].x < coords['x2'] &&
          this.list[id].y > coords['y1'] && this.list[id].y < coords['y2']) {
          this.select(id, false);
        } 
    });
    this.canvas_manager.redraw();
  }
  
  change_color(color) { 
    //немного магии. в норме в качестве аргумента будет приходить Event от клика на кнопку
    //но остается возможность использовать и название цвета
    if (color['target']) {
      color = $(color.target).data('color');
    }
    Object.keys(this.selected).map(id => {
      this.list[id].change_color(color);
      this.list[id].prepare_to_draw();
      this.list[id].set_canvas_object(this.canvas_manager.draw_object(this.list[id]));
      this.deselect(id, false);
    });
    this.canvas_manager.redraw(); 
  }
  
  move_selected(x, y) {
    Object.keys(this.selected).map(id => {
        this.selected[id].coord_x(this.selected[id].coord_x() + x);
        this.selected[id].coord_y(this.selected[id].coord_y() + y);
    });
  }

  form_statistic() {
    let info = {};
    Object.keys(this.list).map(id => {
      let entity = this.list[id];
      if (!info[entity.color]) {
        info[entity.color] = {};
        info[entity.color].notes = [];
      }
      if (!info[entity.color][entity.type]) {
        info[entity.color][entity.type] = 0;
      }
      info[entity.color][entity.type]++;
      if (entity.notes) {
        info[entity.color].notes.push(">> "+entity.notes);
      }
    });
    let text = '';
    Object.keys(info).map(color => {
      text += color + ": \n";
      Object.keys(info[color]).map(param => {
        if (param == 'notes') {
          text += name + ": \n";
          text += info[color][param].join("\n") + "\n";
        } else {
          text += param + ": " + info[color][param] + "; ";
        }
      });
      text += "\n-------------------------------\n";
    });
    console.log('success!');
    $('.game_log_text').val(text);
  }
  
}