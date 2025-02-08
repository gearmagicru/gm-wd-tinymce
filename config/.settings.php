<?php
/**
 * Этот файл является частью виджета веб-приложения GearMagic.
 * 
 * Файл конфигурации настроек виджета.
 * 
 * @link https://gearmagic.ru
 * @copyright Copyright (c) 2015 Веб-студия GearMagic
 * @license https://gearmagic.ru/license/
 */

return [
    'menubar'            => true, // показывать главное меню
    'statusbar'          => true, // показывать строку статуса
    'showToolbar'        => true, // показывать панели инструментов
    'defaultToolbar'     => false, // показывать панель инструментов по умолчанию
    'toolbar_items_size' => 'medium', // размер панели инструментов
    // расширенная проверка элементов
    'extended_valid_elements' => 'img[class|style|src|border|alt|title|hspace|vspace|width|height|align|loading|longdesc|onmouseover|onmouseout|name]',
    // подключаемые плагины
    'plugins' => 'advlist,autolink,lists,link,image,preview,hr,anchor,pagebreak,code,media,nonbreaking,save,table,contextmenu,directionality,textcolor,searchreplace,wordcount,visualblocks,visualchars,paste,fullscreen,paste,link,contextmenu,gmshortcode,gmimage,gmlink',
    // панель инструментов 
    'toolbar' => '',
    // панель инструментов (1-я строка)
    'toolbar1' =>'gmshortcode gmimage gmlink | undo redo | cut copy paste | link unlink image media code table hr | fontselect fontsizeselect | fullscreen',
    // панель инструментов (2-я строка)
    'toolbar2' => 'bold italic underline strikethrough subscript superscript | forecolor backcolor | alignleft aligncenter alignright alignjustify | outdent indent | bullist numlist | removeformat visualchars visualblocks nonbreaking pagebreak',
    // увеличение изображения при нажатии
    'lbAttribute'    => 'data-ligthbox', // атрибут признака увеличения
    'lbSrcAttribute' => 'data-src', // атрибут адреса полного изображения
    'lbPatternFile'  => '_thumb,_medium' // шаблон получения файла полного изображения
];
