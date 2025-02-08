<?php
/**
 * Виджет веб-приложения GearMagic.
 * 
 * @link https://gearmagic.ru
 * @copyright Copyright (c) 2015 Веб-студия GearMagic
 * @license https://gearmagic.ru/license/
 */

namespace Gm\Widget\TinyMCE;

use Gm;
use Gm\View\ClientScript;
use Gm\View\WidgetResourceTrait;

/**
 * Виджет редактора "TinyMCE".
 * 
 * @link https://www.tiny.cloud
 * 
 * @author Anton Tivonenko <anton.tivonenko@gmail.com>
 * @package Gm\Widget\TinyMCE
 * @since 1.0
 */
class Widget extends \Gm\View\BaseWidget
{
    use WidgetResourceTrait;

    /**
     * Объединить настройки виджета полученные из параметра "settings" конструктора с 
     * параметрами настроек виджета в файле "settings.php".
     * 
     * @var bool
     */
    public bool $mergeSettings = true;

    /**
     * {@inheritdoc}
     */
    public string $id = 'gm.wd.tinymce';

    /**
     * {@inheritdoc}
     */
    public function init(): void
    {
        $self = $this;

        // событие перед выводом параметров в шаблон workspace
        $this->on('gm.be.workspace:onRender', function ($params) use ($self) {
            $self->initScript();
        });
    }

    /**
     * Добавляет пакет скриптов клиенту для подключения редактора.
     * 
     * @return void
     */
    public function initScript(): void
    {
        $url = $this->getAssetsUrl() . '/dist';

        Gm::$app->clientScript
            ->appendPackage('tinymce', [
                'position' => ClientScript::POS_END,
                'js'       => ['tinymce.min.js' => [$url . '/tinymce.min.js']]
            ])
            ->registerPackage('tinymce');
    }

    /**
     * @param \Gm\Panel\Http\Response $response
     * 
     * @return void
     */
    public function initResponse($response): void
    {
        if ($response instanceof \Gm\Panel\Http\Response) {
            $response
                ->meta
                    ->add('jsPath', ['gm.wd.tinymce', $this->getRequireUrl() . '/js'])
                    ->add('requires', 'gm.wd.tinymce.TinyMCE');
        }
    }

    /**
     * Проверяет, имеет ли редактор указанную локализацию.
     * 
     * @param string $locale Имя локали языка.
     * 
     * @return bool
     */
    public function languageExists(string $locale): bool
    {
        return file_exists(__DIR__ . '/../assets/dist/langs/' . $locale . '.js');
    }

    /**
     * Возвращает объявление подключения редактора в HTML. 
     * 
     * @return string
     */
    protected function getContent(): string
    {
        return '<script>tinymce.init(' . json_encode($this->getSettings()->getAll()) . ');</script>';
    }

    /**
     * Добавляет плагин в параметры настроек виджета.
     * 
     * @param string $name Название плагина.
     * 
     * @return void
     */
    public function addPlugin(string $name): void
    {
        /** @var \Gm\Config\Config $settings  */
        $settings = $this->getSettings();

        if (empty($settings->plugins))
            $settings->plugins = $name;
        else
            $settings->plugins = $settings->plugins . ',' . $name;
    }

    /**
     * Удаляет плагины из параметров настроек виджета.
     * 
     * @param array|string $name Название плагина(ов).
     * 
     * @return $this
     */
    public function removePlugin(array|string $name, bool $withButtons = false): static
    {
        /** @var \Gm\Config\Config $settings  */
        $settings = $this->getSettings();

        if (!empty($settings->plugins)) {
            // ['foo', 'bar']
            $plugins = explode(',', $settings->plugins);
            // ['foo' => true, 'bar' => true]
            $plugins = array_fill_keys($plugins, true);
            $names = (array) $name;
            foreach ($names as $key) {
                unset($plugins[$key]);
            }
            $settings->plugins = implode(',', array_keys($plugins));
        }

        if ($withButtons) {
            return $this->removeButton($name);
        }
        return $this;
    }

    /**
     * Удаляет кнопки из параметров настроек виджета.
     * 
     * @param array|string $name Название кнопок.
     * 
     * @return $this
     */
    public function removeButton(array|string $name): static
    {
        /** @var \Gm\Config\Config $settings  */
        $settings = $this->getSettings();

        $name = (array) $name;
        if (!empty($settings->toolbar)) {
            $toolbar = str_replace($name, '', $settings->toolbar);
            $settings->toolbar = trim($toolbar, ' |');
        }

        if (!empty($settings->toolbar1)) {
            $toolbar = str_replace($name, '', $settings->toolbar1);
            $settings->toolbar1 = trim($toolbar, ' |');
        }

        if (!empty($settings->toolbar2)) {
            $toolbar = str_replace($name, '', $settings->toolbar2);
            $settings->toolbar2 = trim($toolbar, ' |');
        }
        return $this;
    }

    /**
     * Возвращает интерфейс редактора Gm.wd.tinymce.TinyMCE GmJS.
     * 
     * @return mixed
     */
    public function run(): mixed
    {
        /** @var array $options  */
        $options = $this->getSettings()->getAll();

        // применение плагинов
        if (!empty($options['plugins'])) {
            $options['plugins'] = str_replace(',', ' ', $options['plugins']);
        }

        // использовать ли панель инструментов по умолчанию
        if ($options['defaultToolbar']) {
            $options['toolbar'] = '';
            unset($options['toolbar1']);
            unset($options['toolbar2']);
        }

        // показывать ли панель инструментов
        if (!$options['showToolbar']) {
            $options['toolbar'] = false;
            unset($options['toolbar1']);
            unset($options['toolbar2']);
        }

        // подключение языка
        $locale = Gm::$app->language->locale;
        if ($this->languageExists($locale)) {
            $options['language'] = $locale;
        }

        if (IS_BACKEND) {
            // не конвертировать URL в относительный путь
            $options['convert_urls'] = false;
            // параметры лайтбокса при вставке изображения
            $options['lightbox'] = [
                'attribute'    => empty($options['lbAttribute']) ? 'data-lightbox' : $options['lbAttribute'],
                'srcAttribute' => empty($options['lbSrcAttribute']) ? 'data-src' : $options['lbSrcAttribute'],
                'namePattern'  => empty($options['lbPatternFile']) ? '_thumb,_medium' : $options['lbPatternFile']
            ];
            unset($options['lbAttribute'], $options['lbSrcAttribute'], $options['lbPatternFile']);

            return [
                'xtype'         => 'tinymce',
                'tinyMCEConfig' => $options,
                'anchor'        => '100% 100%'
            ];
        } else
        if (IS_FRONTEND) {
            return $this->getContent();
        }
        return '';
    }
}