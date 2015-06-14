import os
import sys
import subprocess
from convert_tank import convertTank

#subprocess.call([sys.executable, "convert-primitive.py","-nm","-nvt","-nvn","--obj", "hull.obj", "unpacked/vehicles/chinese/Ch01_Type59/collision/Hull.primitives"])
#convertTank("unpacked/scripts/item_defs/vehicles/china/ch01_type59.xml", "unpacked/", "../../../unpacked/", "models/china/ch01_type59/")
#sys.exit(0)

base = "unpacked/scripts/item_defs/vehicles/"
for nation in os.listdir(base):
	if nation != "common":
		for vehicle in os.listdir(base + nation):
			path = base + nation + "/" + vehicle
			if vehicle != "list.xml" and vehicle != "customization.xml" and os.path.isfile(path):
				print "Converting %s" % vehicle
				
				target = "models/" + nation + "/" + vehicle.replace(".xml","")
				if not os.path.exists(target):
					os.makedirs(target)
				
				convertTank(path, "unpacked/", "../../../unpacked/", target)
				#sys.exit(0)