viewer.ui = function() { this.construct.apply(this, arguments); }
viewer.ui.prototype = {
	elements: null,
	scale: null,
	viewer: null,
	dict: null,
	
	gunImage: "images/gun.png",
	turretImage: "images/turret.png",
	chassisImage: "images/chassis.png",
	infoImage: "images/info.png",
	
	listUrl: "tanks.php",
	tankImagesUrl: "../data/tanks/imgContur/",
	
	firstTank: null,
	
	construct: function(parent) {
		this.viewer = parent;
		
		this.elements = {};
		this.dict = {};
		
		this.scale = new viewer.ui.scale();
		this.loading = new viewer.ui.loading();
				
		this.menuTank = new menu("", "images/throbber.gif");
		this.menuChassis = new menu("", this.chassisImage);
		this.menuTurret = new menu("", this.turretImage);
		this.menuGun = new menu("", this.gunImage);
		this.menuInfo = new menu("More info", this.infoImage, [], bind(this, this.onInfo));
		
		this.checkSpaced = new viewer.ui.checkbox(_("Spaced armor"), bind(this, this.onCheckSpaced));
		this.checkChassis = new viewer.ui.checkbox(_("Chassis"), bind(this, this.onCheckChassis));
		this.checkTurret = new viewer.ui.checkbox(_("Turret"), bind(this, this.onCheckTurret));
		this.checkGun = new viewer.ui.checkbox(_("Gun"), bind(this, this.onCheckGun));
		this.checkHull = new viewer.ui.checkbox(_("Hull"), bind(this, this.onCheckHull));
		
		this.checkSpaced.setChecked(true);
		this.checkChassis.setChecked(true);
		this.checkTurret.setChecked(true);
		this.checkGun.setChecked(true);
		this.checkHull.setChecked(true);
		
		this.menu = new menu("", "", [
			this.menuTank,
			this.menuChassis,
			this.menuTurret,
			this.menuGun,
			this.menuInfo
		]);
		
		this.menuTank.add(new menu(_("Loading..."), "images/throbber.gif"));
		this.loadTanks();
		
		if (typeof(window.onpopstate) !== "undefined") {
			window.onpopstate = bind(this, function(e){
				if (e.state && this.dict && this.dict[e.state]) {
					this.onModelSelected(this.dict[e.state]);
				}
			});
		}
	},
	
	loadTanks: function() {
		$.getJSON(this.listUrl, bind(this, this.onTanksLoaded));
	},
	
	onTanksLoaded: function(tanks) {
		var selected = getParameterByName('tank');		
		this.firstTank = null;
		
		this.menuTank.clearItems();
		
		for(var nation in tanks) {
			var menu_nation = new menu(nation, "images/" + nation + "_small.png");
			this.menuTank.add(menu_nation);
			
			for(var vclass in tanks[nation]) {
				var menu_class = new menu(vclass, "images/" + (vclass ? vclass : 'unknown') + ".png");
				menu_class.getElement().className += ' tanks';
				menu_nation.add(menu_class);
				
				for(var i in tanks[nation][vclass]) {
					var tank = tanks[nation][vclass][i];
					menu_class.add(new menu(
						tank.name,
						this.tankImagesUrl + nation + "-" + tank.node + ".png",
						[],
						bind(this, this.onModelSelected, [tank])
					));
					
					this.dict[tank.node] = tank;
					
					if (selected == tank.node) {
						this.firstTank = tank;
					}
					
					if (!selected && this.firstTank == null) {
						this.firstTank = tank;
					}
				}
			}
		}
		
		if (this.viewer.parts.length == 0)
			this.onModelSelected(this.firstTank, true);
	},
	
	onInfo: function() {
		console.log("Redirection");

		window.open('../tank/' + this.currentModel.nation + '-' + this.currentModel.node);
	},
	
	onModelSelected: function(model, no_history) {
		var path = "models/" + model.nation + "/" + model.node + "/",
			chassis = model.chassis,
			turrets = model.turrets;
		
		var chass = null,
			turret = null,
			gun = null;
		
		document.title = 'WoT Tank Viewer - ' + model.name;
		
		if (!no_history && model != this.currentModel) {
			window.history.pushState(model.node,'Tank ' + model.name, "?tank=" + encodeURIComponent(model.node));
			this.currentModel = model;
		}
		
		this.menuChassis.clearItems();
		this.menuTurret.clearItems();
		this.menuGun.clearItems();
		
		this.menuTank.setText(model.name);
		this.menuTank.setImage(this.tankImagesUrl + model.nation + "-" + model.node + ".png");
		
		for(var i in chassis) {
			chass = chassis[i];
			
			this.menu.items[1].add(new menu(
				chass.name,
				this.chassisImage,
				[],
				bind(this, this.onChassisSelected, [chass])
			));
		}
		
		for(var i in turrets) {
			turret = turrets[i];
			
			this.menu.items[2].add(new menu(
				turret.name,
				this.turretImage,
				[],
				bind(this, this.onTurretSelected, [turret])
			));
			
			for(var g in turrets[i].guns) {
				gun = turrets[i].guns[g];
				
				this.menu.items[3].add(new menu(
					gun.name,
					this.gunImage,
					[],
					bind(this, this.onGunSelected, [gun])
				));
			}
		}
		
		this.menu.selectItem(null);

		this.loadModel(model, chass, turret, gun);
		
		this.onChassisSelected(chass, true);
		this.onTurretSelected(turret, true);
		this.onGunSelected(gun, true);
	},
	
	onChassisSelected: function(chassis, dont_load) {
		this.menuChassis.setText(chassis.name);
		this.menu.selectItem(null);
		
		if (!dont_load)
			this.loadModel(this.currentModel, chassis, this.currentTurret, this.currentGun);
	},
	
	onTurretSelected: function(turret, dont_load) {
		this.menuTurret.setText(turret.name);
		this.menu.selectItem(null);
		
		this.menuGun.clearItems();
		for(var g in turret.guns) {
			gun = turret.guns[g];
			
			this.menu.items[3].add(new menu(
				gun.name,
				this.gunImage,
				[],
				bind(this, this.onGunSelected, [gun])
			));
		}
		
		this.onGunSelected(gun, true);
		
		if (!dont_load)
			this.loadModel(this.currentModel, this.currentChassis, turret, gun);
	},
	
	onGunSelected: function(gun, dont_load) {
		this.menuGun.setText(gun.name);
		this.menu.selectItem(null);
		
		if (!dont_load)
			this.loadModel(this.currentModel, this.currentChassis, this.currentTurret, gun);
	},
	
	loadModel: function(model, chassis, turret, gun) {
		var path = "models/" + model.nation + "/" + model.node + "/";
		
		this.currentModel = model;
		this.currentChassis = chassis;
		this.currentTurret = turret;
		this.currentGun = gun;
		
		this.viewer.reset();
		
		this.chassisPart = this.viewer.addModel(path + "chassis.obj.z", path + chassis.node + ".armor.z");
		this.hullPart = this.viewer.addModel(path + "hull.obj.z", path + "hull.armor.z", this.chassisPart);
		this.turretPart = this.viewer.addModel(path + turret.node + ".obj.z", path + turret.node + ".armor.z", this.hullPart);
		this.gunPart = this.viewer.addModel(path + gun.node + ".obj.z", path + gun.node + ".armor.z", this.turretPart);
	},
	
	setScale: function(values) {
		this.scale.setValues(values);
	},
	setArmor: function(armor, sel_armor) {
		this.getElement();
		this.elements.armor.innerHTML = armor;
		this.scale.select(sel_armor);
	},
	setArmorDetail: function(armor) {
		this.getElement();
		this.elements.armorDetail.innerHTML = armor;
	},
	setArmorComputed: function(armor) {
		this.getElement();
		this.elements.armorComputed.innerHTML = armor;
	},
	setArmorComputedDetail: function(armor) {
		this.getElement();
		this.elements.armorComputedDetail.innerHTML = armor;
	},
	setArmorAngle: function(angle) {
		this.getElement();
		this.elements.armorAngle.innerHTML = angle + '&deg;';
	},
	setTankName: function(name) {
		this.elements.tankName.innerHTML = name;
	},
	
	onCheckSpaced: function() {
		this.viewer.setSpacedVisible(this.checkSpaced.checked);
	},
	
	onCheckChassis: function() {
		this.viewer.setPartVisible(this.chassisPart, this.checkChassis.checked);
	},
	
	onCheckTurret: function() {
		this.viewer.setPartVisible(this.turretPart, this.checkTurret.checked);
		this.viewer.setPartVisible(this.gunPart, this.checkGun.checked);
	},
	
	onCheckGun: function() {
		this.viewer.setPartVisible(this.gunPart, this.checkGun.checked);
	},
	
	onCheckHull: function() {
		this.viewer.setPartVisible(this.hullPart, this.checkHull.checked);
		this.viewer.setPartVisible(this.turretPart, this.checkTurret.checked);
		this.viewer.setPartVisible(this.gunPart, this.checkGun.checked);
	},
	
	getElement: function() {
		if (this.elements && this.elements.main)
			return this.elements.main;
		
		this.elements.armor = $e('div', 'armor-value');
		this.elements.armorDetail = $e('div', 'armor-detail');
		this.elements.armorComputed = $e('div', 'armor-computed');
		this.elements.armorComputedDetail = $e('div', 'armor-detail');
		this.elements.armorAngle = $e('div', 'armor-angle');
		
		this.elements.tankName = $e('div', 'tank-name');
		
		this.elements.main = $e('div', 'viewer-ui', [
			this.loading.getElement(),
			$e('div', 'info', [
				//this.elements.tankName,
				this.menu.getElement()
			]),
			$e('div', 'armor-scale', this.scale.getElement()),
			$e('div', 'display-control', [
				this.checkSpaced.getElement(),
				this.checkChassis.getElement(),
				this.checkHull.getElement(),
				this.checkTurret.getElement(),
				this.checkGun.getElement(),
			]),
			$e('div', 'armor', [
				$e('div', 'label', _('Armor')),
				this.elements.armor,
				this.elements.armorDetail,
				$e('div', 'unit', 'mm'),
				$e('div', 'label', _('With angle')),
				this.elements.armorComputed,
				this.elements.armorComputedDetail,
				$e('div', 'unit', 'mm'),
				$e('div', 'label', _('Angle')),
				this.elements.armorAngle,
			])
		]);
		
		return this.elements.main;
	}
}

viewer.ui.scale = function() { this.construct.apply(this, arguments); }
viewer.ui.scale.prototype = {
	element: null,
	armors: null,
	values: null,
	min: null,
	max: null,
	
	construct: function() {
		this.armors = {};
	},
	setValues: function(values) {
		values = values.sort(function(a, b) { return a - b });
		
		this.values = values;
		
		this.min = values[0];
		this.max = values[values.length - 1];
		
		this.getElement().innerHTML = '';
		for(var i = 0; i < values.length; i++) {
			var element = $e('div', 'point'),
				color = this.getColor(values[i], false),
				color_str = 'rgb(' + Math.round(color.r*255) + ',' + Math.round(color.g*255) + ',' + Math.round(color.b*255) + ')';
			element.style.backgroundColor = color_str;
			element.appendChild($e('div', 'text', values[i].toString()));
			this.armors[values[i]] = element;
			this.getElement().appendChild(element);
		}
	},
	
	getColor: function(armor, spaced) {
		var ratio = this.values.indexOf(armor) / (this.values.length - 1);
		return new THREE.Color(
			ratio,
			1 - ratio,
			spaced ? 0.8 : 0
		);
	},
	
	select: function(armor) {
		for(var i in this.armors) {
			this.armors[i].className = 'point';
		}
		if (this.armors[armor])
			this.armors[armor].className = 'point selected';
	},
	getElement: function() {
		if (this.element)
			return this.element;
		
		this.element = $e('div', 'armor-scale');
		return this.element;
	},
}

viewer.ui.loading = function() { this.construct.apply(this, arguments); }
viewer.ui.loading.prototype = {
	shown: false,
	text: null,
	progress: 0,
	elements: null,
	
	construct: function() {
		this.elements = {};
	},
	
	setText: function(text) {
		this.getElement();
		
		this.text = text;
		this.elements.text.innerHTML = text;
	},
	
	setProgress: function(percentage) {
		this.getElement();
		
		this.progress = percentage;
		this.elements.progress.innerHTML = Math.floor(percentage) + ' %';
		this.elements.bar.style.width = percentage + '%';
	},
	
	show: function() {
		this.getElement().style.display = 'block';
	},
	
	hide: function() {
		this.getElement().style.display = 'none';
	},
	
	getElement: function() {
		if (this.elements.main)
			return this.elements.main;
		
		this.elements.bar = $e('div', 'bar');
		this.elements.text = $e('div', 'text');
		this.elements.progress = $e('div', 'text-progress');
		
		this.elements.main = $e('div', 'loading', [
			$e('div', 'top-text', [
				this.elements.text,
				this.elements.progress
			]),
			$e('div', 'progress', this.elements.bar)
		]);
		
		return this.elements.main;
	}
}