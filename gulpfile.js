// gulp
var gulp = require('gulp');
// переименование
var rename = require('gulp-rename');
// минификация css
var minifyCss = require('gulp-minify-css');
// сообщения в системе
var notify = require("gulp-notify");
// префиксы в css
var autoprefixer = require('gulp-autoprefixer');
// авто перезагрузка броузера
var livereload = require('gulp-livereload');
var server = require('gulp-server-livereload');
// less
var less = require('gulp-less');
// gulp.spritesmith - генерация спрайтов
var spritesmith = require('gulp.spritesmith');
// минификация изображений
var imagemin = require('gulp-imagemin');
// меняет пути к библиотекам при сборке
var wiredep = require('wiredep').stream;
// bower
var mainBowerFiles = require('main-bower-files');
// задает последовательность выполнения тасков useref(options [, transformStream1 [, transformStream2 [, ... ]]])
var useref = require('gulp-useref');
// позволяет задавать условия для запуска заданий
var gulpif = require('gulp-if');
// минифицирует js
var uglify = require('gulp-uglify');
// очищает каталог
var clean = require('gulp-clean');
// закачка по фтп (можно по sftp)
var ftp = require('gulp-ftp'); 
// создание фавиконов
var realFavicon = require ('gulp-real-favicon');
// обрабатывает и подробно выводит ошибки
var plumber = require('gulp-plumber');
// обращение к файловой системе
var fs = require('fs');

/// Сборка проекта

// Очищаем папку dist
gulp.task('clean', function () {
  return gulp.src('dist', {read: false})
  .pipe(clean());
});

// копируем шрифты
gulp.task('fonts', ['clean'], function () {
  return gulp.src('app/fonts/*.*')
  .pipe(gulp.dest('dist/fonts/'))
});

// минифицируем графику и сохраняем в папку для
// продакшена, c предварительно добавленными шрифтами
gulp.task('image', ['fonts'], function () {
  return gulp.src('app/img/**')
  .pipe(imagemin())
  .pipe(gulp.dest('dist/img/'))
});

// собираем весь проект для продакшена:
gulp.task('build', ['image'], function () {
  var assets = useref.assets();
  return gulp.src('app/*.html')
  .pipe(plumber()) // plumber
  .pipe(assets)
  .pipe(gulpif('*.js', uglify()))
  .pipe(gulpif('*.css', minifyCss()))
  .pipe(assets.restore())
  .pipe(useref())
  .pipe(gulp.dest('dist'))
});

// Отправка собранного проекта на хостинг:
// очищает папку dist, собирает в нее проект по новой и отправляет на хостинг
gulp.task('ftp', ['build'], function () {

  var ftpObj = {
          host: 'denzakh.ru',
          user: 'fenixx83_stamp2',
          pass: ''
      };  

  // чтение файла с паролем
  ftpObj.pass = fs.readFileSync('psw.txt','utf8');  

  return gulp.src('dist/**/*')
    .pipe(ftp(ftpObj))
});

// запуск локального сервера
// local server with livereload
gulp.task('webserver', function() {
  gulp.src('app')
  .pipe(server({
    livereload: true,
    directoryListing: false,
    open: true,
    // defaultFile: 'index.html'
  }));
});

// создание спрайтов
gulp.task('sprite', function () {
  var spriteData = gulp.src('app/img/sprite/*.*')
  .pipe(spritesmith({
    imgName: 'sprite.png',
    imgPath: '../img/sprite.png',
    cssName: 'sprite.less'
  }));

  spriteData.img
  // .pipe(imagemin()) //графика будет минифицирована при сборке на продакшн
  .pipe(gulp.dest('app/img/'))
  .pipe(notify("Sprite rebuild!"));;

  return spriteData.css
  .pipe(gulp.dest('app/less/'));
});

// компиляция less 
// При ошибке в компиляции падает gulp, нужен перезапуск
gulp.task('less', function () {
  return gulp.src('app/less/style.less')
  .pipe(less())
  .pipe(autoprefixer({
    browsers: ['last 15 versions'],
    cascade: false
  }))
    .pipe(minifyCss())
    .pipe(rename('style.min.css'))
  .pipe(gulp.dest('app/css'))
  .pipe(notify("less скомпилирован!"));
});

// компиляция bootstrap и less файлов
gulp.task('bootstrapCompil', function () {
  return gulp.src('app/bower_components/bootstrap/less/bootstrap.less')
  .pipe(less())
  .pipe(autoprefixer({
    browsers: ['last 15 versions'],
    cascade: false
  }))
  .pipe(minifyCss())
  .pipe(rename('bootstrap.min.css'))
  .pipe(gulp.dest('app/bower_components/bootstrap/dist/css/'))
  .pipe(notify("bootstrap перекомпилировали!"));
});

// автоматом прописывает в html файл пути к библиотекам css и js
gulp.task('bower', function () {
  gulp.src('./app/index.html')
  .pipe(wiredep({
    directory : "app/bower_components"
  }))
  .pipe(gulp.dest('app'));
});

// отслеживаем изменения в проекте 
// less ясен перекомпилирует по новой в css,
// bower - добавляет в html пути к новым библиотекам
// sprite отслеживает появление новой графики для переклеивания спрайта
gulp.task('watch', function (){
  gulp.watch('app/bower_components/bootstrap/less/**/*.less', ['bootstrapCompil']);
  gulp.watch('app/less/**/*.less', ['less']);
  gulp.watch('bower.json', ['bower']);
  gulp.watch('app/img/sprite/*.*', ['sprite']);
});

// основная последовательность запуска
// gulp.task('default', ['webserver', 'sprite', 'less', 'bootstrapCompil', 'bower', 'watch']);
gulp.task('default', ['webserver', 'less', 'bootstrapCompil', 'bower', 'watch']);


// создание фавиконов
// File where the favicon markups are stored
var FAVICON_DATA_FILE = 'faviconData.json';

// Замените TODO: Path to your master picture на путь до вашего исходника
// из которой будут генерироваться иконки.
// Например, assets/images/master_picture.png

// Замените TODO: Path to the directory where to store the icons
// на путь до директории где будут лежать ваши сгенерированые иконки.
// Например, dist/images/icons


gulp.task('generate-favicon', function(done) {
  realFavicon.generateFavicon({
    masterPicture: 'app/img/favicon.png',
    dest: 'app/img/favicons/',
    iconsPath: '/',
    design: {
      ios: {
        pictureAspect: 'backgroundAndMargin',
        backgroundColor: '#ffffff',
        margin: '21%'
      },
      desktopBrowser: {},
      windows: {
        pictureAspect: 'whiteSilhouette',
        backgroundColor: '#da532c',
        onConflict: 'override'
      },
      androidChrome: {
        pictureAspect: 'shadow',
        themeColor: '#ffffff',
        manifest: {
          name: 'PUGOFKA',
          display: 'browser',
          orientation: 'notSet',
          onConflict: 'override'
        }
      },
      safariPinnedTab: {
        pictureAspect: 'silhouette',
        themeColor: '#5bbad5'
      }
    },
    settings: {
      compression: 5,
      scalingAlgorithm: 'Mitchell',
      errorOnImageTooSmall: false
    },
    markupFile: FAVICON_DATA_FILE
  }, function() {
    done();
  });
});


// Вставка в html

// // Замените TODO: List of the HTML files where to inject favicon markups
// на путь до файлов в которые будет вставлен код внедрения favicon.
// Например, ['dist/*.html', 'dist/misc/*.html']

// Замените TODO: Path to the directory where to store the HTML files
// на путь до директории, где хранятся ваши HTML файлы.
gulp.task('inject-favicon-markups', function() {
  gulp.src([ 'app/*.html' ])
    .pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code))
    .pipe(gulp.dest('app/'));
});

// Check for updates on RealFaviconGenerator (think: Apple has just
// released a new Touch icon along with the latest version of iOS).
// Run this task from time to time. Ideally, make it part of your
// continuous integration system.
gulp.task('check-for-favicon-update', function(done) {
  var currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
  realFavicon.checkForUpdates(currentVersion, function(err) {
    if (err) {
      throw err;
    }
  });
});
