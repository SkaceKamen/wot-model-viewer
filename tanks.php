<?php
$mysqli = new mysqli('localhost', 'root', '', 'wot');
$query = $mysqli->query("SELECT id FROM wot_versions ORDER BY published DESC LIMIT 1");
$version = $query->fetch_object()->id;

function extract_name($name_node, $nation) {
	if (strpos($name_node, $nation . '-') !== false) {
		$name_node = substr($name_node, strpos($name_node, '-') + 1);
	}
	return $name_node;
}

$result = array();
$query = $mysqli->query("SELECT * FROM wot_tanks WHERE wot_version_id = $version ORDER BY secret ASC, level ASC");
while($row = $query->fetch_object()) {
	if ($row->nation == "")
		continue;
	
	$nation = $row->nation;
	$tank = array(
		'node' => extract_name($row->name_node, $nation),
		'name' => @iconv('UTF-8', 'UTF-8//IGNORE', $row->name),
		'class' => $row->class,
		'nation' => $row->nation,
		'chassis' => array(),
		'turrets' => array()
	);
	if (!isset($result[$row->nation])) {
		$result[$row->nation] = array();
	}
	
	if (!isset($result[$row->nation][$row->class])) {
		$result[$row->nation][$row->class] = array();
	}

	$subquery = $mysqli->query("SELECT name, name_node FROM wot_items_chassis WHERE wot_tanks_id = $row->wot_tanks_id ORDER BY level ASC");
	while($subrow = $subquery->fetch_object()) {
		$tank['chassis'][] = array(
			'name' => @iconv('UTF-8', 'UTF-8//IGNORE', $subrow->name),
			'node' => extract_name($subrow->name_node, $nation)
		);
	}
	
	$subquery = $mysqli->query("SELECT wot_items_turrets_id, name, name_node FROM wot_items_turrets WHERE wot_tanks_id = $row->wot_tanks_id ORDER BY level ASC");
	while($subrow = $subquery->fetch_object()) {
		$turret = array(
			'node' => extract_name($subrow->name_node, $nation),
			'name' => @iconv('UTF-8', 'UTF-8//IGNORE', $subrow->name),
			'guns' => array()
		);
		$guns_query = $mysqli->query("
			SELECT name, name_node,
				IFNULL( wot_items_guns_turrets.gun_pitch_limits, wot_items_guns.gun_pitch_limits) AS gun_pitch_limits,
				IFNULL( wot_items_guns_turrets.turret_yaw_limits, wot_items_guns.turret_yaw_limits) AS turret_yaw_limits
			FROM wot_items_guns_turrets
			JOIN wot_items_guns ON wot_items_guns.wot_items_guns_id = wot_items_guns_turrets.wot_items_guns_id
			WHERE wot_items_turrets_id = $subrow->wot_items_turrets_id
			ORDER BY level ASC
		");
		
		while($gun = $guns_query->fetch_object()) {
			$turret['guns'][] = array(
				'node' => extract_name($gun->name_node, $nation),
				'pitch_limits' => $gun->gun_pitch_limits,
				'yaw_limits' => $gun->turret_yaw_limits,
				'name' => @iconv('UTF-8', 'UTF-8//IGNORE', $gun->name)
			);
		}
		$tank['turrets'][$subrow->name_node] = $turret;
	}
	
	$result[$row->nation][$row->class][] = $tank;
}

echo json_encode($result);
?>