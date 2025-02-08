<?php
/**
 * Этот файл является частью виджета веб-приложения GearMagic.
 * 
 * Файл конфигурации установки виджета.
 * 
 * @link https://gearmagic.ru
 * @copyright Copyright (c) 2015 Веб-студия GearMagic
 * @license https://gearmagic.ru/license/
 */

return [
    'use'         => BACKEND,
    'id'          => 'gm.wd.tinymce',
    'category'    => 'editor',
    'name'        => 'TinyMCE',
    'description' => 'WYSIWYG editor',
    'namespace'   => 'Gm\Widget\TinyMCE',
    'path'        => '/gm/gm.wd.tinymce',
    'locales'     => ['ru_RU', 'en_GB'],
    'events'      => ['gm.be.workspace:onRender'],
    'required'    => [
        ['php', 'version' => '8.2'],
        ['app', 'code' => 'GM MS'],
        ['app', 'code' => 'GM CMS'],
        ['app', 'code' => 'GM CRM'],
        ['module', 'id' => 'gm.be.workspace']
    ]
];
