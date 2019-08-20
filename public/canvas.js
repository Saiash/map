class Canvas {

	constructor (container_id, object_manager, images) {
		this.container = container_id;
		this.stage = new Konva.Stage({
	        container: container_id,
	        width: 100,
	        height: 100,
	    });
	    this.layer_map = new Konva.Layer();
      this.layer_objects = new Konva.Layer();
      this.selected_group = new Konva.Group({
        draggable: true
	    });
      this.selected_group.moveToTop();
	    this.select_border = null;
      this.loaded = false;
      this.select_border_mode = "off";
      this.layer_map.on('mousedown', (e) => {this.select_squre_create(e);});
      this.layer_map.on('mousemove', (e) => {this.select_squre_expand(e);});
      this.layer_map.on('mouseup', (e) => {this.select_squre_remove(e);});
      this.selected_group.on('dragend', (e) => {this.drag_result(e);});
	}
  
  set_object_manager(obj) {
    this.object_manager = obj;
  }
  set_images_collection(obj) {
    this.images = obj;
  }

	select_squre_create(e) {
		if (this.select_border) {
      this.select_border.remove();
    }
		this.select_border = new Konva.Rect({
			x: e.evt.layerX,
			y: e.evt.layerY, 
			width: 1,
			height: 1,
			stroke: 'yellow',
			dash: [2,2],
			strokeWidth: 1
		});
    this.select_border_mode = "on";
    this.layer_objects.listening(false);
    this.layer_objects.add(this.select_border);
    this.layer_objects.draw();
    this.stage.add(this.layer_objects);
	}

	select_squre_expand(e) {
		if (this.select_border_mode == "on"){
      this.select_border.width(e.evt.layerX - this.select_border.x());
      this.select_border.height(e.evt.layerY - this.select_border.y());
      this.layer_objects.add(this.select_border);
      this.layer_objects.batchDraw();
      this.stage.add(this.layer_objects);
    }
	}

	select_squre_remove(e) {
		this.select_border_mode = "off";
    let coords = {x1: this.select_border.x(), x2: this.select_border.width() + this.select_border.x(), y1: this.select_border.y(), y2: this.select_border.height() + this.select_border.y()};
    if (this.select_border.width() < 0 ) {
      coords.x1 = this.select_border.width() + this.select_border.x();
      coords.x2 = this.select_border.x();
    }
    if (this.select_border.height() < 0 ) {
      coords.y1 = this.select_border.height() + this.select_border.y();
      coords.y2 = this.select_border.y();
    }
    this.object_manager.select_all(coords);
    this.layer_objects.listening(true);
    this.select_border.remove();
    this.layer_objects.draw();
    this.stage.add(this.layer_objects);
	}

  drag_result(e) {
    let x = this.selected_group.x();
    let y = this.selected_group.y();
    this.object_manager.move_selected(this.selected_group.x(), this.selected_group.y());
    this.selected_group.x(0);
    this.selected_group.y(0);
    this.layer_objects.draw();
  }
  
  load_map(ID) {
    this.loaded = true;
    let map = this.images['map'+ID];
    let image = new Konva.Image({
        image: map,
        height: this.images['map'+ID].height,
        width: this.images['map'+ID].width,
    });
    this.stage.width(500);
    this.stage.height(500);
    //$('body').width((this.images['map'+ID].width+480)+'px');
    this.layer_map.add(image),
    this.layer_map.draw(),
    this.stage.add(this.layer_map);
  }
  
  draw_object(entity) {
    let canvas_object = new Konva.Image({
      draggable: true,
      x: entity.x,
      y: entity.y,
      image: entity.image,
      width: entity.width,
      height: entity.height,

      shadowColor: 'black',
      shadowBlur: 3,
      shadowOffset: { x: 0, y: 0 },
      shadowOpacity: 1,  

      borderSize: 1,   
      borderColor: '#ffffff'  
    });
    canvas_object.cache();
    if (entity.color != "nocolor") { 
      canvas_object.red(color[entity.color].r);
      canvas_object.green(color[entity.color].g);
      canvas_object.blue(color[entity.color].b);
      canvas_object.filters([Konva.Filters.RGB]);     
    }
    if (entity.token) { 
      canvas_object.filters([token_Border]);   
    }
    if (canvas_object.parent != undefined && canvas_object.parent != null) {
        canvas_object.moveToTop();       
    }
    this.layer_objects.add(canvas_object);
    if (entity.draw) {
      this.stage.add(this.layer_objects);
      entity.drawed = true;
    }
    canvas_object.on('click', () => {
      this.object_manager.click(entity);      
    }); 
    return canvas_object;
  }
  
  select(entity, draw = true) {
    let canvas_object = entity.canvas_object;
    canvas_object.attrs.shadowBlur = 0;
    canvas_object.attrs.shadowOpacity = 0;
    canvas_object.draw();

    if (entity.color == "nocolor") {
        canvas_object.filters([Border]); 
    } else {
        canvas_object.filters([Konva.Filters.RGB, Border]); 
    }
    if (entity.token) { 
        canvas_object.filters([token_Border,Border]);   
    }
    canvas_object.draggable(false); 
    canvas_object.moveTo(this.selected_group);
    this.layer_objects.add(this.selected_group);
    if (draw) {
      this.redraw();
    }
  }
  
  deselect(entity, draw = true) {
    let canvas_object = entity.canvas_object;
    canvas_object.moveTo(this.layer_objects);
    if (entity.color != "nocolor") {
        canvas_object.filters([Konva.Filters.RGB]); 
    } else {
        canvas_object.filters([]); 
    }
    if (entity.token) { 
        canvas_object.filters([token_Border]);   
    }
    canvas_object.attrs.shadowBlur = 3;
    canvas_object.draggable(true); 
    if (draw) {
      this.redraw();
    }
  }
  
  delete_all() {
    this.layer_objects.clear();      
    this.layer_objects.destroyChildren();
  }
  
  delete(obj) {
    obj.destroy();
  }
  
  select_all() {
    
  }
  
  redraw() {
    this.stage.add(this.layer_objects);
    this.layer_objects.draw();
    this.stage.draw();
  }
  
  scroll (x, y) {
    x = this.stage.x() - x;
    y = this.stage.y() - y;
    this.stage.x(x);
    this.stage.y(y);
    this.stage.batchDraw();
  }
}