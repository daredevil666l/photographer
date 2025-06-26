<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <?php wp_head();?>

    <style>
    /* === Шрифт === */
    @font-face {
      font-family: "Geometria";
      src: url("<?php echo get_stylesheet_directory_uri();?>/fonts/geometria_light.otf") format("opentype");
    }
    </style>

    <?php if (get_the_ID() != 25): ?>
        <title><?php echo get_the_title(); ?></title>
    <?php else: ?>
      <title><?php wp_title('|', true, 'right');?></title>
    <?php endif; ?>
    <link rel="stylesheet" href="<?php echo get_stylesheet_directory_uri();?>/css/style.css" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover"
    />
  </head>
  <body>
    <!-- Узкая колонка с бургером и вертикальным именем -->
    <aside class="sidebar">
      <button id="burger" aria-label="Открыть меню">
        <span></span><span></span><span></span>
      </button>
      <div class="name">EKATERINA<br />AVRAMENKO</div>
    </aside>

    <!-- Полупрозрачный слой для клика вне меню -->
    <div id="overlay"></div>

    <!-- Сама панель навигации -->
    <nav class="menu">
      <ul>
        <li><a href="<?php echo get_page_link(9);?>" <?php if(get_the_ID() == 9) echo 'class="active"'; ?>>Главная</a></li>
        <li><a href="<?php echo get_page_link(13);?>" <?php if(get_the_ID() == 13) echo 'class="active"'; ?>>Портфолио</a></li>
        <li><a href="<?php echo get_page_link(11);?>" <?php if(get_the_ID() == 11) echo 'class="active"'; ?>>Обо&nbsp;мне</a></li>
        <li><a href="<?php echo get_page_link(15);?>" <?php if(get_the_ID() == 15) echo 'class="active"'; ?>>Онлайн&nbsp;запись</a></li>
        <li><a href="<?php echo get_page_link(33);?>" <?php if(get_the_ID() == 33) echo 'class="active"'; ?>>Услуги</a></li>
        <li><a href="<?php echo get_page_link(37);?>" <?php if(get_the_ID() == 37) echo 'class="active"'; ?>>Блог</a></li>
        <li><a href="<?php echo get_page_link(7);?>" <?php if(get_the_ID() == 7) echo 'class="active"'; ?>>Контакты</a></li>

        <?php if (current_user_can('administrator')): ?>
            <!-- Разделитель -->
            <li class="menu-divider"></li>
            
            <!-- Админские ссылки -->
            <li class="admin-menu-item">
                <a href="<?php echo get_page_link(18);?>" <?php if(get_the_ID() == 18) echo 'class="active"'; ?>>
                    Управление портфолио
                </a>
            </li>
            <li class="admin-menu-item">
                <a href="<?php echo get_page_link(21);?>" <?php if(get_the_ID() == 21) echo 'class="active"'; ?>>
                    Страница для клиента
                </a>
            </li>
            <li class="admin-menu-item">
                <a href="<?php echo get_page_link(23);?>" <?php if(get_the_ID() == 23) echo 'class="active"'; ?>>
                    Управление записью
                </a>
            </li>
            <li class="admin-menu-item">
                <a href="<?php echo get_page_link(35);?>" <?php if(get_the_ID() == 35) echo 'class="active"'; ?>>
                    Управление услугами
                </a>
            </li>
       <?php endif; ?>
      </ul>
    </nav>