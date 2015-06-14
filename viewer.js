bind = function(target, func, add) {
	var context = target,
		called = func,
		agadd = add;
	return function() {
		args = [];
		if (agadd)
			args.push.apply(args, agadd);
		args.push.apply(args, arguments);
		return called.apply(context, args)
	};
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

viewer = function() { this.construct.apply(this, arguments); }
viewer.prototype = {
	width: 0,
	height: 0,
	parts: null,
	construct: function() {
		this.objLoader = new loader.obj(true);
		this.jsonLoader = new loader.json(true);
		this.element = document.getElementById('view');
		this.model = new THREE.Object3D();
		this.ui = new viewer.ui(this);
		document.body.appendChild(this.ui.getElement());
		
		this.parts = [];
		this.model.rotation.set(0.56, -0.71, 0);
		
		this.width = this.element.width;
		this.height = this.element.height;
		
		ResizeControl.onResize = bind(this, function(width, height) {
			this.element.width = width;
			this.element.height = height;
			this.width = width;
			this.height = height;
			this.renderer.setSize(width, height);
			this.camera.aspect = width / height;
			this.camera.updateProjectionMatrix();
		});
				
		this.prepareScene();
		ResizeControl.start();
		
		this.previousSelected = null;
		this.previousColor = null;
		
		this.element.onmousemove = bind(this, function(e) {
			var mouseVector = new THREE.Vector3(),
				raycaster = new THREE.Raycaster(),
				intersects = null;
			
			mouseVector.x = 2 * (e.clientX / this.width) - 1;
			mouseVector.y = 1 - 2 * ( e.clientY / this.height );
			mouseVector.z = 1;
			
			raycaster.setFromCamera(mouseVector, this.camera);
			
			var collisions = [];
			for(var i in this.parts) {
				var part = this.parts[i];
			
				if (part.loaded) {
					intersects = raycaster.intersectObjects( part.model.children );
					for(var x in intersects) {
						intersects[x].part = part;
					}

					if (intersects.length > 0)
						collisions.push.apply(collisions, intersects);
				}
			}
			
			if (collisions.length > 0) {
							
				collisions.sort(function(a, b) {
					return a.distance - b.distance
				});
				
				var obj = collisions[0],
					index = 1,
					armors = [],
					selected = null;
				
				while(!obj.part || !obj.part.armor[obj.object.name] || !obj.object.material.visible || obj.part.isSpaced(obj.object.name)) {
					if (obj.part.isSpaced(obj.object.name) && obj.object.material.visible) {
						armors.push({
							'armor': obj.part.getArmorValueAt(obj.object.name),
							'collision': obj
						});
						if (selected == null)
							selected = obj;
					}
					
					obj = collisions[index++];
					
					if (index >= collisions.length) {
						return;
					}
				}
				
				if (selected == null)
					selected = obj;
				
				//Add spaced armor
				var totol = 0,
					detail = "";
				for(var i = 0; i < armors.length; i++) {
					totol += armors[i].armor;
					detail += "<span class='spaced'>" + armors[i].armor + "</span> + ";
				}
					
				var armor = obj.part.armor[obj.object.name].value;
				if (detail.length > 0)
					detail += "<span class='normal'>" + armor + "</span>";

				this.ui.setArmor(armor + totol, armor);
				this.ui.setArmorDetail(detail);
				
				armors.push({
					'armor': armor,
					'collision': obj
				});
				
				var computed = 0,
					computed_detail = [],
					first_angle = -1;
				
				for(var i = 0; i < armors.length; i++) {
					var value = armors[i].armor,
						col = armors[i].collision,
						normal = col.face.normal,
						angle = 0;
						
					//Apply rotation
					var par = col.object;
					while(par != null) {
						normal.applyQuaternion(par.quaternion)
						par = par.parent;
					}
					
					angle = normal.angleTo(raycaster.ray.direction);
					value = Math.round(value / Math.cos(angle));
					computed += value;
					computed_detail.push(value);
					
					if (first_angle == -1)
						first_angle = angle;
				}
				
				this.ui.setArmorComputed(computed);
				this.ui.setArmorComputedDetail(computed_detail.length > 1 ? computed_detail.join(" + ") : "");
				this.ui.setArmorAngle(Math.round((first_angle / Math.PI) * 180));
				
				if (selected.object != this.previousSelected) {
					if (this.previousSelected != null) {
						this.previousSelected.material.color = this.previousSelectedColor;
					}
					
					this.previousSelected = selected.object;
					this.previousSelectedColor = selected.object.material.color;
				}
				
				this.render();
				return;
			}
			
			if (this.previousSelected != null) {
				this.previousSelected.material.color = this.previousSelectedColor;
				this.previousSelected = null;
				this.render();
				
				this.ui.setArmor('');
				this.ui.setArmorDetail('');
				this.ui.setArmorComputed('');
				this.ui.setArmorAngle('');
			}
		})
	},
	add: function(part) {
		this.parts.push(part);
	},
	addModel: function(model_url, armor_url, attach_to) {
		var part = new viewer.part();
		part.attachTo = attach_to;
		this.add(part);
		
		this.ui.loading.show();
		this.ui.loading.setText(_("Loading models..."));
		
		this.objLoader.load(model_url, bind([this,part], this.onModelLoad), bind([this,part], this.onModelProgress));
		this.jsonLoader.load(armor_url, bind([this,part], this.onDataLoad), bind([this,part], this.onDataProgress));
		
		return this.parts.length - 1;
	},
	onModelLoad: function(model) {
		this[1].setModel(model);
		this[0].check();
	},
	onModelProgress: function(e) {
		this[1].modelProgress = (e.loaded / e.total);
		this[0].updateProgress();
	},
	onDataLoad: function(data) {
		this[1].setData(data);
		this[0].check();
	},
	onDataProgress: function(e) {
		this[1].dataProgress = (e.loaded / e.total);
		this[0].updateProgress();
	},
	updateProgress: function() {
		var loaded = 0;
		for(var i in this.parts) {
			var part = this.parts[i];
			if (part.loaded) {
				loaded += 1;
			} else {
				loaded += part.modelProgress * 0.8 + part.dataProgress * 0.2;
			}
		}
		this.ui.loading.setProgress((loaded / this.parts.length)*100);
	},
	prepareScene: function() {
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( 75, this.width/this.height, 0.1, 50 );
		this.renderer = new THREE.WebGLRenderer({'canvas': this.element});
		this.renderer.setSize(this.width, this.height);
		
		var ambientLight = new THREE.AmbientLight( 0x555555 );
		this.scene.add( ambientLight );

		var lights = [];
		lights[0] = new THREE.PointLight( 0xffffff, 1, 0 );
		lights[1] = new THREE.PointLight( 0xffffff, 1, 0 );
		lights[2] = new THREE.PointLight( 0xffffff, 1, 0 );
		
		lights[0].position.set( 0, 200, 0 );
		lights[1].position.set( 100, 200, 100 );
		lights[2].position.set( -100, -200, -100 );

		this.scene.add( lights[0] );
		this.scene.add(this.model);
		this.render();
		
		this.controls = new controls.view(this.camera, this.model);
		this.controls.onUpdate = bind(this, this.render);
		
		this.tickerino = 0;
		setInterval(bind(this, this.tick), 1000 / 30);
	},
	render: function() {
		this.renderer.clear();
		this.renderer.render(this.scene, this.camera);
	},
	tick: function() {
		if (this.previousSelected != null) {
			var num = ((++this.tickerino) / 30) * 2 * Math.PI,
				col = 0.9 + Math.cos(num) * 0.1;
			this.previousSelected.material.color = new THREE.Color(col, col, col);
			this.render();
		}
	},
	reset: function() {
		for(var i in this.parts) {
			if (this.parts[i].loaded)
				this.model.remove(this.parts[i].model);
		}
		this.parts = [];
	},
	check: function() {
		for(var i in this.parts)
			if (!this.parts[i].loaded)
				return;
		
		this.ui.loading.hide();
		
		var values = [];
		
		for(var i in this.parts) {
			if (!this.parts[i].loaded)
				return;
			var part = this.parts[i];
			for(var i in part.armor) {
				if (values.indexOf(part.armor[i].value) == -1) {
					values.push(part.armor[i].value);
				}
			}
		}
		
		this.ui.setScale(values);
		
		for(var i in this.parts) {
			var part = this.parts[i],
				context = this;
			
			part.model.traverse(bind(part, function(node) {
				if(node.material) {
					node.material = new THREE.MeshBasicMaterial({color: 0xaaaaaa, wireframe: false});
					node.material.side = THREE.DoubleSide;
					if (this.armor[node.name]) {
						node.material.color = context.ui.scale.getColor(
							this.getArmorValueAt(node.name), part.isSpaced(node.name)
						);
					}
				}
				if (node.geometry) {
					node.geometry.computeFaceNormals();
					node.geometry.computeVertexNormals();
				}
			}));

			if (part.transform) {
				if (i == 1) {
					this.camera.y = part.transform[1];
				}
				part.model.position.add(new THREE.Vector3(
					part.transform[0],
					part.transform[1],
					part.transform[2]
				));
			}
			
			if (part.attachTo)
				this.parts[part.attachTo].model.add(part.model);
			else
				this.model.add(part.model);
		}
		
		this.render();
	},
	
	setPartVisible: function(part_index, flag) {
		if (!this.parts[part_index].loaded)
			return false;
		
		this.parts[part_index].model.traverse(function(node) {
			if (node.material)
				node.material.visible = flag;
		});
		
		this.render();
		
		return true;
	},
	
	setSpacedVisible: function(flag) {
		for(var i in this.parts) {
			this.parts[i].setSpacedVisible(flag);
		}
		this.render();
	},
	
	getCenter: function() {
		var box = {
			x: [0,0],
			y: [0,0],
			z: [0,0]
		};
		
		this.model.traverse(function(node) {
			if (node.geometry) {
				var geometry = node.geometry;
				geometry.computeBoundingBox();
				if (geometry.boundingBox.min.x < box.x[0])
					box.x[0] = geometry.boundingBox.min.x;
				if (geometry.boundingBox.max.x > box.x[1])
					box.x[1] = geometry.boundingBox.max.x;
				if (geometry.boundingBox.min.y < box.y[0])
					box.y[0] = geometry.boundingBox.min.y;
				if (geometry.boundingBox.max.y > box.y[1])
					box.y[1] = geometry.boundingBox.max.y;
			}
		});
		
		var centerX = 0.5 * ( box.x[ 1 ] - box.x[ 0 ] );
		var centerY = 0.5 * ( box.y[ 1 ] - box.y[ 0 ] );
		var centerZ = 0.5 * ( box.z[ 1 ] - box.z[ 0 ] );
		
		return new THREE.Vector3(
			0.5 * ( box.x[ 1 ] - box.x[ 0 ] ),
			0.5 * ( box.y[ 1 ] - box.y[ 0 ] ),
			0.5 * ( box.z[ 1 ] - box.z[ 0 ] )
		);
	}
}

viewer.part = function() { this.construct.apply(this, arguments); }
viewer.part.prototype = {
	armor: null,
	model: null,
	maxArmor: -1,
	minArmor: -1,
	loaded: false,
	
	modelProgress: 0,
	dataProgress: 0,
	
	construct: function() {},
	setLoaded: function(loaded) {
		this.loaded = loaded;
	},
	setModel: function(model) {
		this.model = model;
		
		if (this.armor != null)
			this.setLoaded(true);
	},
	setData: function(data) {
		this.armor = data.armor;
		this.transform = data.transform || null;

		for(var i in this.armor) {
			this.armor[i].value = parseInt(this.armor[i].value);
			this.armor[i].spaced = parseInt(this.armor[i].spaced);
			if (this.maxArmor == -1 || this.armor[i].value > this.maxArmor)
				this.maxArmor = this.armor[i].value;
			if (this.minArmor == -1 || this.armor[i].value < this.minArmor)
				this.minArmor = this.armor[i].value;
		}
		
		if (this.model != null)
			this.setLoaded(true);
	},
	getArmorAt: function(index) {
		return this.armor[index] ? this.armor[index] : null;
	},
	getArmorValueAt: function(index) {
		return this.armor[index] ? this.armor[index].value : null;
	},
	isSpaced: function(index) {
		return this.armor[index] ? this.armor[index].spaced : null;
	},
	hasArmor: function(index) {
		return typeof(this.armor[index]) !== "undefined";
	},
	setSpacedVisible: function(flag) {
		var ctx = this;
		this.model.traverse(function(node) {
			if (node.name && ctx.hasArmor(node.name)) {
				if (ctx.isSpaced(node.name)) {
					node.material.visible = flag;
				}
			}
		});
	}
}

window.onload = function() {
	Viewer = new viewer();
	
	/*Chassis = Viewer.addModel("models/chassis.obj.z", "models/Chassis_Ch01_Type59_2.armor.z");
	Hull = Viewer.addModel("models/hull.obj.z", "models/hull.armor.z", Chassis);
	Turret = Viewer.addModel("models/Turret_1_Ch01_Type59_2.obj.z", "models/Turret_1_Ch01_Type59_2.armor.z", Hull);
	Gun = Viewer.addModel("models/_100mm_59.obj.z", "models/_100mm_59.armor.z", Turret);
	Viewer.ui.setTankName("Type 59");*/
}