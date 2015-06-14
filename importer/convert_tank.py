import os
import sys
import subprocess
import xml.etree.ElementTree as ET
import struct
import json
import zlib

def saveJson(filename, data, compress = False):
	with open(filename, 'wb') as out:
		if compress:
			out.write(zlib.compress(json.dumps(data, out)))
		else:
			json.dump(data, out)

def parseArmor(node):
	armor = {}
	for item in node:
		ident = item.tag
		value = item.text
		spaced = 0
		if item.find("vehicleDamageFactor") != None and float(item.find("vehicleDamageFactor").text) == 0:
			spaced = 1
		armor[ident] = { 'value': value, 'spaced': spaced }
	return armor

def isCompressedXML(path):
	with open(path, 'rb') as f:
		data = struct.unpack('I', f.read(4))[0]
		if data == 0x62a14e45:
			return True
		return False

def convertTank(xml_file, models_path, textures_path, target_path, compress = True, material = False, normals = False, uv = False):
	if isCompressedXML(xml_file):
		subprocess.call(["php", "xml-convert.php", xml_file, xml_file])
	
	tree = ET.parse(xml_file)
	xml = tree.getroot()
	
	hull_position = [0,0,0]
	turret_position = [0,0,0]
	gun_position = [0,0,0]
	
	compress_param = ""
	material_param = "-nm"
	normals_param = "-nvn"
	uv_param = "-nvt"
	object_ext = "obj"
	armor_ext = "armor"
	if compress:
		compress_param = "-c"
		object_ext = "obj.z"
		armor_ext = "armor.z"
	if material:
		material_param = ""
	if normals:
		normals_param = ""
	if uv:
		uv_param = ""

	chassis_file = None
	hull_file = None
	
	for item in xml.find("chassis"):
		ident = item.tag
		
		position = item.find("hullPosition").text.strip().split(' ')
		chassis_file = models_path + item.find("hitTester").find("collisionModel").text.strip().replace(".model", ".primitives")
		saveJson(target_path + "/" + ident + "." + armor_ext, { 'armor': parseArmor(item.find("armor")) }, compress)
		
		hull_position[1] = float(position[1])
		hull_position[2] = float(position[2])
		hull_position[0] = float(position[0])
	
	position = xml.find("hull").find("turretPositions").find("turret").text.strip().split(' ')
	hull_file = models_path + xml.find("hull").find("hitTester").find("collisionModel").text.strip().replace(".model", ".primitives")
	saveJson(target_path + "/hull." + armor_ext, {
		'armor': parseArmor(xml.find("hull").find("armor")),
		'transform': hull_position
	}, compress)
	
	turret_position[0] = float(position[0])
	turret_position[1] = float(position[1])
	turret_position[2] = float(position[2])
			
	if chassis_file == None:
		print "Unknown chassis file!"
		return False
		
	if hull_file == None:
		print "Unknown hull file!"
		return False
	
	subprocess.call([
		sys.executable, "convert-primitive.py",
		"-t", textures_path,
		"-o", target_path + "/chassis." + object_ext,
		compress_param,
		material_param,
		normals_param,
		uv_param,
		chassis_file
	])
	subprocess.call([
		sys.executable, "convert-primitive.py",
		"-t", textures_path,
		"-o", target_path + "/hull." + object_ext,
		material_param,
		normals_param,
		uv_param,
		compress_param,
		hull_file
	])

	""""-tx", " " + str(hull_position[0]),
		"-ty", " " + str(hull_position[1]),
		"-tz", " " + str(hull_position[2]),"""
	
	for turret in xml.find("turrets0"):
		ident = turret.tag

		position = turret.find("gunPosition").text.strip().split(' ')
		turret_file = models_path + turret.find("hitTester").find("collisionModel").text.strip().replace(".model", ".primitives")
		saveJson(target_path + "/" + ident + "." + armor_ext, {
			'armor': parseArmor(turret.find("armor")),
			'transform': turret_position
		}, compress)
		
		gun_position[0] = float(position[0])
		gun_position[1] = float(position[1])
		gun_position[2] = float(position[2])
		
		subprocess.call([
			sys.executable, "convert-primitive.py",
			"-t", textures_path,
			"-o", target_path + "/" + ident + "." + object_ext,
			material_param,
			normals_param,
			uv_param,
			compress_param,
			turret_file
		])
		
		""""-tx", " " + str(turret_position[0]),
			"-ty", " " + str(turret_position[1]),
			"-tz", " " + str(turret_position[2]),"""
		
		for gun in turret.find("guns"):
			gun_ident = gun.tag

			gun_file = models_path + gun.find("hitTester").find("collisionModel").text.strip().replace(".model", ".primitives")
			saveJson(target_path + "/" + gun_ident + "." + armor_ext, {
				'armor': parseArmor(gun.find("armor")),
				'transform': gun_position
			}, compress)
			
			subprocess.call([
				sys.executable, "convert-primitive.py",
				"-t", textures_path,
				"-o", target_path + "/" + gun_ident + "." + object_ext,
				material_param,
				normals_param,
				uv_param,
				compress_param,
				gun_file
			])
			
			""""-tx", " " + str(gun_position[0]),
				"-ty", " " + str(gun_position[1]),
				"-tz", " " + str(gun_position[2]),"""