"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPureTag = exports.showVerbose = exports.getFeatureVersion = exports.publish = exports.pushCode = exports.pushTag = exports.addTag = exports.getLatestTags = exports.getLatestTag = exports.getRemoteTags = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const child_process_1 = require("child_process");
const getRemoteTags = () => (0, child_process_1.spawn)('git', ['fetch', '--tags']);
exports.getRemoteTags = getRemoteTags;
const getLatestTag = () => (0, child_process_1.spawn)('git', ['describe']);
exports.getLatestTag = getLatestTag;
const getLatestTags = (currentTag) => (0, child_process_1.spawn)('git', ['tag', '-l', '--sort=-v:refname', `${currentTag}*`]);
exports.getLatestTags = getLatestTags;
const addTag = (version) => (0, child_process_1.spawn)('git', ['tag', '-a', version, '-m', 'auto deploy version']);
exports.addTag = addTag;
const pushTag = () => (0, child_process_1.spawn)('git', ['push', '--tags']);
exports.pushTag = pushTag;
const pushCode = () => (0, child_process_1.spawn)('git', ['push']);
exports.pushCode = pushCode;
const publish = async (latestTag, customer, verboseMode) => {
    let featureTag = '';
    const _latestTag = latestTag.split('\n')[0];
    if (verboseMode) {
        featureTag = await (0, exports.showVerbose)(_latestTag);
    }
    else if (!customer) {
        console.log('当前最新值为:', latestTag.split('\n')[0]);
        featureTag = (0, exports.getFeatureVersion)(_latestTag, 'patch');
    }
    console.log('即将发布为:', featureTag);
    (0, exports.addTag)(featureTag).stdout.on('end', () => {
        console.log('新增成功~');
        (0, exports.pushTag)().stdout.on('end', () => {
            console.log('发布成功~');
        });
        (0, exports.pushTag)().on('error', (chunk) => {
            console.log('发布失败~');
            console.log('请手动运行 `git push --tags`');
            console.log('错误信息:', chunk.toString());
        });
    });
};
exports.publish = publish;
const getFeatureVersion = (tag, mode) => {
    const array = tag.split('.');
    if (mode === 'patch' && array.length > 1) {
        array[array.length - 1] = (Number(array.slice(-1)) + 1).toString();
    }
    else if (mode === 'minor' && array.length === 3) {
        array[array.length - 2] = (Number(array.slice(-2, -1)) + 1).toString();
        array[array.length - 1] = '0';
    }
    else if (mode === 'major') {
        array[0] = array[0].slice(0, -1) + (Number(array[0].slice(array[0].lastIndexOf('v') + 1)) + 1).toString();
        array[array.length - 1] = '0';
        array[array.length - 2] = '0';
    }
    return array.join('.');
};
exports.getFeatureVersion = getFeatureVersion;
const showVerbose = async (tag) => {
    const oldVersion = tag;
    const next = {
        major: (0, exports.getFeatureVersion)(tag, 'major'),
        minor: (0, exports.getFeatureVersion)(tag, 'minor'),
        patch: (0, exports.getFeatureVersion)(tag, 'patch'),
    };
    let prompts = inquirer_1.default.createPromptModule();
    const res = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'release',
            message: `\nThe current version in codeup is ${oldVersion}\nHow would you like to bump it?`,
            default: 'patch',
            pageSize: 10,
            choices: [
                { value: 'major', name: `major (${next.major})` },
                { value: 'minor', name: `minor (${next.minor})` },
                { value: 'patch', name: `patch (${next.patch})` },
                new inquirer_1.default.Separator(),
                { value: 'custom', name: 'custom...' },
            ],
        },
        {
            type: 'input',
            name: 'newVersion',
            message: 'Enter the new version number:',
            default: oldVersion.slice(oldVersion.lastIndexOf('v') + 1),
            when: (previousAnswer_1) => previousAnswer_1.release === 'custom',
            filter: version_1 => version_1.trim().replace(/^[=v]+/, ''),
            validate: (newVersion_1) => {
                return /^\d+$/.test(newVersion_1.split('.').join('')) ? true : 'That\'s not a valid version number';
            },
        },
    ]);
    return res.release === 'custom' ? `${(0, exports.getPureTag)(tag)}res.newVersion` : next[res.release];
};
exports.showVerbose = showVerbose;
const getPureTag = (tag) => tag.slice(0, tag.lastIndexOf('v') + 1);
exports.getPureTag = getPureTag;
