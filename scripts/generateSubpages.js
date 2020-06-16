const config = require('../config');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs');
const ProgressBar = require('progress');
const mustache = require('mustache');

const TRACKER_RADAR_DOMAINS_PATH = path.join(config.trackerRadarRepoPath, '/domains/');
const TRACKER_RADAR_ENTITIES_PATH = path.join(config.trackerRadarRepoPath, '/entities/');

const domainFiles = fs.readdirSync(TRACKER_RADAR_DOMAINS_PATH)
    .filter(file => {
        const resolvedPath = path.resolve(process.cwd(), `${TRACKER_RADAR_DOMAINS_PATH}/${file}`);
        const stat = fs.statSync(resolvedPath);

        return stat && stat.isFile() && file.endsWith('.json');
    });
const entityFiles = fs.readdirSync(TRACKER_RADAR_ENTITIES_PATH)
    .filter(file => {
        const resolvedPath = path.resolve(process.cwd(), `${TRACKER_RADAR_ENTITIES_PATH}/${file}`);
        const stat = fs.statSync(resolvedPath);

        return stat && stat.isFile() && file.endsWith('.json');
    });

const progressBar = new ProgressBar('[:bar] :percent ETA :etas :file', {
    complete: chalk.green('='),
    incomplete: ' ',
    total: domainFiles.length,// + entityFiles.length,
    width: 30
});

const stats = {
    failingFiles: 0
};

const templateCache = {};

function getTemplate(name) {
    if (templateCache[name]) {
        return templateCache[name];
    }

    const partialPath = path.resolve(process.cwd(), path.join(config.templatesPath, `${name}.mustache`));
    const partialTemplate = fs.readFileSync(partialPath, 'utf8');

    templateCache[name] = partialTemplate;

    return partialTemplate;
}

domainFiles.forEach(file => {
    progressBar.tick({file});

    const resolvedPath = path.resolve(process.cwd(), `${TRACKER_RADAR_DOMAINS_PATH}/${file}`);
    let data = null;

    try {
        const dataString = fs.readFileSync(resolvedPath, 'utf8');
        data = JSON.parse(dataString);
    } catch (e) {
        stats.failingFiles++;
        return;
    }

    const output = mustache.render(getTemplate('tracker'), data, getTemplate);

    fs.writeFile(path.join(config.domainPagesPath, `${data.domain}.html`), output, () => {});
});