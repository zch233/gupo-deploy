#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lib_1 = require("./lib");
var isQuicklyMode = process.argv.findIndex(function (v) { return v === '-ss'; }) >= 0;
var shouldPushCode = process.argv.findIndex(function (v) { return v === '-p' || v === '-push'; }) >= 0;
var releaseAsIndex = process.argv.findIndex(function (v) { return v === '--release_as'; });
var releaseAs = releaseAsIndex >= 0 ? process.argv[releaseAsIndex + 1] : undefined;
if (shouldPushCode)
    (0, lib_1.pushCode)();
if (isQuicklyMode) {
    (0, lib_1.getRemoteTags)().stdout.on('end', function () {
        console.log('拉取成功~');
        var gitTagData = '';
        (0, lib_1.getLatestTag)().stdout.on('data', function (chunk) { return gitTagData += chunk.toString(); });
        (0, lib_1.getLatestTag)().stdout.on('end', function () {
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
    var argModeIndex = process.argv.findIndex(function (v) { return v === '--mode'; });
    var argTagIndex = process.argv.findIndex(function (v) { return v === '--oss_tag'; });
    var argMode = argModeIndex >= 0 ? process.argv[argModeIndex + 1] : undefined;
    var argTag = argTagIndex >= 0 ? process.argv[argTagIndex + 1] : undefined;
    require("dotenv").config({ path: require('path').resolve(process.cwd(), ".env".concat(argMode ? ".".concat(argMode) : '')) });
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
    (0, lib_1.getRemoteTags)().stdout.on('end', function () {
        console.log('拉取成功~');
        var gitTagsData = '';
        (0, lib_1.getLatestTags)(currentTag_1).stdout.on('data', function (chunk) { return gitTagsData += chunk.toString(); });
        (0, lib_1.getLatestTags)(currentTag_1).stdout.on('end', function () {
            console.log('读取成功~');
            var latestTag = releaseAs ? "".concat(currentTag_1).concat(releaseAs) : (gitTagsData || "".concat(currentTag_1, "0.0.0"));
            (0, lib_1.publish)(latestTag, !!releaseAs);
        });
    });
}
