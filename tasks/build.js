import gulp from 'gulp';
import clean from './clean';
import styles from './styles';
import scripts from './scripts';
import html from './pages';
import locales from './locales';
import images from './images';
import fonts from './fonts';
import manifest from './manifest';
import chromereload from './chromereload';

gulp.task('build', gulp.series(
    'clean',
    gulp.parallel(
        'styles',
        'scripts',
        'html',
        'locales',
        'images',
        'fonts',
        'manifest',
        'chromereload'
    )
));
