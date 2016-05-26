var gulp = require('gulp'),
    minifyHtml = require('gulp-minify-html'),
    template = require('gulp-template'),
    templateCache = require('gulp-angular-templatecache');

var minifyHtmlOpts = {
    empty: true,
    cdata: true,
    conditionals: true,
    spare: true,
    quotes: true
};

gulp.task('bootstrap3', function () {
    gulp.src('template/bootstrap3/*.html')
        .pipe(template())
        .pipe(minifyHtml(minifyHtmlOpts))
        .pipe(templateCache('image-carousel-tpls-bootstrap3.js', {standalone: false, module: 'image.carousel'}))
        .pipe(gulp.dest('src'));
});

gulp.task('clerk-bootstrap3', function () {
    gulp.src('template/clerk/bootstrap3/*.html')
        .pipe(template())
        .pipe(minifyHtml(minifyHtmlOpts))
        .pipe(templateCache('image-carousel-clerk-tpls-bootstrap3.js', {standalone: false, module: 'image.carousel'}))
        .pipe(gulp.dest('src'));
});

gulp.task('default', ['bootstrap3', 'clerk-bootstrap3']);