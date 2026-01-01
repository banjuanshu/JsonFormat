const fs = require('fs-extra');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');
const AdmZip = require('adm-zip');

const buildDir = path.join(__dirname, 'dist');
const zipFile = path.join(__dirname, 'JsonFormat.zip');

// Files/Directories to copy directly
const staticAssets = [
    'manifest.json',
    'img'
];

async function build() {
    console.log('Starting build...');

    // 1. Clean up
    if (fs.existsSync(buildDir)) {
        console.log('Cleaning dist directory...');
        fs.removeSync(buildDir);
    }
    fs.ensureDirSync(buildDir);

    if (fs.existsSync(zipFile)) {
        fs.removeSync(zipFile);
    }

    // 2. Process JS
    console.log('Minifying JS...');
    const jsSrcDir = path.join(__dirname, 'js');
    const jsDistDir = path.join(buildDir, 'js');
    fs.ensureDirSync(jsDistDir);

    const jsFiles = fs.readdirSync(jsSrcDir);
    for (const file of jsFiles) {
        if (file.endsWith('.js')) {
            const code = fs.readFileSync(path.join(jsSrcDir, file), 'utf8');
            const minified = await minify(code);
            if (minified.error) {
                console.error(`Error minifying ${file}:`, minified.error);
                process.exit(1);
            }
            fs.writeFileSync(path.join(jsDistDir, file), minified.code);
            console.log(`  Minified ${file}`);
        }
    }

    // 3. Process CSS
    console.log('Minifying CSS...');
    const cssSrcDir = path.join(__dirname, 'css');
    const cssDistDir = path.join(buildDir, 'css');
    fs.ensureDirSync(cssDistDir);

    const cssFiles = fs.readdirSync(cssSrcDir);
    const cleanCss = new CleanCSS();
    for (const file of cssFiles) {
        if (file.endsWith('.css')) {
            const code = fs.readFileSync(path.join(cssSrcDir, file), 'utf8');
            const output = cleanCss.minify(code);
            if (output.errors.length > 0) {
                console.error(`Error minifying ${file}:`, output.errors);
                process.exit(1);
            }
            fs.writeFileSync(path.join(cssDistDir, file), output.styles);
            console.log(`  Minified ${file}`);
        }
    }

    // 4. Copy Static Assets
    console.log('Copying static assets...');
    for (const asset of staticAssets) {
        const srcPath = path.join(__dirname, asset);
        const destPath = path.join(buildDir, asset);
        if (fs.existsSync(srcPath)) {
            fs.copySync(srcPath, destPath);
            console.log(`  Copied ${asset}`);
        } else {
            console.warn(`  Warning: ${asset} not found.`);
        }
    }

    // 5. Zip
    console.log('Creating zip archive...');
    const zip = new AdmZip();
    zip.addLocalFolder(buildDir);
    zip.writeZip(zipFile);
    console.log(`Packaged into ${zipFile}`);
    console.log('Build complete.');
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
