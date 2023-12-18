#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("./lib");
const isQuicklyMode = process.argv.findIndex(v => v === '-ss') >= 0;
const shouldPushCode = process.argv.findIndex(v => v === '-p' || v === '-push') >= 0;
const verboseMode = process.argv.findIndex(v => v === '--verbose') >= 0;
const releaseAsIndex = process.argv.findIndex(v => v === '--release_as');
const releaseAs = releaseAsIndex >= 0 ? process.argv[releaseAsIndex + 1] : undefined;
if (shouldPushCode)
    (0, lib_1.pushCode)();
if (isQuicklyMode) {
    (0, lib_1.getRemoteTags)().stdout.on('end', () => {
        console.log('拉取成功~');
        let gitTagData = '';
        (0, lib_1.getLatestTag)().stdout.on('data', chunk => gitTagData += chunk.toString());
        (0, lib_1.getLatestTag)().stdout.on('end', () => {
            if (gitTagData) {
                (0, lib_1.publish)(gitTagData);
            }
            else {
                console.log('未获取到当前分支下最新的标签~');
                process.exit(0);
            }
        });
    });
}
else {
    const argModeIndex = process.argv.findIndex(v => v === '--mode');
    const argTagIndex = process.argv.findIndex(v => v === '--oss_tag');
    const argEnvDirIndex = process.argv.findIndex(v => v === '--env_dir');
    const argMode = argModeIndex >= 0 ? process.argv[argModeIndex + 1] : undefined;
    const argTag = argTagIndex >= 0 ? process.argv[argTagIndex + 1] : undefined;
    const envDir = argEnvDirIndex >= 0 ? process.argv[argEnvDirIndex + 1] : '';
    require("dotenv").config({ path: require('path').resolve(process.cwd(), envDir, `.env${argMode ? `.${argMode}` : ''}`) });
    console.log('当前环境为:', argMode || '默认');
    let currentTag = argTag || process.env.OSS_TAG;
    if (!currentTag) {
        require("dotenv").config({ path: require('path').resolve(process.cwd(), envDir, '.env.development') });
        currentTag = process.env.OSS_TAG;
    }
    if (!currentTag) {
        console.log('未设置 OSS_TAG 环境变量');
        process.exit(0);
    }
    (0, lib_1.getRemoteTags)().stdout.on('end', () => {
        console.log('拉取成功~');
        let gitTagsData = '';
        (0, lib_1.getLatestTags)(currentTag).stdout.on('data', chunk => gitTagsData += chunk.toString());
        (0, lib_1.getLatestTags)(currentTag).stdout.on('end', () => {
            console.log('读取成功~');
            const latestTag = releaseAs ? `${currentTag}${releaseAs.replace(/.*(?=v\d.\d)/, '').replace('v', '')}` : (gitTagsData || `${currentTag}0.0.0`);
            (0, lib_1.publish)(latestTag, !!releaseAs, verboseMode);
        });
    });
}
