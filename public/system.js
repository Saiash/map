class controls {
  
    constructor(canvas_manager, entity_manager) {
      this.button_keys = {"ctrlDown": false,
        "ctrlKey": 17,
        "cmdKey": 91,
        "vKey": 86,
        "cKey": 67,
        "delKey": 46,
        'left': 37,
        'up': 38,
        'right': 39,
        'down': 40,};
      this.buffer = {};
      this.entity_manager = entity_manager;
      this.canvas_manager = canvas_manager;
      this.selectors = {};
      this.variables = {};
      this.server_id = 0;
      entity_manager.game = this;
      canvas_manager.game = this;
      
      this.images = {};
      
      this.canvas_manager.set_object_manager(this.entity_manager);
      
      
      this.key_controlls();
    }

    connect(data) {
      let xhr = new XMLHttpRequest();
      xhr.open("POST", "https://delirious-kettle.glitch.me/", true);
      xhr.setRequestHeader('Content-Type', 'form-data');
      xhr.send(data);
      return xhr;
    }
  
    load(server_id) {
        this.load_select_options(server_id);
        let preload = new Promise((resolve, reject) => {
          this.load_images({0: ['server', 'eq', server_id]}, () => {
            this.canvas_manager.set_images_collection(this.images);
            this.entity_manager.set_images_collection(this.images);
            resolve();
          });
        });
        preload.then(result => {
          this.set_selector_value('log_id', 'val', server_id);
          this.server_id = server_id;
          this.entity_manager.delete_all(); 
          this.canvas_manager.load_map(server_id);

          this.db_select('objects_' + server_id,'', data => {
            Object.keys(data).map((id, index) => {
              if (!data[id].size) {
                data[id].size = 0.4;
              }
              this.entity_manager.create_object(data[id], true);
              this.log_message("Загрузка", "Загружено сохранение №" + server_id);
            });
            this.canvas_manager.redraw();
          });
        });
    }
  
    load_images(condition, callback) {
      this.db_select('images', condition, data => {
        Object.keys(data).map(id => {
          let image = new Image();
          image.crossOrigin = "Anonymous";
          image.addEventListener("load", () => {
            /*ready_count++;
            $('.load_status').width(ready_count*100/total_count+"%");
            //$('.loading_in_progress').html('Идет загрузка, '+ready_count + " / " + total_count+"...");
            if (ready_count >= total_count ) {
              $('.loader').addClass('hidden');

              //$('.loading_in_progress').remove();
            }*/
            this.images[data[id].type] = image;
            this.log_message("Идет загрузка...", 'Загруженно ' + Object.keys(this.images).length/Object.keys(data).length*100+'%');
            if (Object.keys(this.images).length == Object.keys(data).length) {
              callback();
            }
          });
          image.src = data[id].src;
        });
      });
    }
  
    load_select_options(server_id) {
      this.db_select('images', {0: ['server', "eq", server_id], 1: ['name' , "neq", "карта"]}, data => {
        Object.keys(data).map(id => {
          let newOption = new Option(data[id].name, data[id].type, false, false);
          $('.add_object').append(newOption);
        });
      });
    } 
  
    db_select(table, conditions, callback) {
      let xhr = this.connect(JSON.stringify({method: "load", table: table, conditions: conditions}));
      let load_promise = new Promise(function(resolve, reject) {
        xhr.onload = function() {
          resolve(this.responseText);
        }
      });
      load_promise.then(result => {
        let data = JSON.parse(result);
        callback(data);
      });
    }
  
    db_add(table, objects) {
      let xhr = this.connect(JSON.stringify({method: 'save', table: table, objects: objects}));
    }
  
    save(server_id, entity_id = 0) {
      let data;
      if (entity_id) {
        data = this.entity_manager.prepare_save_data(entity_id, this.get_selector_value('game_log_text'));
      } else {
        data = this.entity_manager.prepare_save_data();
      }
      this.db_add("objects_" + server_id, data)
      this.log_message("Сохранение","Сделано сохранение №" + server_id);
    }
  
    copy() {
      this.buffer = {};
      let log_numbers = [];
      
      Object.keys(this.entity_manager.selected).map(id => {
          this.buffer[id] = this.entity_manager.list[id].prepare_save_data();
          log_numbers.push(id);
      })
      this.log_message("Копирование","Скопированы объекты " + log_numbers.join(', '));
    }

    paste() {
        Object.keys(this.buffer).map(id => {
            this.buffer[id].x +=25;
            this.buffer[id].y +=25;
            this.entity_manager.create_object(this.buffer[id], true);
        });
        this.entity_manager.deselect_all();
        this.canvas_manager.redraw();
    }
  
    delete() {
        this.entity_manager.delete_selected();
        this.log_message("Удаление","Удалены выбранные объекты");
    }
 
  select_changed() {
      if (this.canvas_manager.loaded) {
        let x = ($('.x_input').val()*1) ? $('.x_input').val()*1 : $('body').scrollLeft() + window.innerWidth/2;
        let y = ($('.y_input').val()*1) ? $('.y_input').val()*1 : $('body').scrollTop() + window.innerHeight/2;
        let size = $('.size_input').val()*1 ? $('.size_input').val()*1 : 0.4;
        this.entity_manager.create_object({'x': x, 'y':y, 'color':'nocolor', 'type': $(".add_object").val(), 'size': size}, true);
      }
  }
  
  set_selector(selector, variable_name, event = 'click') {
    let callback_function;
    let value = "";
    let args = [];
    this.variables[variable_name] = $(selector);
    switch (variable_name) {
      case 'load': case 'save': case 'select_changed': 
        callback_function = variable_name;
        args.push(['get_selector_value','server_id']);
        break; 
      case 'save_note':
        callback_function = 'save';
        args.push(['get_selector_value', 'server_id']);
        args.push(['get_selector_value', 'entity_id']);
        break; 
      case 'change_color':
        callback_function = ['entity_manager','change_color'];
        break;
      case 'download':
        callback_function = variable_name;
        args.push(['real','map.jpg']);
        args.push(['get_map_data','']);
        break;
      case 'statistic':
        callback_function = ['entity_manager','form_statistic'];
        args.push(['get_selector_value', 'server_id']);
        break;
      case 'calculate_coordinats':
        callback_function = variable_name;
        break;
      case 'menu_buttons':
        callback_function = 'toggle_buttons';
        break;
      case 'game_log_text':
        callback_function = 'game_log_text';
        break;
      default:
        return; 
    }
    let controller = this;
    //для корректного определения события, необходимо, что бы у функции была своя область видимости
    this.variables[variable_name].on(event, function (e) {
      controller.aplly_call(callback_function, args, e)
    });
  }
  
  aplly_call(function_name, args, e) {
    
    let new_args = [];
    for (var i = 0, len = args.length; i < len; i++) {
      if (args[i][0] != 'real') {
        new_args.push(this[args[i][0]](args[i][1]));
      } else {
        new_args.push(args[i][1]);
      }
    }
    if (!i) {
      new_args.push(e);
    }
    if (!Array.isArray(function_name)) {
      this[function_name].apply(this, new_args);
    } else {
      this[function_name[0]][function_name[1]].apply(this[function_name[0]], new_args);
    }
  }
  
  get_map_data() {
    return this.canvas_manager.stage.toDataURL({format: 'jpg', multiplier: 1});
  }
  
  toggle_buttons(e) {
    if (!e.target) {
      return;
    }
    if ($(e.target).hasClass('active')) {
      $(e.target).removeClass('active');
    } else {
      let class_type = $(e.target).data('class');
      $('.main_menu button.active.' + class_type).trigger('click');
      $(e.target).addClass('active');
    }
  }
  
  calculate_coordinats(e) {
    let text = (e.pageX - $('.konvajs-content').offset().left) + ":" + (e.pageY - $('.konvajs-content').offset().top);
    this.set_selector_value('coords', 'html', text);
  }
  
  get_selector_value(variable_name) {
    return this.variables[variable_name].val();
  }
  
  set_selector_value(variable_name, method, value) {
    $(this.variables[variable_name])[method](value);
  }
  
  download(name, data) {
    //сторонняя бибилотека для загрузки файлов
    download(name, data);
  }
  
  game_log_text() {
    this.entity_manager.deselect_all();
    this.buffer = {};
  }
  
  log_message(header, text) {
    let date = new Date();
    let time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
    let template = $('.system_log_message_template').html();
    text = template.split('{{text}}').join(text)
                    .split('{{left_info}}').join(header)
                    .split('{{right_info}}').join(time);
    $('.system_log_text').prepend(text);
 }
  
  key_controlls() {
    $(document).keydown((e) => {
        if (e.keyCode == this.button_keys.ctrlKey || e.keyCode == this.button_keys.cmdKey) this.button_keys.ctrlDown = true;
      }).keyup((e) => {
          if (e.keyCode == this.button_keys.ctrlKey || e.keyCode == this.button_keys.cmdKey) this.button_keys.ctrlDown = false;
      });
      $(document).keydown((e) => {
        if (e.keyCode == this.button_keys.delKey) {
          this.delete();
        } else if (e.keyCode == this.button_keys.vKey) {
          this.paste();
        } else if (e.keyCode == this.button_keys.cKey) {
          this.copy();
        } else if (e.keyCode == this.button_keys.left) {
          this.canvas_manager.scroll(-10,0);
        } else if (e.keyCode == this.button_keys.right) {
          this.canvas_manager.scroll(10,0);
        } else if (e.keyCode == this.button_keys.up) {
          this.canvas_manager.scroll(0,-10);
        } else if (e.keyCode == this.button_keys.down) {
          this.canvas_manager.scroll(0,10);
        }
      })
      $(document).contextmenu((e) => {
        this.entity_manager.deselect_all();
        //return false;
      })
  }
}