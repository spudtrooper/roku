<?php
$n = intval($_REQUEST['n']);
$url = 'http://192.168.1.' . $n . ':8060/query/apps';
header('Conten-type: text/xml');
echo file_get_contents($url);
?>