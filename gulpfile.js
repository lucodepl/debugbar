'use strict';

var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    concat = require('gulp-concat-util'),
    ngAnnotate = require('gulp-ng-annotate'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    cssmin = require('gulp-cssmin'),
    less = require('gulp-less'),
    meta = require('./package.json');

var paths = {
        output: {
            js: 'dist/js',
            plugins: 'dist/js/plugins',
            css: 'dist/css'
        },
        js: 'src/js/' + meta.name + '.js',
        plugins: 'src/js/plugins/*.js',
        less: 'src/less/' + meta.name + '.less'
    },
    description = {
        top: '/* ' + '\n'
        + '   ' + meta.name + ' v' + meta.version + '\n'
        + '   ' + meta.repository.url + '\n'
        + '   MIT License - ' + meta.author.name + '\n'
        + ' */\n\n'
    };

gulp.task('jshint', function () {
    return gulp.src(paths.js)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('plugins', ['jshint'], function () {
   return gulp.src(paths.plugins)
       .pipe(ngAnnotate())
       .pipe(uglify())
       .pipe(rename({suffix: '.min'}))
       .pipe(gulp.dest(paths.output.plugins));
});

gulp.task('js', ['jshint'], function () {
    return gulp.src(paths.js)
        .pipe(concat.header(description.top))
        .pipe(gulp.dest(paths.output.js))
        .pipe(ngAnnotate())
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(paths.output.js));
});

gulp.task('less', function () {
    return gulp.src(paths.less)
        .pipe(less())
        .pipe(concat.header(description.top))
        .pipe(gulp.dest(paths.output.css));
});

gulp.task('css', ['less'], function () {
    return gulp.src([
        paths.output.css,
        '/',
        meta.name,
        '.css'
    ].join(''))
        .pipe(cssmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(paths.output.css));
});

gulp.task('default', ['js', 'plugins', 'css']);
