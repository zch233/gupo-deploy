#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lib_1 = require("./lib");
var isQuicklyMode = process.argv.findIndex(function (v) { return v === '-ss'; }) >= 0;
if (isQuicklyMode) {
    lib_1.getRemoteTags().stdout.on('end', function () {
        console.log('拉取成功~');
        var gitTagData = '';
        lib_1.getLatestTag().stdout.on('data', function (chunk) { return gitTagData += chunk.toString(); });
        lib_1.getLatestTag().stdout.on('end', function () {
            if (gitTagData) {
                lib_1.publish(gitTagData);
            }
            else {
                console.log('未获取到当前分支下最新的标签~');
                process.exit(0);
            }
        });
    });
}
else {
    var argModeIndex = process.argv.findIndex(function (v) { return v === '--mode'; });
    var argTagIndex = process.argv.findIndex(function (v) { return v === '--oss_tag'; });
    var argMode = argModeIndex >= 0 ? process.argv[argModeIndex + 1] : undefined;
    var argTag = argTagIndex >= 0 ? process.argv[argTagIndex + 1] : undefined;
    require("dotenv").config({ path: require('path').resolve(process.cwd(), ".env" + (argMode ? "." + argMode : '')) });
    console.log('当前环境为:', argMode || '默认（.env）');
    var currentTag_1 = argTag || process.env.OSS_TAG;
    if (!currentTag_1) {
        require("dotenv").config({ path: require('path').resolve(process.cwd(), '.env.development') });
        currentTag_1 = process.env.OSS_TAG;
    }
    if (!currentTag_1) {
        console.log('未设置 OSS_TAG 环境变量');
        process.exit(0);
    }
    lib_1.getRemoteTags().stdout.on('end', function () {
        console.log('拉取成功~');
        var gitTagsData = '';
        lib_1.getLatestTags(currentTag_1).stdout.on('data', function (chunk) { return gitTagsData += chunk.toString(); });
        lib_1.getLatestTags(currentTag_1).stdout.on('end', function () {
            console.log('读取成功~');
            var latestTag = gitTagsData || currentTag_1 + "0.0.0";
            lib_1.publish(latestTag);
        });
    });
}
